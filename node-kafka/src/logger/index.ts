import { Logger as WinstonLog, createLogger, format, transports } from 'winston'
import ignoreCase from './ignore'
import Sensitive from './sensitive'
import { Request } from 'express'

let level = process.env.LOG_LEVEL ?? 'debug'
if (process.env.NODE_ENV === 'production') {
  level = 'info'
}

function makeStructuredClone<T>(obj: T): T {
  if (typeof obj === 'undefined') {
    return obj
  }
  const payload = JSON.parse(JSON.stringify(obj)) // structuredClone(obj)
  if (typeof payload === 'object') {
    if (Array.isArray(payload)) {
      for (const item of payload) {
        if (typeof item === 'object') {
          Sensitive.masking(item)
        }
      }
    } else {
      Sensitive.masking(payload)
    }
  }
  return payload
}

type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly'

export type ILogger = {
  info: (message: string, data?: {} | [], session?: string) => void
  warn: (message: string, data?: {} | [], session?: string) => void
  error: (message: string, data?: any, session?: string) => void
  debug: (message: string, data?: {} | [], session?: string) => void
}

class Logger implements ILogger {
  private readonly log: WinstonLog
  constructor(serviceName?: string) {
    this.log = createLogger({
      level: level,
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss', alias: '@timestamp' }),
        format.json({
          replacer(key, value) {
            if (ignoreCase.equal(key, 'password')) {
              return Sensitive.maskPassword(value)
            } else if (ignoreCase.equal(key, 'email')) {
              return Sensitive.maskEmail(value)
            } else if (ignoreCase.equal(key, 'mobileNo')) {
              return Sensitive.maskNumber(value)
            } else if (ignoreCase.equal(key, 'phone')) {
              return Sensitive.maskPassword(value)
            }
            return value
          },
          // space: 2
        }),
      ),
      exceptionHandlers: [],
      exitOnError: false,
      transports: [
        new transports.Console({
          level: level,
          handleExceptions: true,
        }),
      ],
      defaultMeta: { serviceName: serviceName ?? 'ms-service' },
    })
  }

  Logger(req: Request, extra?: object): ILogger{
    const session: string | undefined = req.header('x-session')
    if (!session) {
      throw new Error('Session ID is required')
    }
    return  this.log.child({ session, ...extra }) as ILogger
  }

  info(message: string, data?: {} | [], session?: string) {
    const action = makeStructuredClone(data)
    this.log.info(message, { ...action, session })
  }

  warn(message: string, data?: {} | [], session?: string) {
    const action = makeStructuredClone(data)
    this.log.warn(message, { ...action, session })
  }

  error(message: string, data?: any, session?: string) {
    const action = makeStructuredClone(data)
    this.log.error(message, { ...action, session })
  }

  debug(message: string, data?: {} | [], session?: string) {
    const action = makeStructuredClone(data)
    this.log.debug(message, { ...action, session })
  }
}

export default Logger
