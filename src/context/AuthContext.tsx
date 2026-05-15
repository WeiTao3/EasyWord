import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Platform } from 'react-native';
import { Session, User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { deleteUserAccount } from '../services/supabaseDataService';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signUpWithEmail: (email: string, password: string) => Promise<string | null>;
  signInWithEmail: (email: string, password: string) => Promise<string | null>;
  signInWithGoogle: () => Promise<string | null>;
  signInWithApple: () => Promise<string | null>;
  verifySignUpOtp: (email: string, token: string) => Promise<string | null>;
  sendPasswordReset: (email: string) => Promise<string | null>;
  verifyResetOtp: (email: string, token: string) => Promise<string | null>;
  updatePassword: (newPassword: string) => Promise<string | null>;
  deleteAccount: () => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setIsLoading(false), 5000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout);
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signUpWithEmail = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (!error) {
      // Clear the temporary session Supabase stores for the unconfirmed user.
      // scope: 'local' only clears SecureStore — no server call, no side effects.
      // Prevents the stale token from triggering "Invalid Refresh Token" when
      // autoRefreshToken runs before verifyOtp creates the real session.
      await supabase.auth.signOut({ scope: 'local' });
    }
    return error?.message ?? null;
  };

  const signInWithEmail = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  };

  const signInWithGoogle = async (): Promise<string | null> => {
    try {
      const redirectTo = makeRedirectUri({ scheme: 'easyword', path: 'auth/callback' });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) return error.message;
      if (!data.url) return 'Could not initiate Google sign in';

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type === 'success') {
        const url = new URL(result.url);
        // Tokens may be in the fragment (#) or query string (?)
        const params = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : url.search.slice(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        }
      }
      return null;
    } catch (e: any) {
      return e.message ?? 'Google sign in failed';
    }
  };

  const signInWithApple = async (): Promise<string | null> => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) return 'Apple sign in failed: no identity token';
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });
      return error?.message ?? null;
    } catch (e: any) {
      if (e.code === 'ERR_REQUEST_CANCELED') return null; // user cancelled
      return e.message ?? 'Apple sign in failed';
    }
  };

  const verifySignUpOtp = async (email: string, token: string): Promise<string | null> => {
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' });
    return error?.message ?? null;
  };

  const sendPasswordReset = async (email: string): Promise<string | null> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return error?.message ?? null;
  };

  const verifyResetOtp = async (email: string, token: string): Promise<string | null> => {
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'recovery' });
    return error?.message ?? null;
  };

  const updatePassword = async (newPassword: string): Promise<string | null> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return error?.message ?? null;
  };

  const deleteAccount = async (): Promise<string | null> => {
    const error = await deleteUserAccount();
    if (error) return error;
    await AsyncStorage.clear();
    await supabase.auth.signOut({ scope: 'local' });
    return null;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      session, user, isLoading,
      signUpWithEmail, signInWithEmail,
      signInWithGoogle, signInWithApple,
      verifySignUpOtp,
      sendPasswordReset, verifyResetOtp, updatePassword,
      deleteAccount,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
