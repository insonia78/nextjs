import { ApolloClient, InMemoryCache, split, HttpLink } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

const CHAT_GQL = process.env.NEXT_PUBLIC_CHAT_GQL_URL || 'http://localhost:4002/graphql';
const TASK_GQL = process.env.NEXT_PUBLIC_TASK_GQL_URL || 'http://localhost:4003/graphql';
const CHAT_WS = (process.env.NEXT_PUBLIC_CHAT_GQL_URL || 'http://localhost:4002/graphql')
  .replace('http', 'ws');

function getToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('token') || '';
}

// Chat GraphQL client (with subscriptions)
const chatWsLink = new GraphQLWsLink(
  createClient({
    url: CHAT_WS,
    connectionParams: () => ({ Authorization: `Bearer ${getToken()}` }),
  }),
);

const chatHttpLink = new HttpLink({
  uri: CHAT_GQL,
  headers: { Authorization: `Bearer ${getToken()}` },
});

const chatSplitLink = split(
  ({ query }) => {
    const def = getMainDefinition(query);
    return def.kind === 'OperationDefinition' && def.operation === 'subscription';
  },
  chatWsLink,
  chatHttpLink,
);

export const chatClient = new ApolloClient({
  link: chatSplitLink,
  cache: new InMemoryCache(),
});

// Task GraphQL client
export const taskClient = new ApolloClient({
  link: new HttpLink({
    uri: TASK_GQL,
    fetch: (uri, options) => {
      const token = getToken();
      const headers = { ...(options?.headers as Record<string, string>), Authorization: `Bearer ${token}` };
      return fetch(uri as string, { ...options, headers });
    },
  }),
  cache: new InMemoryCache(),
});
