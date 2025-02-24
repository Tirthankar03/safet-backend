CREATE TABLE "report_clusters" (
	"cluster_id" text PRIMARY KEY NOT NULL,
	"polygon" jsonb NOT NULL,
	"centroid" jsonb NOT NULL,
	"markers" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" text PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"image_url" text DEFAULT '/default.jpg' NOT NULL,
	"address" text NOT NULL,
	"country" text NOT NULL,
	"city" text NOT NULL,
	"cluster_id" text,
	"location" geometry(point) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "face_encodings" (
	"id" text PRIMARY KEY NOT NULL,
	"report_id" text NOT NULL,
	"name" text NOT NULL,
	"encoding" vector(128),
	"image_url" text DEFAULT '/default.jpg' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "face_encodings" ADD CONSTRAINT "face_encodings_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "spatial_index" ON "reports" USING gist ("location");--> statement-breakpoint
CREATE INDEX "encodingIndex" ON "face_encodings" USING hnsw ("encoding" vector_cosine_ops);