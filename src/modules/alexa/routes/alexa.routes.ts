import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import {
  ErrorResponseSchema,
  ValidationErrorResponseSchema,
} from '../../../shared/schemas/error.schema.js';
import { GroqServices } from '../../groq/services/groq.service.js';
import {
  renderError,
  renderGoodbye,
  renderNotUnderstood,
  renderSpeak,
  renderWelcome,
} from '../renders/alexa.render.js';
import { ChatRepository } from '../repositories/chat.repository.js';
import { AlexaWebhookBodySchema, AlexaWebhookResponseSchema } from '../schemas/alexa.schemas.js';
import { ChatService } from '../services/chat.service.js';

const chatRepository = new ChatRepository();
const groqService = new GroqServices();
const chatService = new ChatService(chatRepository, groqService);

const STOP_INTENTS = ['AMAZON.StopIntent', 'AMAZON.CancelIntent'];
const PASSTHROUGH_INTENTS = ['AMAZON.FallbackIntent', 'AMAZON.HelpIntent'];

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
      const { userId } = session.user;

      request.log.info(
        {
          type: alexaRequest.type,
          sessionId,
          hasSigCert: Boolean(request.headers['signaturecertchainurl']),
          hasSig: Boolean(request.headers['signature']),
        },
        '[Alexa] Request recebido',
      );

      switch (alexaRequest.type) {
        case 'LaunchRequest':
          return reply.send(renderWelcome());

        case 'SessionEndedRequest':
          request.log.info(
            { sessionId, reason: alexaRequest.reason },
            '[Alexa] SessionEndedRequest recebido',
          );
          reply.hijack();
          reply.raw.writeHead(200);
          reply.raw.end();
          return;

        case 'IntentRequest':
          break;

        default: {
          const _exhaustive: never = alexaRequest.type;
          request.log.warn({ type: _exhaustive }, '[Alexa] Tipo de request desconhecido');
          return reply.send(renderNotUnderstood());
        }
      }

      const intentName = alexaRequest.intent?.name ?? '';
      const slotValue = alexaRequest.intent?.slots?.query?.value;

      request.log.info(
        { sessionId, intentName, slotValue },
        '[Alexa] IntentRequest recebido',
      );

      if (STOP_INTENTS.includes(intentName)) {
        return reply.send(renderGoodbye());
      }

      if (PASSTHROUGH_INTENTS.includes(intentName)) {
        return reply.send(
          renderSpeak(
            'Pode me perguntar qualquer coisa! Estou aqui para ajudar.',
            'Estou ouvindo. Pode perguntar.',
          ),
        );
      }

      if (intentName !== 'CapturaLivreIntent') {
        request.log.warn({ intentName }, '[Alexa] Intent não reconhecida');
        return reply.send(renderNotUnderstood());
      }

      if (!slotValue) {
        request.log.warn({ intentName }, '[Alexa] Slot "query" vazio ou ausente');
        return reply.send(renderNotUnderstood());
      }

      try {
        const aiResponse = await chatService.processUtterance({
          sessionId,
          userId,
          query: slotValue,
        });

        return reply.send(renderSpeak(aiResponse, 'Tem mais alguma dúvida?'));
      } catch (error: unknown) {
        request.log.error({ sessionId, error }, '[Alexa] Erro crítico ao processar utterance');
        return reply.send(renderError());
      }
    },
  });
};
