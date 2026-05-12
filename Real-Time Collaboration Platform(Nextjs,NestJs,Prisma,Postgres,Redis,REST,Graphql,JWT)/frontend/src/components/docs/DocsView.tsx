'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { taskClient } from '@/lib/apollo';
import { GET_DOCUMENTS, CREATE_DOCUMENT } from '@/lib/graphql';
import styles from './DocsView.module.css';
import { formatDistanceToNow } from 'date-fns';

interface Doc {
  id: string;
  title: string;
  updatedAt?: string;
  authorId: string;
}

export default function DocsView() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [showForm, setShowForm] = useState(false);

  const teamId = user?.teamId || 'default-team';

  useEffect(() => {
    if (!user) return;
    taskClient
      .query({ query: GET_DOCUMENTS, variables: { teamId }, fetchPolicy: 'network-only' })
      .then((res) => setDocs(res.data.documentsByTeam || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !user) return;
    setCreating(true);
    try {
      const res = await taskClient.mutate({
        mutation: CREATE_DOCUMENT,
        variables: { title: newTitle.trim(), teamId, authorId: user.id },
      });
      const doc = res.data.createDocument;
      setDocs((prev) => [doc, ...prev]);
      setNewTitle('');
      setShowForm(false);
      router.push(`/workspace/docs/${doc.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Documents</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + New Document
        </button>
      </div>

      {showForm && (
        <div className={styles.overlay} onClick={() => setShowForm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>New Document</h3>
              <button onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate} className={styles.modalForm}>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Document title"
                required
                autoFocus
              />
              <div className={styles.modalActions}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={styles.docGrid}>
        {loading ? (
          <p className={styles.loading}>Loading documents...</p>
        ) : docs.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📄</span>
            <h3>No documents yet</h3>
            <p>Create a document to start collaborating with your team.</p>
          </div>
        ) : (
          docs.map((doc) => (
            <div
              key={doc.id}
              className={styles.docCard}
              onClick={() => router.push(`/workspace/docs/${doc.id}`)}
            >
              <div className={styles.docIcon}>📄</div>
              <div className={styles.docInfo}>
                <span className={styles.docTitle}>{doc.title}</span>
                {doc.updatedAt && (
                  <span className="text-xs text-muted">
                    {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
