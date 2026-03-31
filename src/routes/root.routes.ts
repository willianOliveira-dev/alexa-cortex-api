import { FastifyInstance } from "fastify";
import { alexaRoutes } from "../modules/alexa/routes/alexa.routes.js";
import { swaggerRoutes } from "../modules/swagger/routes/swagger.routes.js";

export async function registerRoutes(app: FastifyInstance) {
    await app.register(alexaRoutes, { prefix: "/api/v1" });
    await app.register(swaggerRoutes, { prefix: "/api/v1" });
}