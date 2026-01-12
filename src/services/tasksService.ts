import { db } from '../firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

export type TaskStatus = 'todo' | 'in-progress' | 'done';
export interface TaskDoc {
  id: string;
  ownerUid: string;
  title: string;
  detail: string;
  status: TaskStatus;
  createdAt?: any;
  updatedAt?: any;
}

const TASKS_COL = 'tasks';

export function subscribeTasks(ownerUid: string, cb: (tasks: TaskDoc[]) => void, onError?: (err: any) => void) {
  const col = collection(db, TASKS_COL);
  const q = query(col, where('ownerUid', '==', ownerUid), orderBy('createdAt', 'asc'));

  let primaryUnsub: undefined | (() => void);
  let fallbackUnsub: undefined | (() => void);

  const sortByCreatedAt = (arr: TaskDoc[]) => {
    return arr.sort((a: any, b: any) => {
      const aMs = (a?.createdAt?.toMillis?.() ?? (a?.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0));
      const bMs = (b?.createdAt?.toMillis?.() ?? (b?.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0));
      return aMs - bMs;
    });
  };

  primaryUnsub = onSnapshot(q, (snap) => {
    const items: TaskDoc[] = [];
    snap.forEach((d) => {
      const data = d.data() as any;
      items.push({ id: d.id, ...data });
    });
    cb(items);
  }, (err) => {
    // Índice faltante u otros errores
    console.error('Firestore tasks subscribe error:', err?.code, err?.message);
    onError?.(err);
    const requiresIndex = err?.code === 'failed-precondition' || (err?.message && String(err.message).toLowerCase().includes('requires an index'));
    if (requiresIndex && !fallbackUnsub) {
      // Fallback: consulta sin orderBy y ordenar en cliente
      const qFallback = query(col, where('ownerUid', '==', ownerUid));
      fallbackUnsub = onSnapshot(qFallback, (snap2) => {
        const items2: TaskDoc[] = [];
        snap2.forEach((d) => {
          const data = d.data() as any;
          items2.push({ id: d.id, ...data });
        });
        cb(sortByCreatedAt(items2));
      }, (err2) => {
        console.error('Firestore tasks fallback error:', err2?.code, err2?.message);
        onError?.(err2);
      });
    }
  });

  return () => {
    try { primaryUnsub && primaryUnsub(); } catch {}
    try { fallbackUnsub && fallbackUnsub(); } catch {}
  };
}

export async function addTask(ownerUid: string, task: { title: string; detail: string; status: TaskStatus }) {
  const col = collection(db, TASKS_COL);
  const payload = { ownerUid, ...task, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
  const ref = await addDoc(col, payload);
  return ref.id;
}

export async function updateTask(id: string, task: Partial<Pick<TaskDoc, 'title' | 'detail' | 'status'>>) {
  const ref = doc(db, TASKS_COL, id);
  await updateDoc(ref, { ...task, updatedAt: serverTimestamp() });
}

export async function deleteTask(id: string) {
  const ref = doc(db, TASKS_COL, id);
  await deleteDoc(ref);
}
