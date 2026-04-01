import { z } from 'zod';

export const AlexaWebhookBodySchema = z.object({
  version: z.string().describe('Versão do request enviado pela Amazon'),
  session: z
    .object({
      sessionId: z.string().describe('ID único da sessão atual'),
      application: z.object({
        applicationId: z.string().describe('ID da Skill registrada na Amazon'),
      }).passthrough(),
      user: z.object({
        userId: z.string().describe('ID único do usuário da Alexa'),
      }).passthrough(),
      new: z.boolean().describe('Indica se é o início de uma nova sessão'),
    })
    .passthrough()
    .describe('Dados da sessão enviados pela Amazon'),
  request: z
    .object({
      type: z
        .enum(['LaunchRequest', 'IntentRequest', 'SessionEndedRequest'])
        .describe('Tipo do request recebido da Alexa'),
      requestId: z.string().describe('ID único do request'),
      intent: z
        .object({
          name: z.string().describe('Nome da Intent disparada'),
          slots: z
            .record(
              z.string(),
              z.object({
                name: z.string(),
                value: z.string().optional().describe('Texto capturado pelo slot'),
              }).passthrough(),
            )
            .optional()
            .describe('Slots preenchidos pelo usuário'),
        })
        .passthrough()
        .optional()
        .describe('Dados da intent (presente apenas em IntentRequest)'),
      reason: z
        .string()
        .optional()
        .describe('Motivo de encerramento (presente apenas em SessionEndedRequest)'),
      error: z
        .object({
          type: z.string(),
          message: z.string(),
        })
        .passthrough()
        .optional()
        .describe('Detalhes do erro (presente apenas em SessionEndedRequest com erro)'),
    })
    .passthrough()
    .describe('Dados do request enviados pela Amazon'),
}).passthrough();

export type AlexaWebhookBody = z.infer<typeof AlexaWebhookBodySchema>;


const PlainTextOutputSpeechSchema = z.object({
  type: z.literal('PlainText').describe('Formato do texto de saída'),
  text: z.string().describe('Texto que a Alexa irá falar'),
});

const SSMLOutputSpeechSchema = z.object({
  type: z.literal('SSML').describe('Formato SSML do texto de saída'),
  ssml: z.string().describe('Markup SSML que a Alexa irá falar'),
});

const OutputSpeechSchema = z
  .discriminatedUnion('type', [PlainTextOutputSpeechSchema, SSMLOutputSpeechSchema])
  .describe('Objeto de fala da Alexa');

export const AlexaWebhookResponseSchema = z.object({
  version: z.string().describe("Versão da resposta (sempre '1.0')"),
  response: z.object({
    outputSpeech: OutputSpeechSchema.optional().describe('Fala da Alexa na resposta principal'),
    shouldEndSession: z
      .boolean()
      .describe('Define se a sessão deve ser encerrada após a resposta'),
    reprompt: z
      .object({
        outputSpeech: OutputSpeechSchema,
      })
      .optional()
      .describe('Texto de reperguntar caso o usuário não responda'),
  }),
});

export type AlexaWebhookResponse = z.infer<typeof AlexaWebhookResponseSchema>;