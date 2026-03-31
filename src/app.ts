import Fastify from 'fastify'
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from 'fastify-type-provider-zod'
import { env } from './config/env.config.js'
import { randomUUID } from 'node:crypto'
import { registerPlugins } from './plugins/index.plugin.js'
import { registerRoutes } from './routes/root.routes.js'

export const bootstrap = async () => {
    const app = Fastify({
        logger: {
            level: "info",
            transport: env.NODE_ENV === "development" ? {
                target: 'pino-pretty',
                options: {
                    localizeTime: true,
                    translateTime: "HH:mm:ss Z dd-mm-yyyy",
                    colorize: true,
                }
            }: undefined
        },
        genReqId: () => randomUUID()
    }).withTypeProvider<ZodTypeProvider>()
    
    app.setValidatorCompiler(validatorCompiler)
    app.setSerializerCompiler(serializerCompiler)

    await registerPlugins(app)
    await registerRoutes(app)
    return app;
}