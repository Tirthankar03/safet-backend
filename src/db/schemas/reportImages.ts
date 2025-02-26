import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  vector,
  index,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { reports } from "./reports.js";

export const reportImages = pgTable(
  "report_images",
  {
    id: text("id").primaryKey(),
    report_id: text("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    // Nullable embedding; will be set only when an image contains a face.
    encoding: vector("encoding", { dimensions: 128 }),
    imageUrl: text("image_url").notNull().default("https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Michael_Jordan_in_2014.jpg/220px-Michael_Jordan_in_2014.jpg"),
    // Indicates whether the image has a face (and should have an encoding)
    hasFace: boolean("has_face").notNull().default(false),
  },
  (table) => [
    // Note: The vector index applies to the encoding column.
    // In similarity queries, ensure you filter by { has_face: true } to only compare valid embeddings.
    index("encodingIndex").using("hnsw", table.encoding.op("vector_cosine_ops")),
  ]
);

export const reportImagesRelations = relations(reportImages, ({ one }) => ({
  report: one(reports, {
    fields: [reportImages.report_id],
    references: [reports.id],
  }),
}));
