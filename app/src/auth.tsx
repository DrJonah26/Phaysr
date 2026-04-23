import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from './api';

interface User { id: string; email: string; }

interface AuthCtx {
  user: User | null;
  loading: boolean;
  signup: (email: string, password: string) => Promise<void>;
  signin: (email: string, password: string) => Promise<void>;
  signout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.auth.me()
      .then((r) => setUser(r.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const signup = async (email: string, password: string) => {
    const r = await api.auth.signup(email, password);
    setUser(r.user);
  };

  const signin = async (email: string, password: string) => {
    const r = await api.auth.signin(email, password);
    setUser(r.user);
  };

  const signout = async () => {
    await api.auth.signout();
    setUser(null);
  };

  return <Ctx.Provider value={{ user, loading, signup, signin, signout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}
