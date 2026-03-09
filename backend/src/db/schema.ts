import { int, text, sqliteTable } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // internal UUID
  googleId: text("googleId").notNull().unique(), // Google's `sub` claim
  username: text("username").notNull().unique(), // generated: "silent-crimson-falcon"
  avatarUrl: text("avatarUrl"), // Google profile picture
  createdAt: text("createdAt").notNull(),
});

export const tickets = sqliteTable("tickets", {
  id: text("id").primaryKey(),
  userId: text("userId").references(() => users.id, { onDelete: "set null" }),
  subject: text("subject").notNull(),
  description: text("description").notNull().default(""),
  type: text("type", {
    enum: ["bug", "billing", "account", "feature-request", "feedback", "other"],
  })
    .notNull()
    .default("other"),
  status: text("status", {
    enum: ["open", "in-progress", "resolved", "closed"],
  })
    .notNull()
    .default("open"),
  createdAt: text("createdAt").notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  data: text("data").notNull(),
  expiresAt: int("expires_at").notNull(), // unix ms
});
