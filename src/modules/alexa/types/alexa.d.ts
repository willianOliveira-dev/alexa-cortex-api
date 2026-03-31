export interface AlexaRequest {
  version: string;
  session: {
    sessionId: string;
    application: { applicationId: string };
    user: { userId: string };
    new: boolean;
  };
  request: {
    type: "LaunchRequest" | "IntentRequest" | "SessionEndedRequest";
    requestId: string;
    intent?: {
      name: string;
      slots?: {
        [key: string]: {
          name: string;
          value?: string;
        };
      };
    };
  };
}

export interface AlexaResponse {
  version: string;
  response: {
    outputSpeech: {
      type: "PlainText" | "SSML";
      text?: string;
      ssml?: string;
    };
    shouldEndSession: boolean;
    reprompt?: {
      outputSpeech: {
        type: "PlainText";
        text: string;
      };
    };
  };
}