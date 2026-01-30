"use server";

import { db } from "@/db";
import { companies, workLogs, transportLogs, tithingLogs } from "@/db/schema";
import { Company, WorkLog, TransportLog, TithingLog } from "./types";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getCompanies() {
  const result = await db.select().from(companies);
  return result.map(c => ({
      ...c,
      color: c.color ?? undefined,
  }));
}

export async function getWorkLogs() {
  const result = await db.select().from(workLogs);
  return result.map(l => ({
      ...l,
      isPaid: l.isPaid ?? undefined,
      hourlyRateSnapshot: l.hourlyRateSnapshot ?? undefined,
  }));
}

export async function createCompanyAction(data: Company) {
  await db.insert(companies).values(data);
  revalidatePath("/");
}

export async function updateCompanyAction(data: Company) {
  await db.update(companies)
    .set(data)
    .where(eq(companies.id, data.id));
  revalidatePath("/");
}

export async function deleteCompanyAction(id: string) {
  await db.delete(companies).where(eq(companies.id, id));
  revalidatePath("/");
}

export async function createOrUpdateWorkLogAction(data: WorkLog) {
   const existing = await db.select().from(workLogs).where(eq(workLogs.id, data.id));
   if (existing.length > 0) {
       await db.update(workLogs).set(data).where(eq(workLogs.id, data.id));
   } else {
       // Ideally we check if there is ALREADY a log for this date/hour, to prevent duplicates if ID was generated blindly new
       // But assuming client side handles ID assignment correctly
       await db.insert(workLogs).values(data);
   }
   revalidatePath("/");
}

export async function deleteWorkLogAction(id: string) {
    await db.delete(workLogs).where(eq(workLogs.id, id));
    revalidatePath("/");
}

export async function resetPaymentsAction(companyId: string) {
    await db.update(workLogs)
        .set({ isPaid: true })
        .where(
            and(
                eq(workLogs.companyId, companyId),
                // eq(workLogs.isPaid, false) // Optional, but updating all is fine
            )
        );
    revalidatePath("/");
}

// Transport Logs Actions
export async function getTransportLogs() {
  const result = await db.select().from(transportLogs);
  return result.map(t => ({
      ...t,
      workLogId: t.workLogId ?? undefined,
      description: t.description ?? undefined,
      isPaid: t.isPaid ?? undefined,
  }));
}

export async function createTransportLogAction(data: TransportLog) {
  await db.insert(transportLogs).values(data);
  revalidatePath("/");
}

export async function updateTransportLogAction(data: TransportLog) {
  await db.update(transportLogs)
    .set(data)
    .where(eq(transportLogs.id, data.id));
  revalidatePath("/");
}

export async function createOrUpdateTransportLogAction(data: TransportLog) {
  // Check if there's already a transport log for this workLogId
  if (data.workLogId) {
    const existing = await db.select().from(transportLogs).where(eq(transportLogs.workLogId, data.workLogId));
    if (existing.length > 0) {
      // Update existing transport log
      await db.update(transportLogs)
        .set({
          tripCost: data.tripCost,
          description: data.description,
          companyId: data.companyId,
          date: data.date,
        })
        .where(eq(transportLogs.id, existing[0].id));
      revalidatePath("/");
      return existing[0].id; // Return the existing ID
    }
  }

  // Create new transport log
  await db.insert(transportLogs).values(data);
  revalidatePath("/");
  return data.id; // Return the new ID
}

export async function deleteTransportLogAction(id: string) {
  await db.delete(transportLogs).where(eq(transportLogs.id, id));
  revalidatePath("/");
}

export async function resetTransportPaymentsAction(companyId: string) {
  await db.update(transportLogs)
    .set({ isPaid: true })
    .where(eq(transportLogs.companyId, companyId));
  revalidatePath("/");
}

// Tithing Logs Actions
export async function getTithingLogs() {
  const result = await db.select().from(tithingLogs);
  return result;
}

export async function createTithingLogAction(data: TithingLog) {
  await db.insert(tithingLogs).values(data);
  revalidatePath("/");
}
