import React, { useEffect, useRef, useState } from 'react';
import { signInOrSignUpWithEmail } from '../../services/authService';

export default function EmailLoginButton() {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);

  const open = () => setShowForm(true);
  const close = () => setShowForm(false);

  useEffect(() => {
    if (showForm) setTimeout(() => emailRef.current?.focus(), 0);
  }, [showForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Ingresa un correo válido');
      return;
    }
    if (!password || password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      const user = await signInOrSignUpWithEmail(email, password);
      setMessage(user.emailVerified ? 'Sesión iniciada' : 'Cuenta creada. Verifica tu correo');
    } catch (err: any) {
      const code = err?.code || 'unknown';
      const msg = err?.message || 'Error al iniciar sesión';
      setError(`${msg} (${code})`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button onClick={open} className="w-full px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300">
        Continuar con Email
      </button>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-soft w-full max-w-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold">Acceder con Email</h2>
              <button onClick={close} aria-label="Cerrar" className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                ref={emailRef}
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
              <input
                type="password"
                placeholder="Contraseña (mín. 6)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
              {error && <p className="text-red-600 text-sm">{error}</p>}
              {message && <p className="text-green-700 text-sm">{message}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? 'Procesando…' : 'Entrar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
