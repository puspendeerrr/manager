import { google } from 'googleapis';
import { googleAuthService } from './googleAuthService';
import { GmailMessageSnippet } from '@sonam/shared';

export class GmailService {
  async searchGmail(userId: string, query: string, maxResults = 5): Promise<GmailMessageSnippet[]> {
    const authClient = await googleAuthService.getAuthenticatedClient(userId);
    if (!authClient) return [];

    const gmail = google.gmail({ version: 'v1', auth: authClient });

    try {
      const listRes = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults,
      });

      const messages = listRes.data.messages || [];
      const snippets: GmailMessageSnippet[] = [];

      for (const msg of messages) {
        if (!msg.id) continue;
        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'full',
        });

        const headers = detail.data.payload?.headers || [];
        const subject = headers.find((h) => h.name?.toLowerCase() === 'subject')?.value || 'No Subject';
        const sender = headers.find((h) => h.name?.toLowerCase() === 'from')?.value || 'Unknown Sender';
        const date = headers.find((h) => h.name?.toLowerCase() === 'date')?.value || new Date().toISOString();

        snippets.push({
          id: detail.data.id || msg.id,
          threadId: detail.data.threadId || '',
          sender: this.sanitizeHeader(sender),
          subject: this.sanitizeHeader(subject),
          snippet: this.sanitizeContent(detail.data.snippet || ''),
          date,
        });
      }

      return snippets;
    } catch (err) {
      console.error('[GmailService] Error searching Gmail:', err);
      return [];
    }
  }

  async getGmailMessage(userId: string, messageId: string) {
    const authClient = await googleAuthService.getAuthenticatedClient(userId);
    if (!authClient) return null;

    const gmail = google.gmail({ version: 'v1', auth: authClient });

    try {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });

      const headers = detail.data.payload?.headers || [];
      const subject = headers.find((h) => h.name?.toLowerCase() === 'subject')?.value || 'No Subject';
      const sender = headers.find((h) => h.name?.toLowerCase() === 'from')?.value || 'Unknown Sender';
      const date = headers.find((h) => h.name?.toLowerCase() === 'date')?.value || new Date().toISOString();

      return {
        id: detail.data.id,
        threadId: detail.data.threadId,
        sender: this.sanitizeHeader(sender),
        subject: this.sanitizeHeader(subject),
        snippet: this.sanitizeContent(detail.data.snippet || ''),
        date,
      };
    } catch (err) {
      console.error('[GmailService] Error fetching Gmail message:', err);
      return null;
    }
  }

  /**
   * Sanitizes header values to prevent prompt injection vectors.
   */
  private sanitizeHeader(val: string): string {
    return val.replace(/[\r\n\t]/g, ' ').substring(0, 200);
  }

  /**
   * Sanitizes body content to prevent prompt injection vectors.
   */
  private sanitizeContent(val: string): string {
    return val
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .substring(0, 1500);
  }
}

export const gmailService = new GmailService();
