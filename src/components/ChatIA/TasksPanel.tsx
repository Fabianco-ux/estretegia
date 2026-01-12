import React, { useEffect, useState } from 'react';
import TaskBoard, { TaskBoardItem } from './TaskBoard';
import { useAuth } from '../../contexts/AuthContext';
import { subscribeTasks, addTask, updateTask as updateTaskDoc, deleteTask as deleteTaskDoc } from '../../services/tasksService';
import { defaultStrategyMetrics, generateStrategy } from './strategyBot';

export default function TasksPanel() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<TaskBoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [indexWarning, setIndexWarning] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    if (!currentUser) {
      setLoading(false);
      return;
    }
    const unsub = subscribeTasks(currentUser.uid, (items) => {
      setTasks(items.map(i => ({ id: i.id, title: i.title, detail: i.detail, status: i.status })));
      setLoading(false);
    }, (err) => {
      console.error('Firestore subscribe error (tasks):', err?.code, err?.message, err);
      const requiresIndex = err?.code === 'failed-precondition' || (err?.message && String(err.message).toLowerCase().includes('requires an index'));
      if (requiresIndex) {
        // Ocultar el error en UI y mostrar aviso; el fallback ordena en cliente
        setIndexWarning(true);
        setError(null);
      } else {
        setError(err?.message || 'Error cargando tareas');
      }
      setLoading(false);
    });
    return () => { try { unsub(); } catch {} };
  }, [currentUser]);

  const handleGenerateStrategyTasks = async () => {
    const metrics = defaultStrategyMetrics();
    const { tasks: generated } = generateStrategy(metrics);
    if (!currentUser) {
      setTasks(generated.map(t => ({ id: crypto.randomUUID(), title: t.title, detail: t.detail, status: 'todo' })));
      return;
    }
    for (const t of generated) {
      try {
        await addTask(currentUser.uid, { title: t.title, detail: t.detail, status: 'todo' });
      } catch (e) {
        // ignore individual failures
      }
    }
  };

  return (
    <aside className="w-full lg:w-[420px] h-full bg-white rounded shadow-soft border border-gray-200 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="font-medium">Tareas</div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateStrategyTasks}
            disabled={!currentUser}
            className={`px-2 py-1 text-sm rounded ${!currentUser ? 'bg-green-700/50 text-white cursor-not-allowed' : 'bg-green-700 text-white hover:bg-green-800'}`}
          >
            Generar Estrategia
          </button>
        </div>
      </div>
      <div className="p-3 overflow-y-auto flex-1">
        {!currentUser && (
          <div className="mb-3 text-sm text-blue-800 bg-blue-50 border border-blue-200 rounded p-2">
            Inicia sesión para ver y guardar tus tareas.
          </div>
        )}
        {indexWarning && (
          <div className="mb-3 text-sm text-blue-800 bg-blue-50 border border-blue-200 rounded p-2">
            Orden temporal aplicado: creando índice en Firestore. Tus tareas se muestran ordenadas localmente.
          </div>
        )}
        {error && <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded p-2 mb-3">{error}</div>}
        {loading ? (
          <div className="text-sm text-gray-600">Cargando...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 mb-4">
              {tasks.map(t => (
                <div key={t.id} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                  <div className="font-semibold text-gray-900 mb-1">{t.title}</div>
                  <div className="text-sm text-gray-700">{t.detail}</div>
                </div>
              ))}
            </div>
            <TaskBoard
              tasks={tasks}
              onUpdate={async (task) => {
                setTasks(prev => prev.map(p => p.id === task.id ? task : p));
                try { await updateTaskDoc(task.id, { title: task.title, detail: task.detail, status: task.status }); } catch {}
              }}
              onDelete={async (id) => {
                setTasks(prev => prev.filter(p => p.id !== id));
                try { await deleteTaskDoc(id); } catch {}
              }}
              onAdd={async (task) => {
                if (currentUser) {
                  try { await addTask(currentUser.uid, task); } catch {}
                } else {
                  setTasks(prev => [...prev, { id: crypto.randomUUID(), ...task }]);
                }
              }}
            />
          </>
        )}
      </div>
    </aside>
  );
}
