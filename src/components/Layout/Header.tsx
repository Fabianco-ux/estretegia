import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  userName?: string;
  avatarUrl?: string;
}

export default function Header({ userName, avatarUrl }: HeaderProps) {
  const { currentUser, logout } = useAuth();
  const displayName = userName || currentUser?.displayName || currentUser?.email || undefined;
  const photo = avatarUrl || currentUser?.photoURL || undefined;
  return (
    <header className="shadow-soft bg-white">
      <div className="container flex items-center justify-between py-3">
        <div className="flex items-center gap-2">
          <img src="/logotipo-intelligent.png?v=2" alt="Logo Intelligent" className="h-8 w-auto" />
          <span className="text-lg font-semibold">Métricas</span>
        </div>
        <div className="flex items-center gap-3">
          {photo && (
            <img src={photo} alt="avatar" className="w-8 h-8 rounded-full" />
          )}
          {displayName && <span className="text-sm text-gray-700">{displayName}</span>}
        </div>
      </div>
    </header>
  );
}
