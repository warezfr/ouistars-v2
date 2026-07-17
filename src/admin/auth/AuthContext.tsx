import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase, hasSupabase } from '@/lib/supabase';

export type Role = 'admin' | 'ops' | 'readonly';

export interface AdminProfile {
  id: string;
  email: string;
  displayName: string | null;
  role: Role;
  active: boolean;
}

interface AuthState {
  loading: boolean;
  configured: boolean;          // Supabase présent ?
  session: boolean;             // connecté ?
  profile: AdminProfile | null; // profil admin (rôle)
  email: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);

  async function loadProfile(uid: string, mail: string | null) {
    if (!supabase) return;
    const { data } = await supabase
      .from('admin_profiles')
      .select('id, email, display_name, role, active')
      .eq('id', uid)
      .maybeSingle();
    if (data) {
      setProfile({
        id: data.id,
        email: data.email,
        displayName: data.display_name,
        role: (data.role as Role) ?? 'readonly',
        active: data.active,
      });
    } else {
      // Connecté mais pas encore autorisé comme admin.
      setProfile({ id: uid, email: mail ?? '', displayName: null, role: 'readonly', active: false });
    }
  }

  async function refresh() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.auth.getSession();
    const s = data.session;
    setSession(Boolean(s));
    setEmail(s?.user.email ?? null);
    if (s?.user) await loadProfile(s.user.id, s.user.email ?? null);
    else setProfile(null);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    if (!supabase) return;
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(Boolean(s));
      setEmail(s?.user.email ?? null);
      if (s?.user) loadProfile(s.user.id, s.user.email ?? null);
      else setProfile(null);
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signIn(mail: string, password: string) {
    if (!supabase) return { error: 'Supabase non configuré.' };
    const { error } = await supabase.auth.signInWithPassword({ email: mail, password });
    if (error) return { error: error.message };
    await refresh();
    return { error: null };
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setSession(false); setProfile(null); setEmail(null);
  }

  return (
    <Ctx.Provider value={{ loading, configured: hasSupabase, session, profile, email, signIn, signOut, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return ctx;
}

export const canWrite = (role: Role | undefined) => role === 'admin' || role === 'ops';
