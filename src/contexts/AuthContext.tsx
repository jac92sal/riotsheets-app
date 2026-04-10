
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, functions, getToken, clearToken } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
}

interface SubscriptionInfo {
  subscribed: boolean;
  subscription_tier: string;
  subscription_end: string | null;
  monthly_analyses_used: number;
  monthly_analyses_limit: number;
}

interface AuthContextType {
  user: User | null;
  session: { access_token: string; user: User } | null;
  subscription: SubscriptionInfo | null;
  loading: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  checkSubscription: () => Promise<void>;
  incrementUsage: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Anonymous user rate limiting
const ANONYMOUS_DAILY_LIMIT = 3;
const ANONYMOUS_STORAGE_KEY = 'riot_sheets_anonymous_usage';

const getAnonymousUsage = () => {
  try {
    const stored = localStorage.getItem(ANONYMOUS_STORAGE_KEY);
    if (!stored) return { count: 0, date: new Date().toDateString() };
    const parsed = JSON.parse(stored);
    if (parsed.date !== new Date().toDateString()) return { count: 0, date: new Date().toDateString() };
    return parsed;
  } catch { return { count: 0, date: new Date().toDateString() }; }
};

const updateAnonymousUsage = (count: number) => {
  try {
    localStorage.setItem(ANONYMOUS_STORAGE_KEY, JSON.stringify({ count, date: new Date().toDateString() }));
  } catch { /* noop */ }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<{ access_token: string; user: User } | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const checkSubscription = async () => {
    if (!getToken()) return;
    try {
      const { data, error } = await functions.invoke('check-subscription');
      if (!error && data) setSubscription(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const incrementUsage = async (): Promise<boolean> => {
    if (!user || !session) {
      const anonymousUsage = getAnonymousUsage();
      if (anonymousUsage.count >= ANONYMOUS_DAILY_LIMIT) {
        toast({
          title: 'Daily Limit Reached',
          description: `You've used ${ANONYMOUS_DAILY_LIMIT} free transcriptions today. Sign up for unlimited access!`,
          variant: 'destructive',
        });
        return false;
      }
      updateAnonymousUsage(anonymousUsage.count + 1);
      toast({ title: 'Transcription Starting', description: `Free usage: ${anonymousUsage.count + 1}/${ANONYMOUS_DAILY_LIMIT} today` });
      return true;
    }

    if (!subscription) return true;

    if (subscription.monthly_analyses_used >= subscription.monthly_analyses_limit && !subscription.subscribed) {
      toast({ title: 'Usage Limit Reached', description: 'You\'ve reached your monthly analysis limit. Upgrade to continue!', variant: 'destructive' });
      return false;
    }

    // Update local state (backend tracks usage via analysis saves)
    setSubscription(prev => prev ? { ...prev, monthly_analyses_used: prev.monthly_analyses_used + 1 } : null);
    return true;
  };

  const signUp = async (email: string, password: string, name?: string) => {
    const { data, error } = await auth.signUp(email, password, name);
    if (!error && data?.user) {
      setUser(data.user);
      setSession({ access_token: data.token, user: data.user });
      toast({ title: 'Account created!', description: 'Welcome to Riot Sheets!' });
    }
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await auth.signIn(email, password);
    if (!error && data?.user) {
      setUser(data.user);
      setSession({ access_token: data.token, user: data.user });
    }
    return { error };
  };

  const signOut = async () => {
    await auth.signOut();
    setUser(null);
    setSession(null);
    setSubscription(null);
  };

  useEffect(() => {
    // Check for existing token on mount
    const token = getToken();
    if (token) {
      auth.getUser().then(({ data, error }) => {
        if (data?.user) {
          setUser(data.user);
          setSession({ access_token: token, user: data.user });
          checkSubscription();
        } else {
          clearToken();
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }

    // Cross-tab sync via storage events
    const handler = (e: StorageEvent) => {
      if (e.key === 'riot_sheets_token') {
        if (e.newValue) {
          auth.getUser().then(({ data }) => {
            if (data?.user) {
              setUser(data.user);
              setSession({ access_token: e.newValue!, user: data.user });
            }
          });
        } else {
          setUser(null);
          setSession(null);
          setSubscription(null);
        }
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const value = { user, session, subscription, loading, signUp, signIn, signOut, checkSubscription, incrementUsage };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
