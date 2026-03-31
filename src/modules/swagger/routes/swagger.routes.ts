import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

export const swaggerRoutes: FastifyPluginAsyncZod = async (app) => {
    app.get('/swagger.json', {
        schema: {
            operationId: "getSwagger",
            hide: true
        },
        handler: async () => {
            return app.swagger();
        }
    })
};
