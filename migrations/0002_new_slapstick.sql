CREATE TABLE "transport_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"company_id" text NOT NULL,
	"trip_cost" double precision NOT NULL,
	"description" text
);
--> statement-breakpoint
ALTER TABLE "transport_logs" ADD CONSTRAINT "transport_logs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_logs" DROP COLUMN "trip_cost";--> statement-breakpoint
ALTER TABLE "work_logs" DROP COLUMN "trip_description";