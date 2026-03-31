import { env } from "./config/env.config";
import { bootstrap } from "./app";

async function server() {
    const app = await bootstrap();

    const shutdown = async (signal: string) => {
        app.log.info(`Received ${signal}, shutting down gracefully...`)
        await app.close()
        process.exit(0)
    }
    process.on('SIGTERM', () => shutdown("SIGTERM"))
    process.on('SIGINT', () => shutdown("SIGINT"))

    try {
        await app.listen({
            port: env.PORT,
            host: env.HOST
        })
    } catch (error) {
        app.log.error(error)
        process.exit(1)
    }
}

server()