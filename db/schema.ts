import { pgTable, text, doublePrecision, integer, boolean } from "drizzle-orm/pg-core";

export const companies = pgTable("companies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  locationLink: text("location_link").notNull().default(''),
  hourlyRate: doublePrecision("hourly_rate").notNull(),
  color: text("color"),
});

export const workLogs = pgTable("work_logs", {
  id: text("id").primaryKey(),
  date: text("date").notNull(), // YYYY-MM-DD
  hour: integer("hour").notNull(),
  companyId: text("company_id").references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  isPaid: boolean("is_paid").default(false),
  hourlyRateSnapshot: doublePrecision("hourly_rate_snapshot"),
});
