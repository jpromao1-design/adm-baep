import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/api/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadProfile(user) {
      if (!user) {
        if (mounted) {
          setProfile(null);
          setAuthError(null);
        }
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, display_name, role')
        .eq('id', user.id)
        .maybeSingle();

      if (!mounted) return;
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
      setProfile(data);
    }

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
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError,
      isAuthenticated: Boolean(session?.user && profile),
      signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
      signOut: () => supabase.auth.signOut(),
    }),
    [session, profile, isLoadingAuth, authError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
