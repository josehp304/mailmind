import { db } from './index';
import { users, emails, labels, emailSummaries, automations, userPreferences } from './schema';
import { eq, desc, and, like, inArray } from 'drizzle-orm';

export class DatabaseService {
  // User operations
  static async createUser(userData: {
    email: string;
    name?: string;
    image?: string;
    googleId: string;
    refreshToken?: string;
    accessToken?: string;
    tokenExpiry?: Date;
  }) {
    const [user] = await db.insert(users).values(userData).returning();
    
    // Create default labels for the user
    await this.createDefaultLabels(user.id);
    
    // Create default preferences
    await db.insert(userPreferences).values({
      userId: user.id,
    });
    
    return user;
  }

  static async getUserByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  static async getUserById(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  static async updateUserTokens(userId: string, tokens: {
    accessToken?: string;
    refreshToken?: string;
    tokenExpiry?: Date;
  }) {
    await db.update(users)
      .set({ ...tokens, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  // Label operations
  static async createDefaultLabels(userId: string) {
    const defaultLabels = [
      { name: 'Inbox', type: 'system' },
      { name: 'Sent', type: 'system' },
      { name: 'Drafts', type: 'system' },
      { name: 'Spam', type: 'system' },
      { name: 'Trash', type: 'system' },
      { name: 'Important', type: 'system' },
      { name: 'Starred', type: 'system' },
      { name: 'Promotions', type: 'system' },
      { name: 'Cold Emails', type: 'system' },
    ];

    await db.insert(labels).values(
      defaultLabels.map(label => ({
        userId,
        name: label.name,
        type: label.type,
      }))
    );
  }

  static async getUserLabels(userId: string) {
    return await db.select().from(labels).where(eq(labels.userId, userId));
  }

  static async createCustomLabel(userId: string, name: string, color?: string) {
    const [label] = await db.insert(labels).values({
      userId,
      name,
      type: 'custom',
      color,
    }).returning();
    return label;
  }

  // Email operations
  static async saveEmail(emailData: {
    userId: string;
    gmailId: string;
    threadId: string;
    subject?: string;
    from: string;
    to: string;
    cc?: string;
    bcc?: string;
    body?: string;
    htmlBody?: string;
    snippet?: string;
    labelIds?: string[];
    isRead?: boolean;
    isImportant?: boolean;
    isStarred?: boolean;
    hasAttachments?: boolean;
    receivedAt: Date;
  }) {
    const [email] = await db.insert(emails).values(emailData).returning();
    return email;
  }

  static async getUserEmails(userId: string, limit = 50, offset = 0) {
    return await db.select()
      .from(emails)
      .where(eq(emails.userId, userId))
      .orderBy(desc(emails.receivedAt))
      .limit(limit)
      .offset(offset);
  }

  static async getEmailById(emailId: string) {
    const [email] = await db.select().from(emails).where(eq(emails.id, emailId));
    return email;
  }

  static async updateEmailStatus(emailId: string, updates: {
    isRead?: boolean;
    isImportant?: boolean;
    isStarred?: boolean;
  }) {
    await db.update(emails)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(emails.id, emailId));
  }

  static async searchEmails(userId: string, query: string) {
    return await db.select()
      .from(emails)
      .where(
        and(
          eq(emails.userId, userId),
          like(emails.subject, `%${query}%`)
        )
      )
      .orderBy(desc(emails.receivedAt));
  }

  // Email summary operations
  static async saveEmailSummary(summaryData: {
    emailId: string;
    summary: string;
    actionItems?: string[];
    sentiment?: string;
    importance?: number;
  }) {
    const [summary] = await db.insert(emailSummaries).values(summaryData).returning();
    return summary;
  }

  static async getEmailSummary(emailId: string) {
    const [summary] = await db.select()
      .from(emailSummaries)
      .where(eq(emailSummaries.emailId, emailId));
    return summary;
  }

  // Automation operations
  static async saveAutomation(automationData: {
    userId: string;
    emailId: string;
    type: string;
    suggestion: any;
  }) {
    const [automation] = await db.insert(automations).values(automationData).returning();
    return automation;
  }

  static async getUserAutomations(userId: string, status?: string) {
    const conditions = [eq(automations.userId, userId)];
    if (status) {
      conditions.push(eq(automations.status, status));
    }

    return await db.select()
      .from(automations)
      .where(and(...conditions))
      .orderBy(desc(automations.createdAt));
  }

  static async updateAutomationStatus(automationId: string, status: string) {
    await db.update(automations)
      .set({ 
        status,
        executedAt: status === 'completed' ? new Date() : null
      })
      .where(eq(automations.id, automationId));
  }

  // User preferences
  static async getUserPreferences(userId: string) {
    const [prefs] = await db.select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return prefs;
  }

  static async updateUserPreferences(userId: string, updates: {
    autoMode?: boolean;
    darkMode?: boolean;
    emailSignature?: string;
    aiTonePreference?: string;
    notifications?: { email: boolean; push: boolean; important: boolean };
  }) {
    await db.update(userPreferences)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userPreferences.userId, userId));
  }

  // Analytics and insights
  static async getTodaysEmailStats(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysEmails = await db.select()
      .from(emails)
      .where(
        and(
          eq(emails.userId, userId),
          and(
            eq(emails.receivedAt, today),
            eq(emails.receivedAt, tomorrow)
          )
        )
      );

    return {
      total: todaysEmails.length,
      unread: todaysEmails.filter(email => !email.isRead).length,
      important: todaysEmails.filter(email => email.isImportant).length,
    };
  }

  static async getImportantUnreadEmails(userId: string, limit = 5) {
    return await db.select()
      .from(emails)
      .where(
        and(
          eq(emails.userId, userId),
          eq(emails.isRead, false),
          eq(emails.isImportant, true)
        )
      )
      .orderBy(desc(emails.receivedAt))
      .limit(limit);
  }
}