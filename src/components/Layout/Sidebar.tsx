import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { isEmbedMode } from '../../utils/embed';

export default function Sidebar() {
  const { pathname } = useLocation();
  if (isEmbedMode()) return null;
  const itemClass = (path: string) => `block px-4 py-2 rounded ${pathname === path ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`;

  return (
    <aside className="w-64 border-r border-gray-200 bg-white">
      <nav className="p-4 space-y-2">
        <Link to="/dashboard" className={itemClass('/dashboard')}>Dashboard</Link>
        <Link to="/chat" className={itemClass('/chat')}>Chat IA</Link>
      </nav>
    </aside>
  );
}
