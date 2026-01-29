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

export const transportLogs = pgTable("transport_logs", {
  id: text("id").primaryKey(),
  workLogId: text("work_log_id").references(() => workLogs.id, { onDelete: 'cascade' }),
  date: text("date").notNull(), // YYYY-MM-DD
  companyId: text("company_id").references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  tripCost: doublePrecision("trip_cost").notNull(),
  description: text("description"),
});

