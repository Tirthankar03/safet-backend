ALTER TABLE "users" ADD COLUMN "phoneNumber" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_phoneNumber_unique" UNIQUE("phoneNumber");