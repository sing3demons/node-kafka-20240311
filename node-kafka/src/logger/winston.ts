import { Logger as WinstonLog, createLogger, format, transports } from 'winston'
import ignoreCase from './ignore'
import Sensitive from './sensitive'
import { Request } from 'express'

let level = process.env.LOG_LEVEL ?? 'debug'
if (process.env.NODE_ENV === 'production') {
  level = 'info'
}

const logger = createLogger({
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
  defaultMeta: { serviceName: process.env.SERVICE_NAME ?? 'ms-service' },
})

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

// const log = NewLogger('app-service')

type ILogger = {
  info: (message: string, extra?: object) => void
  error: (message: string, extra?: object) => void
  warn: (message: string, extra?: object) => void
  debug: (message: string, extra?: object) => void
  // child: (extra: object) => WinstonLog
  // New: (req: Request, ...args: Record<string, any>[]) => ILogger

  // namespace: (namespace: string, logLevel?: logLevel) => Logger
  // setLogLevel: (logLevel: logLevel) => void
}

const log = {
  info: (message: string, extra?: object) => {
    logger.info(message, makeStructuredClone(extra))
  },
  error: (message: string, extra?: object) => {
    logger.error(message, makeStructuredClone(extra))
  },
  warn: (message: string, extra?: object) => {
    logger.warn(message, makeStructuredClone(extra))
  },
  debug: (message: string, extra?: object) => {
    logger.debug(message, makeStructuredClone(extra))
  },
}

export function NewLogger(req: Request, extra?: object): ILogger {
  const session: string | undefined = req.header('x-session')
  if (!session) {
    throw new Error('Session ID is required')
  }
  return logger.child({ session, ...extra }) as ILogger
}

export default log
