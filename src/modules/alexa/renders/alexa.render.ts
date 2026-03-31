import type { AlexaWebhookResponse } from '../schemas/alexa.schemas.js';

type OutputSpeech = AlexaWebhookResponse['response']['outputSpeech'];

function buildResponse(
  outputSpeech: OutputSpeech,
  shouldEndSession: boolean,
  repromptText?: string,
): AlexaWebhookResponse {
  return {
    version: '1.0',
    response: {
      outputSpeech,
      shouldEndSession,
      ...(repromptText && {
        reprompt: {
          outputSpeech: { type: 'PlainText', text: repromptText },
        },
      }),
    },
  };
}

export function renderSpeak(text: string, reprompt?: string): AlexaWebhookResponse {
  return buildResponse({ type: 'PlainText', text }, false, reprompt);
}

export function renderSpeakAndClose(text: string): AlexaWebhookResponse {
  return buildResponse({ type: 'PlainText', text }, true);
}

export function renderSSML(ssml: string, reprompt?: string): AlexaWebhookResponse {
  return buildResponse({ type: 'SSML', ssml }, false, reprompt);
}

export function renderWelcome(): AlexaWebhookResponse {
  return renderSpeak(
    'Olá! Sou seu assistente com inteligência artificial. Pode me perguntar qualquer coisa.',
    'Estou ouvindo. Pode perguntar.',
  );
}

export function renderGoodbye(): AlexaWebhookResponse {
  return renderSpeakAndClose('Até logo!');
}

export function renderNotUnderstood(): AlexaWebhookResponse {
  return renderSpeak('Não entendi muito bem. Pode repetir?', 'Pode repetir a pergunta.');
}
