import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  jsonb,
  vector,
  index,
  integer,
  geometry,
} from "drizzle-orm/pg-core";
import { reports } from "./reports";


// Face Encodings table
export const faceEncodings = pgTable(
    "face_encodings",
    {
      id: text("id").primaryKey(),
      report_id: text("report_id")
        .notNull()
        .references(() => reports.id, { onDelete: "cascade" }),
      name: text("name").notNull(),
      encoding: vector("encoding", { dimensions: 128 }),
      image_url: text("image_url").notNull().default("/default.jpg"),
    },
    (table) => [
        index("encodingIndex").using('hnsw', table.encoding.op('vector_cosine_ops')),
      ]
  );


  export const faceEncodingsRelations = relations(faceEncodings, ({ one }) => ({
    report: one(reports, {
      fields: [faceEncodings.report_id],
      references: [reports.id],
    }),
  }));