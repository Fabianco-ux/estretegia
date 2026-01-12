import React, { useMemo, useState } from 'react';

export type TaskStatus = 'todo' | 'in-progress' | 'done';
export interface TaskBoardItem {
  id: string;
  title: string;
  detail: string;
  status: TaskStatus;
}

interface TaskBoardProps {
  tasks: TaskBoardItem[];
  onUpdate: (task: TaskBoardItem) => void;
  onDelete?: (id: string) => void;
  onAdd?: (task: Omit<TaskBoardItem, 'id'>) => void;
}

export default function TaskBoard({ tasks, onUpdate, onDelete, onAdd }: TaskBoardProps) {
  const [newTitle, setNewTitle] = useState('');
  const [newDetail, setNewDetail] = useState('');

  const columns = useMemo(() => ([
    { key: 'todo' as TaskStatus, title: 'Por hacer' },
    { key: 'in-progress' as TaskStatus, title: 'En progreso' },
    { key: 'done' as TaskStatus, title: 'Hecho' },
  ]), []);

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    onAdd?.({ title: newTitle.trim(), detail: newDetail.trim(), status: 'todo' });
    setNewTitle('');
    setNewDetail('');
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">Taskboard</div>
        <div className="flex items-center gap-2">
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Nueva tarea"
                 className="border rounded px-2 py-1 text-sm" />
          <input value={newDetail} onChange={e => setNewDetail(e.target.value)} placeholder="Detalle"
                 className="border rounded px-2 py-1 text-sm" />
          <button onClick={handleAdd} className="px-2 py-1 text-sm rounded bg-blue-700 text-white hover:bg-blue-800">Agregar</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {columns.map(col => (
          <div key={col.key} className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="font-semibold text-gray-900 mb-2">{col.title}</div>
            <div className="space-y-2">
              {tasks.filter(t => t.status === col.key).map(t => (
                <div key={t.id} className="rounded border border-gray-200 p-2">
                  <input
                    value={t.title}
                    onChange={e => onUpdate({ ...t, title: e.target.value })}
                    className="w-full text-sm font-medium text-gray-900 mb-1 outline-none"
                  />
                  <textarea
                    value={t.detail}
                    onChange={e => onUpdate({ ...t, detail: e.target.value })}
                    className="w-full text-sm text-gray-700 outline-none"
                    rows={2}
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <select
                      value={t.status}
                      onChange={e => onUpdate({ ...t, status: e.target.value as TaskStatus })}
                      className="border rounded px-2 py-1 text-xs"
                    >
                      <option value="todo">Por hacer</option>
                      <option value="in-progress">En progreso</option>
                      <option value="done">Hecho</option>
                    </select>
                    {onDelete && (
                      <button onClick={() => onDelete(t.id)} className="ml-auto px-2 py-1 text-xs rounded bg-green-700 text-white hover:bg-green-800">Eliminar</button>
                    )}
                  </div>
                </div>
              ))}
              {tasks.filter(t => t.status === col.key).length === 0 && (
                <div className="text-xs text-gray-500">Sin tareas</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
