'use client';

import type { ReactNode } from 'react';
import { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/types';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signUp: (email: string, password: string, name: string, role: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Récupérer la session initiale
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          await fetchUserDetails(session.user.id);
        }
      } catch (error) {
        console.error('Erreur initialisation auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user) {
          await fetchUserDetails(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem('elections-camer-user');
        } else if (event === 'USER_UPDATED' && session?.user) {
          await fetchUserDetails(session.user.id);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  const fetchUserDetails = async (userId: string) => {
    try {
      // Récupérer les détails de l'utilisateur depuis la table users
      const { data: userDetails, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Erreur récupération user details:', error);
        return null;
      }

      if (userDetails) {
        const fullUser: User = {
          ...userDetails,
          avatar: userDetails.avatar || `https://i.pravatar.cc/150?u=${userDetails.id}`,
        };
        
        // Stocker en localStorage pour compatibilité (optionnel)
        localStorage.setItem('elections-camer-user', JSON.stringify(fullUser));
        setUser(fullUser);
        return fullUser;
      }
      
      return null;
    } catch (error) {
      console.error('Erreur fetchUserDetails:', error);
      return null;
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (error) {
        throw new Error(error.message || 'Identifiants invalides.');
      }

      if (data.session) {
        // Mettre à jour l'utilisateur immédiatement après la connexion
        await fetchUserDetails(data.session.user.id);
        router.push('/dashboard');
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }, [router]);

  const signUp = useCallback(async (email: string, password: string, name: string, role: string) => {
    setLoading(true);
    
    try {
      // Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role
          }
        }
      });

      if (authError) {
        throw new Error(authError.message || 'Erreur lors de la création du compte.');
      }

      if (authData.user) {
        // Créer l'utilisateur dans la table users
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            name,
            email,
            role,
            avatar: `https://i.pravatar.cc/150?u=${authData.user.id}`
          });

        if (userError) {
          throw new Error('Erreur lors de la création du profil utilisateur.');
        }

        // Rediriger vers la page de connexion
        router.push('/login?message=Compte créé avec succès. Veuillez vous connecter.');
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      localStorage.removeItem('elections-camer-user');
      router.push('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  }, [router]);

  const value = { 
    user, 
    loading, 
    login, 
    logout, 
    signUp 
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
