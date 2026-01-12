import { onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { getAuthClient } from './firebaseClient';

function getAuthOrThrow() {
  const auth = getAuthClient();
  return auth;
}

export async function signInOrSignUpWithEmail(email: string, password: string) {
  const auth = getAuthOrThrow();
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const token = await cred.user.getIdToken();
    localStorage.setItem('auth_token', token);
    return cred.user;
  } catch (err: any) {
    // Si no existe el usuario, lo creamos automáticamente
    if (err?.code === 'auth/user-not-found') {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      try { await sendEmailVerification(cred.user); } catch {}
      const token = await cred.user.getIdToken();
      localStorage.setItem('auth_token', token);
      return cred.user;
    }
    throw err;
  }
}

export async function signOutUser() {
  const auth = getAuthOrThrow();
  await signOut(auth);
  localStorage.removeItem('auth_token');
}

export function listenAuth(callback: (user: User | null) => void) {
  const auth = getAuthOrThrow();
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser() {
  const auth = getAuthOrThrow();
  return auth.currentUser;
}

export async function sendResetPasswordEmail(email: string) {
  const auth = getAuthOrThrow();
  await sendPasswordResetEmail(auth, email);
}
