import { asc, eq } from 'drizzle-orm';
import { db } from '../../../lib/db/db.client.js';
import {
  type ChatMessage,
  chatMessages,
  type NewChatMessage,
} from '../../../lib/db/schemas/index.js';

const DEFAULT_HISTORY_LIMIT = 20;

export class ChatRepository {
  async getSessionHistory(
    sessionId: string,
    limit: number = DEFAULT_HISTORY_LIMIT,
  ): Promise<ChatMessage[]> {
    return db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(asc(chatMessages.createdAt))
      .limit(limit);
  }

  async appendMessages(messages: NewChatMessage[]): Promise<void> {
    await db.insert(chatMessages).values(messages);
  }
}
