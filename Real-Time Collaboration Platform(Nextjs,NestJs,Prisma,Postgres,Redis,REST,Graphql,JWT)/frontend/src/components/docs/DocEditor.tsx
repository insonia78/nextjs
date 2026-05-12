'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useAuthStore } from '@/store/auth.store';
import { taskClient } from '@/lib/apollo';
import { GET_DOCUMENT, UPDATE_DOCUMENT_CONTENT, UPDATE_DOCUMENT_TITLE } from '@/lib/graphql';
import styles from './DocEditor.module.css';

const COLORS = ['#e94560', '#533483', '#3b82f6', '#10b981', '#f59e0b'];
function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

export default function DocEditor({ docId }: { docId: string }) {
  const { user } = useAuthStore();
  const [doc, setDoc] = useState<{ id: string; title: string; content: string } | null>(null);
  const [title, setTitle] = useState('');
  const [savingTitle, setSavingTitle] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Load doc data
  useEffect(() => {
    if (!docId) return;
    taskClient
      .query({ query: GET_DOCUMENT, variables: { id: docId } })
      .then((res) => {
        const d = res.data.document;
        setDoc(d);
        setTitle(d.title);
      })
      .catch(console.error);
  }, [docId]);

  // Yjs setup
  useEffect(() => {
    if (!docId || !user) return;

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const wsUrl = process.env.NEXT_PUBLIC_CHAT_WS_URL?.replace('ws://', 'ws://') || 'ws://localhost:4002';
    const provider = new WebsocketProvider(`${wsUrl}/yjs`, `doc-${docId}`, ydoc);
    providerRef.current = provider;

    provider.awareness.setLocalStateField('user', {
      name: user.username,
      color: randomColor(),
    });

    return () => {
      provider.destroy();
      ydoc.destroy();
    };
  }, [docId, user]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }),
      ...(ydocRef.current
        ? [
            Collaboration.configure({ document: ydocRef.current }),
            CollaborationCursor.configure({
              provider: providerRef.current!,
              user: { name: user?.username || 'Guest', color: randomColor() },
            }),
          ]
        : []),
    ],
    content: doc?.content || '',
    editable: true,
    onUpdate: ({ editor }) => {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        const html = editor.getHTML();
        try {
          await taskClient.mutate({
            mutation: UPDATE_DOCUMENT_CONTENT,
            variables: { id: docId, content: html },
          });
          setSavedAt(new Date());
        } catch (err) {
          console.error(err);
        }
      }, 1500);
    },
  }, [ydocRef.current]);

  const handleTitleBlur = useCallback(async () => {
    if (!title.trim() || title === doc?.title) return;
    setSavingTitle(true);
    try {
      await taskClient.mutate({
        mutation: UPDATE_DOCUMENT_TITLE,
        variables: { id: docId, title: title.trim() },
      });
      setDoc((d) => d ? { ...d, title: title.trim() } : d);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingTitle(false);
    }
  }, [title, doc?.title, docId]);

  if (!doc) {
    return <div className={styles.loading}>Loading document...</div>;
  }

  return (
    <div className={styles.container}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          <button
            className={styles.toolBtn}
            onClick={() => editor?.chain().focus().toggleBold().run()}
            data-active={editor?.isActive('bold')}
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            className={styles.toolBtn}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            data-active={editor?.isActive('italic')}
            title="Italic"
          >
            <em>I</em>
          </button>
          <button
            className={styles.toolBtn}
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            data-active={editor?.isActive('strike')}
            title="Strike"
          >
            <s>S</s>
          </button>
          <div className={styles.divider} />
          <button
            className={styles.toolBtn}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            data-active={editor?.isActive('heading', { level: 1 })}
          >
            H1
          </button>
          <button
            className={styles.toolBtn}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            data-active={editor?.isActive('heading', { level: 2 })}
          >
            H2
          </button>
          <div className={styles.divider} />
          <button
            className={styles.toolBtn}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            data-active={editor?.isActive('bulletList')}
          >
            • List
          </button>
          <button
            className={styles.toolBtn}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            data-active={editor?.isActive('orderedList')}
          >
            1. List
          </button>
          <button
            className={styles.toolBtn}
            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
            data-active={editor?.isActive('codeBlock')}
          >
            {'</>'}
          </button>
        </div>
        <div className={styles.saveStatus}>
          {savingTitle ? '💾 Saving title...' : savedAt ? `✓ Saved ${savedAt.toLocaleTimeString()}` : null}
        </div>
      </div>

      {/* Title */}
      <div className={styles.titleArea}>
        <input
          className={styles.titleInput}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          placeholder="Document title"
        />
      </div>

      {/* Editor */}
      <div className={styles.editorArea}>
        <EditorContent editor={editor} className={styles.editor} />
      </div>
    </div>
  );
}
