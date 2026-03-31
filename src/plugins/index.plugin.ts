import { FastifyInstance } from "fastify";
import cors from "./cors.plugin";
import errorHandler from "./error-handler.plugin";
import helmet from "./helmet.plugin";
import swagger from "./swagger.plugin";

export async function registerPlugins(app: FastifyInstance) {
    await app.register(cors);
    await app.register(errorHandler);
    await app.register(helmet);
    await app.register(swagger);
}