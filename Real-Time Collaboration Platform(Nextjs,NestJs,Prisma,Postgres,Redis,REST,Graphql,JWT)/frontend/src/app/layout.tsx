import type { Metadata } from 'next';
import './globals.css';
import { ApolloWrapper } from '@/components/providers/ApolloWrapper';

export const metadata: Metadata = {
  title: 'CollabSpace — Real-Time Collaboration Platform',
  description: 'Chat, tasks, and collaborative docs for teams',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ApolloWrapper>{children}</ApolloWrapper>
      </body>
    </html>
  );
}
