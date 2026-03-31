import type { GroqServices, Message } from '../../groq/services/groq.service.js';
import type { ChatRepository } from '../repositories/chat.repository.js';

interface ProcessUtteranceParams {
  sessionId: string;
  userId: string;
  query: string;
}

export class ChatService {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly groqService: GroqServices,
  ) {}

  async processUtterance({ sessionId, userId, query }: ProcessUtteranceParams): Promise<string> {
    const history = await this.chatRepository.getSessionHistory(sessionId);

    const messages: Message[] = history.map((record) => ({
      role: record.role,
      content: record.content,
    }));

    messages.push({ role: 'user', content: query });

    const aiResponse = await this.groqService.chat(messages);

    await this.chatRepository.appendMessages([
      { sessionId, userId, role: 'user', content: query },
      { sessionId, userId, role: 'assistant', content: aiResponse },
    ]);

    return aiResponse;
  }
}
