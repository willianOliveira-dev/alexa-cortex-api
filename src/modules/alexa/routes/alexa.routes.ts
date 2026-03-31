import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import {
  ErrorResponseSchema,
  ValidationErrorResponseSchema,
} from '../../../shared/schemas/error.schema.js';
import { GroqServices } from '../../groq/services/groq.service.js';
import {
  renderGoodbye,
  renderNotUnderstood,
  renderSpeak,
  renderWelcome,
} from '../renders/alexa.render.js';
import { AlexaWebhookBodySchema, AlexaWebhookResponseSchema } from '../schemas/alexa.schemas.js';

const groqService = new GroqServices();

const ALEXA_TIMEOUT_MS = 6_000;

const STOP_INTENTS = ['AMAZON.StopIntent', 'AMAZON.CancelIntent'];

export const alexaRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post('/webhook/alexa', {
    schema: {
      tags: ['Alexa'],
      summary: 'Webhook para integração com a Skill da Alexa',
      description:
        'Recebe os requests da Amazon, processa com IA e retorna a resposta no formato esperado pela Alexa.',
      body: AlexaWebhookBodySchema,
      response: {
        200: AlexaWebhookResponseSchema,
        400: ValidationErrorResponseSchema,
        403: ErrorResponseSchema,
        504: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { request: alexaRequest, session } = request.body;
      const { sessionId } = session;

      switch (alexaRequest.type) {
        case 'LaunchRequest':
          return reply.send(renderWelcome());
        case 'SessionEndedRequest':
          return reply.send({ version: '1.0', response: {} });
        case 'IntentRequest':
          break;
        default:
          return reply.send(renderNotUnderstood());
      }

      const intentName = alexaRequest.intent?.name ?? '';

      if (STOP_INTENTS.includes(intentName)) {
        return reply.send(renderGoodbye());
      }

      if (intentName !== 'CapturaLivreIntent') {
        return reply.send(renderNotUnderstood());
      }

      const query = alexaRequest.intent?.slots?.query?.value;

      if (!query) {
        return reply.send(renderNotUnderstood());
      }

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () =>
            reject(new Error(`Alexa timeout após ${ALEXA_TIMEOUT_MS}ms — sessionId: ${sessionId}`)),
          ALEXA_TIMEOUT_MS,
        ),
      );

      const aiResponse = await Promise.race([
        groqService.chat([{ role: 'user', content: query }]),
        timeoutPromise,
      ]);

      return reply.send(renderSpeak(aiResponse, 'Tem mais alguma dúvida?'));
    },
  });
};
