'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useTaskStore, Task } from '@/store/task.store';
import { taskClient } from '@/lib/apollo';
import { GET_TASKS, CREATE_TASK, UPDATE_TASK_STATUS, DELETE_TASK } from '@/lib/graphql';
import { notifyApi } from '@/lib/api';
import styles from './TasksView.module.css';

const COLUMNS: { key: Task['status']; label: string; color: string }[] = [
  { key: 'TODO', label: '📋 To Do', color: '#6b7280' },
  { key: 'IN_PROGRESS', label: '⚡ In Progress', color: '#f59e0b' },
  { key: 'IN_REVIEW', label: '👁 In Review', color: '#8b5cf6' },
  { key: 'DONE', label: '✅ Done', color: '#10b981' },
];

export default function TasksView() {
  const { user } = useAuthStore();
  const { tasks, setTasks, addTask, updateTask, removeTask } = useTaskStore();
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [dragTask, setDragTask] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as Task['priority'],
    assignedTo: '',
  });

  const teamId = user?.teamId || 'default-team';

  useEffect(() => {
    if (!user) return;
    taskClient.query({ query: GET_TASKS, variables: { teamId }, fetchPolicy: 'network-only' })
      .then((res) => setTasks(res.data.tasksByTeam || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim() || !user) return;
    try {
      const res = await taskClient.mutate({
        mutation: CREATE_TASK,
        variables: {
          title: newTask.title.trim(),
          teamId,
          createdBy: user.id,
          description: newTask.description || undefined,
          assignedTo: newTask.assignedTo || undefined,
          priority: newTask.priority,
        },
      });
      addTask(res.data.createTask);
      setShowModal(false);
      setNewTask({ title: '', description: '', priority: 'MEDIUM', assignedTo: '' });

      // Notify if assigned
      if (newTask.assignedTo) {
        await notifyApi.send(newTask.assignedTo, `New task assigned: ${newTask.title}`, 'task');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (taskId: string, status: Task['status']) => {
    updateTask(taskId, { status });
    try {
      await taskClient.mutate({
        mutation: UPDATE_TASK_STATUS,
        variables: { id: taskId, status },
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (taskId: string) => {
    removeTask(taskId);
    try {
      await taskClient.mutate({ mutation: DELETE_TASK, variables: { id: taskId } });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDragStart = (taskId: string) => setDragTask(taskId);
  const handleDrop = (status: Task['status']) => {
    if (dragTask) {
      handleStatusChange(dragTask, status);
      setDragTask(null);
    }
  };

  const getTasksByStatus = (status: Task['status']) => tasks.filter((t) => t.status === status);

  const priorityColors: Record<Task['priority'], string> = {
    LOW: '#6b7280',
    MEDIUM: '#3b82f6',
    HIGH: '#f59e0b',
    URGENT: '#ef4444',
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Tasks Board</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + New Task
        </button>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className={styles.loading}>Loading tasks...</div>
      ) : (
        <div className={styles.board}>
          {COLUMNS.map((col) => (
            <div
              key={col.key}
              className={styles.column}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(col.key)}
            >
              <div className={styles.columnHeader} style={{ borderTopColor: col.color }}>
                <span>{col.label}</span>
                <span className={styles.count}>{getTasksByStatus(col.key).length}</span>
              </div>
              <div className={styles.columnBody}>
                {getTasksByStatus(col.key).map((task) => (
                  <div
                    key={task.id}
                    className={styles.taskCard}
                    draggable
                    onDragStart={() => handleDragStart(task.id)}
                  >
                    <div className={styles.taskHeader}>
                      <span
                        className={styles.priority}
                        style={{ color: priorityColors[task.priority] }}
                      >
                        ● {task.priority}
                      </span>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(task.id)}
                        title="Delete task"
                      >
                        ✕
                      </button>
                    </div>
                    <p className={styles.taskTitle}>{task.title}</p>
                    {task.description && (
                      <p className={styles.taskDesc}>{task.description}</p>
                    )}
                    {task.assignedTo && (
                      <div className={styles.assignee}>
                        <div className="avatar" style={{ width: 20, height: 20, fontSize: 10 }}>
                          {task.assignedTo[0]?.toUpperCase()}
                        </div>
                        <span className="text-xs text-muted">{task.assignedTo.slice(0, 8)}</span>
                      </div>
                    )}
                    <div className={styles.taskActions}>
                      {COLUMNS.filter((c) => c.key !== task.status).map((c) => (
                        <button
                          key={c.key}
                          className={styles.moveBtn}
                          onClick={() => handleStatusChange(task.id, c.key)}
                          title={`Move to ${c.label}`}
                        >
                          → {c.key.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {getTasksByStatus(col.key).length === 0 && (
                  <div className={styles.emptyCol}>Drop tasks here</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Create Task</h3>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate} className={styles.modalForm}>
              <div className={styles.field}>
                <label>Title *</label>
                <input
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Task title"
                  required
                  autoFocus
                />
              </div>
              <div className={styles.field}>
                <label>Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Optional description"
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div className={styles.field}>
                <label>Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task['priority'] })}
                  className={styles.select}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Assign to (user ID)</label>
                <input
                  value={newTask.assignedTo}
                  onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                  placeholder="User ID (optional)"
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
