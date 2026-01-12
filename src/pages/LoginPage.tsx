import React, { useState } from 'react';
import { signInOrSignUpWithEmail, sendResetPasswordEmail } from '../services/authService';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Ingresa un correo válido');
      return;
    }
    if (!password || password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    setInfo(null);
    try {
      await signInOrSignUpWithEmail(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  // Inicio con Google deshabilitado por política de seguridad

  const fillTestCredentials = () => {
    setEmail('tester@example.com');
    setPassword('Prueba123');
  };

  const onForgotPassword = async () => {
    setError(null);
    setInfo(null);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Ingresa un correo válido para recuperar la contraseña');
      return;
    }
    setLoading(true);
    try {
      await sendResetPasswordEmail(email);
      setInfo('Te enviamos un enlace para restablecer tu contraseña.');
    } catch (err: any) {
      setError(err?.message || 'No se pudo enviar el correo de restablecimiento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-cover bg-center" style={{ backgroundImage: "url('/fondo-metricas.png')" }}>
      <div className="w-full max-w-md">
        <div className="h-2 w-full bg-blue-900 rounded-t" />
        <div className="border-2 border-blue-900 rounded-b-lg bg-white shadow-xl">
          <div className="p-6">
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">Iniciar sesión</h1>
            <p className="text-sm text-gray-700 mb-6">Accede para ver el panel de métricas.</p>

            {error && (
              <div className="mb-4 rounded border border-blue-900 text-blue-900 bg-white px-3 py-2 text-sm">
                {error}
              </div>
            )}
            {info && (
              <div className="mb-4 rounded border border-blue-900 text-blue-900 bg-white px-3 py-2 text-sm">
                {info}
              </div>
            )}

            <form onSubmit={onEmailSubmit} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-800 mb-1">Correo</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  placeholder="tu@correo.com"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-800 mb-1">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  placeholder="••••••"
                />
              </div>
              <div className="flex items-center justify-between">
                <button type="button" onClick={onForgotPassword} className="text-xs text-blue-900 underline">
                  ¿Olvidaste tu contraseña?
                </button>
                <button type="button" onClick={fillTestCredentials} className="text-xs text-black underline">
                  Usar usuario de prueba
                </button>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded bg-black text-white py-2 font-medium hover:bg-neutral-900 disabled:opacity-60"
              >
                {loading ? 'Procesando…' : 'Entrar'}
              </button>
            </form>

            <p className="mt-4 text-xs text-gray-700">Solo acceso por email y contraseña autorizados.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
