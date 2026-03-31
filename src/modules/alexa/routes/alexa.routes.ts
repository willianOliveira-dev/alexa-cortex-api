import { z } from "zod";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { GroqServices } from "../../groq/services/groq.service";
import { AlexaWebhookBodySchema, AlexaWebhookResponseSchema } from "../schemas/alexa.schemas";
import {
  renderWelcome,
  renderGoodbye,
  renderSpeak,
  renderError,
  renderNotUnderstood,
} from "../renders/alexa.render";

const groqService = new GroqServices();

const ALEXA_TIMEOUT_MS = 6_000;
const STOP_INTENTS = ["AMAZON.StopIntent", "AMAZON.CancelIntent"];

export const alexaRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post("/webhook/alexa", {
    schema: {
      tags: ["Alexa"],
      summary: "Webhook para integração com a Skill da Alexa",
      description:
        "Recebe os requests da Amazon, processa com IA e retorna a resposta no formato esperado pela Alexa.",
      body: AlexaWebhookBodySchema,
      response: {
        200: AlexaWebhookResponseSchema,
        500: z.object({
          version: z.literal("1.0"),
          response: z.object({
            outputSpeech: z.object({
              type: z.literal("PlainText"),
              text: z.string(),
            }),
            shouldEndSession: z.literal(true),
          }),
        }),
      },
    },

    handler: async (request, reply) => {
      const { request: alexaRequest, session } = request.body;
      const { sessionId } = session;

      // ── LaunchRequest: usuário abriu a skill ────────────────────────────────
      if (alexaRequest.type === "LaunchRequest") {
        return reply.send(renderWelcome());
      }

     
      if (alexaRequest.type === "SessionEndedRequest") {
        return reply.send({ version: "1.0", response: {} });
      }

      // ── IntentRequest ───────────────────────────────────────────────────────
      if (alexaRequest.type === "IntentRequest") {
        const intentName = alexaRequest.intent?.name ?? "";

        // Encerramento explícito pelo usuário
        if (STOP_INTENTS.includes(intentName)) {
          return reply.send(renderGoodbye());
        }

        // Captura livre (AMAZON.SearchQuery slot)
        if (intentName === "CapturaLivreIntent") {
          const query = alexaRequest.intent?.slots?.["query"]?.value;

          if (!query) {
            return reply.send(renderNotUnderstood());
          }

          try {
            const aiResponsePromise = groqService.chat(
              [{ role: "user", content: query }],
              { systemPrompt: undefined } // usa o ASSISTANT_SYSTEM_PROMPT por padrão
            );

            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("timeout")), ALEXA_TIMEOUT_MS)
            );

            const aiResponse = await Promise.race([aiResponsePromise, timeoutPromise]);

            return reply.send(
              renderSpeak(aiResponse, "Tem mais alguma dúvida?")
            );
          } catch (err) {
            const isTimeout = err instanceof Error && err.message === "timeout";
            request.log.error({ err, sessionId }, "Erro ao processar IA");
            return reply.status(200).send(renderError(isTimeout ? "timeout" : "ai"));
          }
        }
      }

      return reply.send(renderNotUnderstood());
    },
  });
};