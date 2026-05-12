'use client';
import { useParams } from 'next/navigation';
import DocEditor from '@/components/docs/DocEditor';

export default function DocPage() {
  const { id } = useParams();
  return <DocEditor docId={id as string} />;
}
