import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4001';
const CHAT_URL = process.env.CHAT_SERVICE_URL || 'http://localhost:4002';
const TASK_URL = process.env.TASK_SERVICE_URL || 'http://localhost:4003';
const NOTIFY_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4004';

const routes: { prefix: string; target: string; rewriteTo?: string }[] = [
  { prefix: '/auth', target: AUTH_URL },
  { prefix: '/users', target: AUTH_URL },
  { prefix: '/teams', target: AUTH_URL },
  { prefix: '/chat', target: CHAT_URL },
  { prefix: '/graphql/chat', target: CHAT_URL, rewriteTo: '/graphql' },
  { prefix: '/graphql/tasks', target: TASK_URL, rewriteTo: '/graphql' },
  { prefix: '/notify', target: NOTIFY_URL },
];

@Injectable()
export class ProxyMiddleware implements NestMiddleware {
  private proxies: Map<string, ReturnType<typeof createProxyMiddleware>> = new Map();

  constructor() {
    for (const route of routes) {
      this.proxies.set(
        route.prefix,
        createProxyMiddleware({
          target: route.target,
          changeOrigin: true,
          pathRewrite: route.rewriteTo
            ? { [`^${route.prefix}`]: route.rewriteTo }
            : { [`^${route.prefix}`]: route.prefix },
        }),
      );
    }
  }

  use(req: Request, res: Response, next: NextFunction) {
    for (const [prefix, proxy] of this.proxies) {
      if (req.path.startsWith(prefix)) {
        return (proxy as any)(req, res, next);
      }
    }
    next();
  }
}
