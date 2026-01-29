DROP TABLE "transport_logs" CASCADE;--> statement-breakpoint
ALTER TABLE "work_logs" ADD COLUMN "trip_cost" double precision;--> statement-breakpoint
ALTER TABLE "work_logs" ADD COLUMN "trip_description" text;