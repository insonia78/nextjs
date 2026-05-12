'use client';
import { ApolloProvider } from '@apollo/client';
import { chatClient } from '@/lib/apollo';

export function ApolloWrapper({ children }: { children: React.ReactNode }) {
  return <ApolloProvider client={chatClient}>{children}</ApolloProvider>;
}
