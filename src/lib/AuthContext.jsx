import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { changePassword as updatePassword, isDefaultInitialPassword, requirePasswordChange } from '@/api/auth';
import { touchLastLogin } from '@/api/users';
import { can, isAdmin as checkIsAdmin } from '@/lib/permissions';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const forcePasswordChangeRef = useRef(false);
  const retainAuthErrorRef = useRef(false);

  const loadProfile = useCallback(async (user) => {
    if (!user) {
      forcePasswordChangeRef.current = false;
      setProfile(null);
      if (!retainAuthErrorRef.current) setAuthError(null);
      retainAuthErrorRef.current = false;
      return { profile: null, error: null };
    }

    // Colunas básicas primeiro — o login não quebra se migrations opcionais faltarem.
    let { data, error } = await supabase
      .from('profiles')
      .select('id, email, display_name, role')
      .eq('id', user.id)
      .maybeSingle();

    if (!error && data) {
      const defaults = {
        must_change_password: false,
        active: true,
        phone: null,
        unit: null,
        last_login_at: null,
      };
      let extended = await supabase
        .from('profiles')
        .select('must_change_password, active, phone, unit, last_login_at')
        .eq('id', user.id)
        .maybeSingle();
      if (extended.error && (extended.error.code === '42703' || /must_change_password|active|phone|unit|last_login/i.test(extended.error.message || ''))) {
        extended = await supabase
          .from('profiles')
          .select('active, phone, unit, last_login_at')
          .eq('id', user.id)
          .maybeSingle();
        if (extended.error && (extended.error.code === '42703' || /active|phone|unit|last_login/i.test(extended.error.message || ''))) {
          data = { ...data, ...defaults };
        } else {
          data = { ...data, ...defaults, ...(extended.data || {}) };
        }
      } else if (!extended.error && extended.data) {
        data = { ...data, ...defaults, ...extended.data };
      } else {
        data = { ...data, ...defaults };
      }
    }

    if (error) {
      const authErr = { type: 'profile_error', message: error.message || 'Erro ao carregar perfil.' };
      retainAuthErrorRef.current = true;
      setAuthError(authErr);
      setProfile(null);
      await supabase.auth.signOut();
      return { profile: null, error: authErr };
    }

    if (!data) {
      const authErr = {
        type: 'user_not_registered',
        message: 'Este e-mail não está autorizado. Solicite acesso abaixo.',
      };
      retainAuthErrorRef.current = true;
      setAuthError(authErr);
      setProfile(null);
      await supabase.auth.signOut();
      return { profile: null, error: authErr };
    }

    if (data.active === false) {
      const authErr = { type: 'user_inactive', message: 'Sua conta está inativa. Contate o administrador.' };
      retainAuthErrorRef.current = true;
      setAuthError(authErr);
      setProfile(null);
      await supabase.auth.signOut();
      return { profile: null, error: authErr };
    }

    setAuthError(null);
    const nextProfile = {
      ...data,
      active: data.active !== false,
      must_change_password: Boolean(data.must_change_password) || forcePasswordChangeRef.current,
    };
    setProfile(nextProfile);
    void touchLastLogin();
    return { profile: nextProfile, error: null };
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      loadProfile(data.session?.user).finally(() => {
        if (mounted) setIsLoadingAuth(false);
      });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      loadProfile(next?.user);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email, password) => {
    setAuthError(null);
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.error) return result;

    forcePasswordChangeRef.current = isDefaultInitialPassword(password);
    if (forcePasswordChangeRef.current) {
      try {
        await requirePasswordChange();
      } catch {
        // RPC disponível após migration-password-change.sql
      }
    }

    const { profile: profileData, error: profileErr } = await loadProfile(result.data.user);
    if (!profileData) {
      return {
        data: { user: null, session: null },
        error: {
          message: profileErr?.message || 'Não foi possível carregar seu perfil. Verifique se o e-mail está autorizado.',
        },
      };
    }
    return result;
  }, [loadProfile]);

  const changePassword = useCallback(async (payload) => {
    const result = await updatePassword(payload);
    forcePasswordChangeRef.current = false;
    const { data } = await supabase.auth.getUser();
    const { profile: next } = await loadProfile(data.user);
    if (next?.must_change_password) {
      throw new Error('Senha atualizada, mas a troca obrigatória permanece ativa. Execute a migration fix-015 no Supabase.');
    }
    return result;
  }, [loadProfile]);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError,
      isAuthenticated: Boolean(session?.user && profile),
      mustChangePassword: Boolean(profile?.must_change_password),
      isAdmin: checkIsAdmin(profile),
      can: (permission) => can(profile, permission),
      signIn,
      signOut: () => {
        retainAuthErrorRef.current = false;
        setAuthError(null);
        return supabase.auth.signOut();
      },
      changePassword,
    }),
    [session, profile, isLoadingAuth, authError, signIn, changePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
