import type { AlexaWebhookResponse } from '../schemas/alexa.schemas.js';

type OutputSpeech = AlexaWebhookResponse['response']['outputSpeech'];

function sanitizeSpeechText(text: string): string {
  return text
    .replace(/[\r\n]+/g, ' ')     
    .replace(/\s{2,}/g, ' ')      
    .replace(/[<>&]/g, '')     
    .trim();
}

function buildResponse(
  outputSpeech: OutputSpeech,
  shouldEndSession: boolean,
  repromptText?: string,
): AlexaWebhookResponse {
  const response: AlexaWebhookResponse = {
    version: '1.0',
    response: {
      outputSpeech,
      shouldEndSession,
    },
  };

  if (repromptText) {
    response.response.reprompt = {
      outputSpeech: { type: 'PlainText', text: repromptText },
    };
  }

  return response;
}

export function renderSpeak(text: string, reprompt?: string): AlexaWebhookResponse {
  return buildResponse(
    { type: 'PlainText', text: sanitizeSpeechText(text) },
    false,
    reprompt ? sanitizeSpeechText(reprompt) : undefined,
  );
}

export function renderSpeakAndClose(text: string): AlexaWebhookResponse {
  return buildResponse({ type: 'PlainText', text: sanitizeSpeechText(text) }, true);
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

export function renderSessionEnded(): AlexaWebhookResponse {
  return buildResponse(undefined, true);
}

export function renderError(): AlexaWebhookResponse {
  return renderSpeak(
    'Desculpe, tive um problema ao processar sua pergunta. Tente novamente.',
    'Pode tentar de novo.',
  );
}

export function renderTimeout(): AlexaWebhookResponse {
  return renderSpeak(
    'Desculpe, a resposta demorou demais. Pode tentar perguntar de outro jeito?',
    'Tente perguntar novamente.',
  );
}
