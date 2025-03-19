import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  vector,
  index,
  timestamp,
  boolean,
  varchar,
  geometry,
  primaryKey,
  integer,
} from "drizzle-orm/pg-core";
import { reports } from "./reports";
import { createInsertSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: varchar({ length: 255 }).notNull().unique(),
  phoneNumber: varchar({ length: 15 }).notNull().unique(),
  username: varchar({ length: 255 }).notNull(),
  password: varchar({ length: 255 }).notNull(),
  role: varchar({ length: 255 }).notNull().default("user"),
  currentLocation: geometry("location", {
    type: "point",
    srid: 4326,
  }).notNull(),
});

//many-many self relation

//Juntion table for user contacts
export const userContacts = pgTable(
  "user_contacts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }), //the actual user
    contactId: text("contact_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }), //their contact
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.contactId] })]
);

//relations
export const usersRelations = relations(users, ({ many }) => ({
  contacts: many(userContacts),
  //user can have many reports
  reports: many(reports),
}));

//add one-many relation between junction and actual table
export const userContactRelations = relations(userContacts, ({ one }) => ({
  user: one(users, {
    fields: [userContacts.userId],
    references: [users.id],
  }),
  contact: one(users, {
    fields: [userContacts.contactId],
    references: [users.id],
  }),
}));
