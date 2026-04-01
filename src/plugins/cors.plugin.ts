import cors, { type FastifyCorsOptions } from '@fastify/cors';
import fp from 'fastify-plugin';
import { env } from '../config/env.config.js';

const AMAZON_ALEXA_ORIGINS = [
  'https://pitangui.amazon.com',    
  'https://layla.amazon.com',       
  'https://alexa.amazon.co.jp',     
  'https://developer.amazon.com',
] as const;

const AMAZON_USER_AGENTS = [
  'AlexaWebScraper',
  'Alexa',
  'Amazon',
] as const;

function isAmazonOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  return AMAZON_ALEXA_ORIGINS.some((allowed) => origin.startsWith(allowed));
}

export default fp<FastifyCorsOptions>(
  async (app) => {
    app.register(cors, {
      origin: (origin, callback) => {

        if (!origin || env.NODE_ENV !== 'production') {
          return callback(null, true);
        }
        if (isAmazonOrigin(origin)) {
          return callback(null, true);
        }
        app.log.warn({ origin }, 'Requisição Bloqueada: Origem não permitida');
        return callback(new Error('Origem não permitida'), false);
      },

      methods: ['POST'],

      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-Request-ID',
        'SignatureCertChainUrl',  
        'Signature',             
      ],

      credentials: true,
      maxAge: 600,
      preflightContinue: false,
      optionsSuccessStatus: 204,
    });

    app.addHook('onRequest', async (request, reply) => {
      if (!request.url.startsWith('/webhook/alexa')) return;

      if (env.NODE_ENV !== 'production') return;

      const userAgent = request.headers['user-agent'] ?? '';
      const hasAlexaAgent = AMAZON_USER_AGENTS.some((agent) =>
        userAgent.includes(agent),
      );

      if (!hasAlexaAgent) {
        app.log.warn({ userAgent, ip: request.ip }, 'Requisição Bloqueada: User-Agent inválido');
        return reply.status(403).send({
          code: 'FORBIDDEN',
          message: 'Acesso negado',
        });
      }

      const hasSignatureCert = Boolean(request.headers['signaturecertchainurl']);
      const hasSignature = Boolean(request.headers['signature']);

      if (!hasSignatureCert || !hasSignature) {
        app.log.warn({ ip: request.ip }, 'Requisição Bloqueada: Headers de assinatura ausentes');
        return reply.status(403).send({
          code: 'FORBIDDEN',
          message: 'Acesso negado',
        });
      }
    });
  },
  {
    name: 'cors',
    fastify: '5.x',
  },
);