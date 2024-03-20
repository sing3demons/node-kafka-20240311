import { debug } from 'console'
import express, { Router } from 'express'


interface IRouter {
    path: string
    route: Router
}

interface IConfig {
    routes?: IRouter[]
} 

export default class APIServer {
    private app: express.Application
    constructor(private readonly config: IConfig) {
        this.app = express()
    }

    async start(port: string|number){
        this.app.use(express.json())
        this.app.use(express.urlencoded({ extended: true }))

        if (this.config?.routes) {
            for (const r of this.config.routes ) {
                this.app.use(r.path, r.route)
            }
        }


       const server = this.app.listen(port)
        process.on('SIGINT', async () => {
            debug('SIGINT signal received: closing HTTP server')
            server.close(() => {
              debug('HTTP server closed')
            })
          })
      
          process.on('SIGTERM', () => {
            debug('SIGTERM signal received: closing HTTP server')
            server.close(() => {
              debug('HTTP server closed')
            })
          })
       
    }
}

const api = new APIServer({
    routes: [
        {
            path: '/api',
            route: Router()
        }
    ]
})

// api.start(3000) // uncomment to run the server