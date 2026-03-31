import { z } from "zod";

export const AlexaWebhookBodySchema = z.object({
  version: z.string().describe("Versão do request enviado pela Amazon"),
  session: z
    .object({
      sessionId: z.string().describe("ID único da sessão atual"),
      application: z.object({
        applicationId: z.string().describe("ID da Skill registrada na Amazon"),
      }),
      user: z.object({
        userId: z.string().describe("ID único do usuário da Alexa"),
      }),
      new: z.boolean().describe("Indica se é o início de uma nova sessão"),
    })
    .describe("Dados da sessão enviados pela Amazon"),
  request: z
    .object({
      type: z
        .enum(["LaunchRequest", "IntentRequest", "SessionEndedRequest"])
        .describe("Tipo do request recebido da Alexa"),
      requestId: z.string().describe("ID único do request"),
      intent: z
        .object({
          name: z.string().describe("Nome da Intent disparada"),
          slots: z
            .record(
              z.string(),
              z.object({
                name: z.string(),
                value: z.string().optional().describe("Texto capturado pelo slot"),
              })
            )
            .optional()
            .describe("Slots preenchidos pelo usuário"),
        })
        .optional()
        .describe("Dados da intent (presente apenas em IntentRequest)"),
    })
    .describe("Dados do request enviados pela Amazon"),
});

export type AlexaWebhookBody = z.infer<typeof AlexaWebhookBodySchema>;


export const AlexaWebhookResponseSchema = z.object({
  version: z.string().describe("Versão da resposta (sempre '1.0')"),
  response: z.object({
    outputSpeech: z.object({
      type: z.enum(["PlainText", "SSML"]).describe("Formato do texto de saída"),
      text: z.string().optional().describe("Texto que a Alexa irá falar (PlainText)"),
      ssml: z.string().optional().describe("Markup SSML que a Alexa irá falar"),
    }).optional(),
    shouldEndSession: z
      .boolean()
      .optional()
      .describe("Define se a sessão deve ser encerrada após a resposta"),
    reprompt: z
      .object({
        outputSpeech: z.object({
          type: z.enum(["PlainText", "SSML"]),
          text: z.string().optional(),
          ssml: z.string().optional(),
        }),
      })
      .optional()
      .describe("Texto de reperguntar caso o usuário não responda"),
  }),
});

export type AlexaWebhookResponse = z.infer<typeof AlexaWebhookResponseSchema>;