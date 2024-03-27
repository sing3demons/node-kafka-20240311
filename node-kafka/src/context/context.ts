import type { Request } from 'express'
import { hostname } from 'os'
export type ContextType = ReturnType<typeof Context.getHeaders>

export default class Context {
  private static _bindings = new Map<Context, ContextType>()

  static bind(req: Request): void {
    const headers = Context.getHeaders(req)
    Context._bindings.set('x-session', headers)
  }

  static get() {
    return Context._bindings.get('x-session') || undefined
  }

  static clear(req: Request): void {
    Context._bindings.delete(req)
  }

  static getHeaders(req: Request) {
    return {
      session: (req.headers['x-session'] as string) || 'unknown',
      ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      host: hostname(),
    }
  }
}
