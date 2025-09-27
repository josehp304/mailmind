import { db } from './index';
import { users, emails, labels, emailSummaries, automations, userPreferences, emailProcessingResults, dailyEmailSummaries } from './schema';
import { eq, desc, and, like, inArray, gt } from 'drizzle-orm';

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

  static async updateLastIndexedEmail(userId: string, gmailId: string) {
    await db.update(users)
      .set({ lastIndexedEmailId: gmailId, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  static async getLastIndexedEmailId(userId: string): Promise<string | null> {
    const [user] = await db.select({ lastIndexedEmailId: users.lastIndexedEmailId })
      .from(users)
      .where(eq(users.id, userId));
    return user?.lastIndexedEmailId || null;
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

  // Email processing results operations
  static async saveEmailProcessingResult(resultData: {
    userId: string;
    emailId: string;
    gmailId: string;
    summary?: string;
    requiresMeeting?: boolean;
    meetingReason?: string;
    suggestedReply?: string;
    replyDraftId?: string;
    calendarEventId?: string;
    calendarEventLink?: string;
    processingStatus?: string;
  }) {
    const [result] = await db.insert(emailProcessingResults)
      .values(resultData)
      .returning();
    return result;
  }

  static async getEmailProcessingResult(userId: string, gmailId: string) {
    const [result] = await db.select()
      .from(emailProcessingResults)
      .where(
        and(
          eq(emailProcessingResults.userId, userId),
          eq(emailProcessingResults.gmailId, gmailId)
        )
      );
    return result;
  }

  static async updateEmailProcessingResult(
    userId: string, 
    gmailId: string, 
    updates: {
      summary?: string;
      requiresMeeting?: boolean;
      meetingReason?: string;
      suggestedReply?: string;
      replyDraftId?: string;
      calendarEventId?: string;
      calendarEventLink?: string;
      processingStatus?: string;
    }
  ) {
    await db.update(emailProcessingResults)
      .set({ ...updates, updatedAt: new Date() })
      .where(
        and(
          eq(emailProcessingResults.userId, userId),
          eq(emailProcessingResults.gmailId, gmailId)
        )
      );
  }

  static async getEmailsNeedingMeeting(userId: string, limit = 10) {
    return await db.select({
      email: emails,
      processing: emailProcessingResults
    })
      .from(emailProcessingResults)
      .innerJoin(emails, eq(emailProcessingResults.emailId, emails.id))
      .where(
        and(
          eq(emailProcessingResults.userId, userId),
          eq(emailProcessingResults.requiresMeeting, true),
          eq(emailProcessingResults.processingStatus, 'pending')
        )
      )
      .orderBy(desc(emails.receivedAt))
      .limit(limit);
  }

  static async getNewEmailsSinceLastIndexed(userId: string, gmailIds: string[]) {
    const lastIndexedId = await this.getLastIndexedEmailId(userId);
    
    if (!lastIndexedId) {
      // If no last indexed email, return all provided emails
      return await db.select()
        .from(emails)
        .where(
          and(
            eq(emails.userId, userId),
            inArray(emails.gmailId, gmailIds)
          )
        )
        .orderBy(desc(emails.receivedAt));
    }

    // Find emails newer than the last indexed one
    return await db.select()
      .from(emails)
      .where(
        and(
          eq(emails.userId, userId),
          inArray(emails.gmailId, gmailIds),
          gt(emails.receivedAt, 
            db.select({ receivedAt: emails.receivedAt })
              .from(emails)
              .where(eq(emails.gmailId, lastIndexedId))
          )
        )
      )
      .orderBy(desc(emails.receivedAt));
  }

  // Daily summary operations
  static async getDailySummary(userId: string, date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    const dateKey = targetDate.toISOString().split('T')[0];
    
    const [summary] = await db.select()
      .from(dailyEmailSummaries)
      .where(
        and(
          eq(dailyEmailSummaries.userId, userId),
          eq(dailyEmailSummaries.date, targetDate)
        )
      )
      .orderBy(desc(dailyEmailSummaries.updatedAt))
      .limit(1);
    
    return summary;
  }

  static async saveDailySummary(summaryData: {
    userId: string;
    date: string;
    lastEmailId?: string;
    summary: string;
    snippet: string;
    keyPoints: string[];
    urgentCount: number;
    totalCount: number;
  }) {
    const targetDate = new Date(summaryData.date);
    
    // Use upsert pattern - try to update first, then insert if not exists
    const existingSummary = await this.getDailySummary(summaryData.userId, summaryData.date);
    
    if (existingSummary) {
      const [updatedSummary] = await db.update(dailyEmailSummaries)
        .set({
          lastEmailId: summaryData.lastEmailId,
          summary: summaryData.summary,
          snippet: summaryData.snippet,
          keyPoints: summaryData.keyPoints,
          urgentCount: summaryData.urgentCount,
          totalCount: summaryData.totalCount,
          updatedAt: new Date(),
        })
        .where(eq(dailyEmailSummaries.id, existingSummary.id))
        .returning();
      
      return updatedSummary;
    } else {
      const [newSummary] = await db.insert(dailyEmailSummaries)
        .values({
          userId: summaryData.userId,
          date: targetDate,
          lastEmailId: summaryData.lastEmailId || '',
          summary: summaryData.summary,
          snippet: summaryData.snippet,
          keyPoints: summaryData.keyPoints,
          urgentCount: summaryData.urgentCount,
          totalCount: summaryData.totalCount,
        })
        .returning();
      
      return newSummary;
    }
  }

  static async getRecentDailySummaries(userId: string, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return await db.select()
      .from(dailyEmailSummaries)
      .where(
        and(
          eq(dailyEmailSummaries.userId, userId),
          gt(dailyEmailSummaries.date, startDate)
        )
      )
      .orderBy(desc(dailyEmailSummaries.date));
  }
}