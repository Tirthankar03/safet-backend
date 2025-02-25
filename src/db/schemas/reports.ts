import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  jsonb,
  vector,
  index,
  integer,
  geometry,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { reportImages } from "./reportImages";
import { users } from "./users";

// Reports table
export const reports = pgTable(
  "reports",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    address: text("address").notNull(),
    country: text("country").notNull(),
    city: text("city").notNull(),
    cluster_id: text("cluster_id"),
    type: varchar({ length: 255 }).notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }), 
    location: geometry("location", {
      type: "point",
      srid: 4326,
    }).notNull(),
  },
  (t) => ({
    spatialIndex: index("spatial_index").using("gist", t.location),
  })
);

// Report Clusters table
export const reportClusters = pgTable("report_clusters", {
  cluster_id: text("cluster_id").primaryKey(),
  polygon: jsonb("polygon").notNull(),
  centroid: jsonb("centroid").notNull(),
  markers: jsonb("markers").notNull(),
});



export const reportsRelations = relations(reports, ({ many, one }) => ({
    reportImages: many(reportImages),
    user: one(users, {
      fields: [reports.userId],
      references: [users.id]
    })
  }));