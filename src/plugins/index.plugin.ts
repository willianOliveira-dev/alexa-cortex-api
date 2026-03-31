import { FastifyInstance } from "fastify";
import cors from "./cors.plugin.js";
import errorHandler from "./error-handler.plugin.js";
import helmet from "./helmet.plugin.js";
import swagger from "./swagger.plugin.js";

export async function registerPlugins(app: FastifyInstance) {
    await app.register(cors);
    await app.register(errorHandler);
    await app.register(helmet);
    await app.register(swagger);
}