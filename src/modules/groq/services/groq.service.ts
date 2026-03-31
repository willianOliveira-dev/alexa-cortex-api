import { groq } from "../../../lib/ai/groq-client.lib.js";
import { ASSISTANT_SYSTEM_PROMPT } from "../../../prompts/assistant.system-prompt.js";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export class GroqServices {
  private readonly defaultModel = "llama-3.3-70b-versatile";

  async chat(
    messages: Message[],
    options: ChatOptions = {}
  ): Promise<string> {
    const {
      systemPrompt = ASSISTANT_SYSTEM_PROMPT,
      temperature = 0.7,
      maxTokens = 1024,
    } = options;

    const fullMessages: Message[] = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const response = await groq.chat.completions.create({
      model: this.defaultModel,
      temperature,
      max_tokens: maxTokens,
      messages: fullMessages,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error("Groq retornou uma resposta vazia.");
    }

    return content;
  }
}