CREATE TABLE "daily_email_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"last_email_id" varchar(255) NOT NULL,
	"summary" text NOT NULL,
	"snippet" text NOT NULL,
	"key_points" json DEFAULT '[]'::json NOT NULL,
	"urgent_count" integer DEFAULT 0 NOT NULL,
	"total_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "daily_email_summaries" ADD CONSTRAINT "daily_email_summaries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;