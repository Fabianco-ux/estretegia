import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50">
        <div className="bg-white rounded p-4 shadow-soft">Verificando sesión…</div>
      </div>
    );
  }

  // Requiere usuario autenticado no anónimo
  if (!currentUser || currentUser.isAnonymous) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
