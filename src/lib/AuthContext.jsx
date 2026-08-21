import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { changePassword as updatePassword, isDefaultInitialPassword, requirePasswordChange } from '@/api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const forcePasswordChangeRef = useRef(false);

  const loadProfile = useCallback(async (user) => {
    if (!user) {
      forcePasswordChangeRef.current = false;
      setProfile(null);
      setAuthError(null);
      return;
    }
    let { data, error } = await supabase
      .from('profiles')
      .select('id, email, display_name, role, must_change_password')
      .eq('id', user.id)
      .maybeSingle();

    if (error && (error.code === '42703' || /must_change_password/i.test(error.message || ''))) {
      const fallback = await supabase
        .from('profiles')
        .select('id, email, display_name, role')
        .eq('id', user.id)
        .maybeSingle();
      data = fallback.data ? { ...fallback.data, must_change_password: false } : null;
      error = fallback.error;
    }

    if (error) {
      setAuthError({ type: 'profile_error', message: error.message });
      setProfile(null);
      return;
    }
    if (!data) {
      setAuthError({ type: 'user_not_registered' });
      setProfile(null);
      await supabase.auth.signOut();
      return;
    }
    setAuthError(null);
    setProfile({
      ...data,
      must_change_password: Boolean(data.must_change_password) || forcePasswordChangeRef.current,
    });
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
    await loadProfile(result.data.user);
    return result;
  }, [loadProfile]);

  const changePassword = useCallback(async (payload) => {
    const result = await updatePassword(payload);
    forcePasswordChangeRef.current = false;
    const { data } = await supabase.auth.getUser();
    await loadProfile(data.user);
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
      signIn,
      signOut: () => supabase.auth.signOut(),
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
