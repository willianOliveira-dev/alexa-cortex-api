import swagger from '@fastify/swagger';
import scalarApiReference from '@scalar/fastify-api-reference';
import fp from 'fastify-plugin';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';
import { env } from '../config/env.config';

export default fp(
    async (app) => {
        await app.register(swagger, {
            openapi: {
                openapi: '3.1.0',
                info: {
                    title: 'Alexa Cortex API',
                    description: 'Alexa Cortex API é uma API RESTful para integração com a Skill da Alexa, que utiliza IA para responder perguntas complexas que a Alexa não consegue responder nativamente',
                    license: {
                        name: 'MIT',
                        url: 'https://opensource.org/licenses/MIT',
                    },
                    version: env.API_VERSION ?? '1.0.0',
                    contact: {
                        name: 'Willian Oliveira',
                        email: 'willian.dev.tech@gmail.com',
                    },
                },
                servers: [
                    {
                        url: `http://localhost:${env.PORT}`,
                        description: 'Localhost',
                    },
                    {
                        url: env.BASE_URL,
                        description: 'Production',
                    },
                ],
                tags: [{ name: 'Alexa', description: 'Alexa integration' }],
            },

            transform: jsonSchemaTransform,
        });

        await app.register(scalarApiReference, {
            routePrefix: '/docs',
            configuration: {
                sources: [
                    {
                        title: 'Alexa Cortex API',
                        slug: 'alexa-cortex-api',
                        url: '/swagger.json',
                    },
                ],
                content: () => app.swagger(),
                showSidebar: true,
                hideDownloadButton: false,
                theme: 'bluePlanet',
            },
        });
    },
    {
        name: 'swagger',
        fastify: '5.x',
    },
);
