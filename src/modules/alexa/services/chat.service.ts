import type {
    GroqServices,
    Message,
} from '../../groq/services/groq.service.js';
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

    async processUtterance({
        sessionId,
        userId,
        query,
    }: ProcessUtteranceParams): Promise<string> {
        await this.chatRepository.appendMessages([
            { sessionId, userId, role: 'user', content: query },
        ]);

        const history = await this.chatRepository.getSessionHistory(sessionId);

        const messages: Message[] = history.map((record) => ({
            role: record.role,
            content: record.content,
        }));

        const groqPromise = this.groqService.chat(messages);

        const TIMEOUT_MS = 5_000;
        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        const timeoutPromise = new Promise<string>((resolve) => {
            timeoutId = setTimeout(() => {
                resolve(
                    'Desculpe, precisei de um pouco mais de tempo para pensar. Pode me perguntar de novo em instantes?',
                );
            }, TIMEOUT_MS);
        });

        const aiResponse = await Promise.race([
            groqPromise,
            timeoutPromise,
        ]).finally(() => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        });

        await this.chatRepository.appendMessages([
            { sessionId, userId, role: 'assistant', content: aiResponse },
        ]);

        return aiResponse;
    }
}
