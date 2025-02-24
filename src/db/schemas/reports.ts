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
import { faceEncodings } from "./faces";

// Reports table
export const reports = pgTable(
  "reports",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    image_url: text("image_url").notNull().default("/default.jpg"),
    address: text("address").notNull(),
    country: text("country").notNull(),
    city: text("city").notNull(),
    cluster_id: text("cluster_id"),
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



export const reportsRelations = relations(reports, ({ many }) => ({
    faceEncodings: many(faceEncodings),
  }));