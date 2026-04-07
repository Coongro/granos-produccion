CREATE TABLE "module_granos_produccion_production_batches" (
	"id" uuid PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"caliber" text NOT NULL,
	"kg" numeric NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "module_granos_produccion_supply_movements" (
	"id" uuid PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"supply_type" text NOT NULL,
	"movement_type" text NOT NULL,
	"quantity" numeric NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
