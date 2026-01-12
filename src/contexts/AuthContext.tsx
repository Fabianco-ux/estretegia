import React, { createContext, useContext, useEffect, useState } from 'react';
import { Auth, onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { auth as authInstance } from '../services/firebaseClient';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  auth: Auth;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = authInstance;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => { try { unsub(); } catch {} };
  }, [auth]);

  // Plan B: no autenticación anónima; se requiere sesión real persistida

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value: AuthContextType = { currentUser, loading, auth, login, logout };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50">
        <div className="bg-white rounded p-4 shadow-soft">Cargando autenticación…</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
