'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@/lib/types';

export const useAuth = () => {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (sessionData?.session?.user) {
          // Fetch full user profile from database
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', sessionData.session.user.id)
            .single();

          if (userError && userError.code !== 'PGRST116') throw userError;
          setUser(userData || null);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        setError(err instanceof Error ? err.message : 'Auth check failed');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [supabase]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  return { user, isLoading, error, logout };
};
