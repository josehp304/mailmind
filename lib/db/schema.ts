import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  json,
  varchar,
  uuid
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';

// Users table for authentication
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  image: text('image'),
  googleId: varchar('google_id', { length: 255 }).unique(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  tokenExpiry: timestamp('token_expiry'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Email labels/categories
export const labels = pgTable('labels', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'system' or 'custom'
  color: varchar('color', { length: 7 }), // hex color
  createdAt: timestamp('created_at').defaultNow(),
});

// Emails table - cached from Gmail API
export const emails = pgTable('emails', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  gmailId: varchar('gmail_id', { length: 255 }).notNull().unique(),
  threadId: varchar('thread_id', { length: 255 }).notNull(),
  subject: text('subject'),
  from: text('from').notNull(),
  to: text('to').notNull(),
  cc: text('cc'),
  bcc: text('bcc'),
  body: text('body'),
  htmlBody: text('html_body'),
  snippet: text('snippet'),
  labelIds: json('label_ids').$type<string[]>(),
  isRead: boolean('is_read').default(false),
  isImportant: boolean('is_important').default(false),
  isStarred: boolean('is_starred').default(false),
  hasAttachments: boolean('has_attachments').default(false),
  receivedAt: timestamp('received_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// AI-generated email summaries
export const emailSummaries = pgTable('email_summaries', {
  id: uuid('id').defaultRandom().primaryKey(),
  emailId: uuid('email_id').references(() => emails.id, { onDelete: 'cascade' }).notNull(),
  summary: text('summary').notNull(),
  actionItems: json('action_items').$type<string[]>(),
  sentiment: varchar('sentiment', { length: 50 }), // 'positive', 'negative', 'neutral'
  importance: integer('importance'), // 1-10 scale
  createdAt: timestamp('created_at').defaultNow(),
});

// AI automation suggestions
export const automations = pgTable('automations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  emailId: uuid('email_id').references(() => emails.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 100 }).notNull(), // 'calendar_event', 'contact_save', 'task_create'
  status: varchar('status', { length: 50 }).notNull().default('pending'), // 'pending', 'approved', 'rejected', 'completed'
  suggestion: json('suggestion').notNull(), // Contains the automation details
  executedAt: timestamp('executed_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// User preferences
export const userPreferences = pgTable('user_preferences', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  autoMode: boolean('auto_mode').default(false),
  darkMode: boolean('dark_mode').default(false),
  emailSignature: text('email_signature'),
  aiTonePreference: varchar('ai_tone_preference', { length: 50 }).default('professional'),
  notifications: json('notifications').$type<{
    email: boolean;
    push: boolean;
    important: boolean;
  }>().default({ email: true, push: true, important: true }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  emails: many(emails),
  labels: many(labels),
  automations: many(automations),
  preferences: one(userPreferences),
}));

export const emailsRelations = relations(emails, ({ one, many }) => ({
  user: one(users, { fields: [emails.userId], references: [users.id] }),
  summary: one(emailSummaries),
  automations: many(automations),
}));

export const labelsRelations = relations(labels, ({ one }) => ({
  user: one(users, { fields: [labels.userId], references: [users.id] }),
}));

export const emailSummariesRelations = relations(emailSummaries, ({ one }) => ({
  email: one(emails, { fields: [emailSummaries.emailId], references: [emails.id] }),
}));

export const automationsRelations = relations(automations, ({ one }) => ({
  user: one(users, { fields: [automations.userId], references: [users.id] }),
  email: one(emails, { fields: [automations.emailId], references: [emails.id] }),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, { fields: [userPreferences.userId], references: [users.id] }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertEmailSchema = createInsertSchema(emails);
export const selectEmailSchema = createSelectSchema(emails);
export const insertLabelSchema = createInsertSchema(labels);
export const selectLabelSchema = createSelectSchema(labels);
export const insertAutomationSchema = createInsertSchema(automations);
export const selectAutomationSchema = createSelectSchema(automations);
export const insertUserPreferencesSchema = createInsertSchema(userPreferences);
export const selectUserPreferencesSchema = createSelectSchema(userPreferences);