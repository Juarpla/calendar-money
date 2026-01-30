CREATE TABLE "tithing_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"amount" double precision NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transport_logs" ADD COLUMN "is_paid" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "tithing_logs" ADD CONSTRAINT "tithing_logs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;