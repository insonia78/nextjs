import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { Request, Response, NextFunction } from 'express';
import type { IncomingMessage } from 'http';
import type { Socket } from 'net';

interface RouteConfig {
  pathPrefix: string;
  target: string;
  label: string;
  ws?: boolean;
}

function buildRoutes(): RouteConfig[] {
  return [
    {
      pathPrefix: '/api/auth',
      target: process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001',
      label: 'Auth',
    },
    {
      pathPrefix: '/graphql',
      target: process.env.PLANNER_SERVICE_URL ?? 'http://localhost:3002',
      label: 'Planner (GraphQL)',
    },
    {
      pathPrefix: '/api/progress',
      target: process.env.PROGRESS_SERVICE_URL ?? 'http://localhost:3003',
      label: 'Progress',
    },
    {
      // Socket.IO upgrade requests arrive on /socket.io
      pathPrefix: '/socket.io',
      target: process.env.PROGRESS_SERVICE_URL ?? 'http://localhost:3003',
      label: 'Progress (WS)',
      ws: true,
    },
    {
      pathPrefix: '/api/ai',
      target: process.env.AI_SERVICE_URL ?? 'http://localhost:3004',
      label: 'AI',
    },
  ];
}

type ProxyHandler = (req: Request, res: Response, next: NextFunction) => void;
type UpgradeHandler = (req: IncomingMessage, socket: Socket, head: Buffer) => void;

@Injectable()
export class GatewayMiddleware implements NestMiddleware {
  private readonly logger = new Logger('GatewayMiddleware');
  private readonly routes: RouteConfig[];
  private readonly proxies: Map<string, ProxyHandler> = new Map();
  /** Exposed so main.ts can wire the HTTP upgrade event */
  readonly wsProxies: Map<string, UpgradeHandler> = new Map();

  constructor() {
    this.routes = buildRoutes();

    for (const route of this.routes) {
      const options: Options = {
        target: route.target,
        changeOrigin: true,
        ws: route.ws ?? false,
        on: {
          error: (err, req, res) => {
            this.logger.error(
              `Proxy error for ${route.label}: ${(err as Error).message}`,
            );
            const httpRes = res as Response;
            if (httpRes && typeof (httpRes as any).headersSent !== 'undefined' && !(httpRes as any).headersSent) {
              httpRes.status(502).json({
                statusCode: 502,
                message: `${route.label} service unavailable`,
                upstream: route.target,
              });
            }
          },
          proxyReq: (_proxyReq, req) => {
            this.logger.debug(
              `→ [${route.label}] ${req.method} ${req.url} → ${route.target}${req.url}`,
            );
          },
        },
      };

      const proxy = createProxyMiddleware(options);
      this.proxies.set(route.pathPrefix, proxy as ProxyHandler);

      if (route.ws) {
        this.wsProxies.set(route.pathPrefix, (proxy as any).upgrade as UpgradeHandler);
      }
    }
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Skip the local /health endpoint
    if (req.path === '/health') {
      return next();
    }

    for (const route of this.routes) {
      if (req.path.startsWith(route.pathPrefix)) {
        const proxy = this.proxies.get(route.pathPrefix);
        if (proxy) {
          return proxy(req, res, next);
        }
      }
    }

    // No matching route
    this.logger.warn(`No upstream matched for ${req.method} ${req.path}`);
    res.status(404).json({
      statusCode: 404,
      message: `No gateway route matched: ${req.method} ${req.path}`,
    });
  }
}
