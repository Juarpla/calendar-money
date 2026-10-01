import * as XLSX from "xlsx";
import { Company, TithingLog, TransportLog, WorkLog } from "../types";

export interface FinancialExportInput {
  companies: Company[];
  workLogs: WorkLog[];
  transportLogs: TransportLog[];
  tithingLogs: TithingLog[];
}

export interface ExportCounts {
  hours: number;
  transport: number;
  tithing: number;
  total: number;
}

const HOURS_HEADERS = ["Fecha", "Hora", "Empresa", "Tarifa (S/)", "Importe (S/)", "Estado"] as const;
const TRANSPORT_HEADERS = ["Fecha", "Empresa", "Descripción", "Costo (S/)", "Estado"] as const;
const TITHING_HEADERS = ["Fecha", "Empresa", "Monto (S/)", "Estado"] as const;
const SUMMARY_HEADERS = ["Empresa", "Horas", "Ingresos (S/)", "Transporte (S/)", "Neto (S/)", "Diezmo (S/)"] as const;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Calendar dates stay as YYYY-MM-DD. Timestamps become the local calendar day. */
export function toLocalDateString(value: string): string {
  if (DATE_RE.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);
  return formatLocalDate(parsed);
}

export function isWithinRange(date: string, from: string, to: string): boolean {
  return date >= from && date <= to;
}

export function validateExportRange(from: string, to: string): string | null {
  if (!from || !to) return "Indica la fecha de inicio y la fecha de fin.";
  if (!DATE_RE.test(from) || !DATE_RE.test(to)) return "Usa fechas válidas.";
  if (from > to) return "La fecha de inicio no puede ser posterior a la fecha de fin.";
  return null;
}

export function suggestExportRange(input: FinancialExportInput, today = formatLocalDate(new Date())): { from: string; to: string } {
  const dates = [
    ...input.workLogs.map((log) => log.date),
    ...input.transportLogs.map((log) => log.date),
    ...input.tithingLogs.map((log) => toLocalDateString(log.createdAt)),
  ]
    .filter((date) => DATE_RE.test(date))
    .sort();

  if (dates.length === 0) {
    return { from: `${today.slice(0, 8)}01`, to: today };
  }

  const earliest = dates[0];
  const latest = dates[dates.length - 1];
  const to = latest > today ? latest : today;
  return { from: earliest, to };
}

function money(value: number): number {
  return Math.round(value * 100) / 100;
}

function companyName(companies: Company[], companyId: string): string {
  return companies.find((company) => company.id === companyId)?.name ?? "Sin empresa";
}

function paymentStatus(isPaid?: boolean): string {
  return isPaid ? "Pagado" : "Pendiente";
}

function periodLabel(from: string, to: string): string {
  return `${from} a ${to}`;
}

function sheetFromRows(
  rows: (string | number)[][],
  colWidths: number[],
  textColumns: number[],
  moneyColumns: number[],
): XLSX.WorkSheet {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1");

  for (let row = 0; row <= range.e.r; row++) {
    for (const column of textColumns) {
      const address = XLSX.utils.encode_cell({ r: row, c: column });
      const cell = sheet[address];
      if (!cell || cell.v == null || cell.v === "") continue;
      cell.t = "s";
      cell.v = String(cell.v);
      delete cell.w;
      delete cell.z;
    }
    if (row < 3) continue;
    for (const column of moneyColumns) {
      const address = XLSX.utils.encode_cell({ r: row, c: column });
      const cell = sheet[address];
      if (!cell || typeof cell.v !== "number") continue;
      cell.t = "n";
      cell.z = "0.00";
    }
  }

  sheet["!cols"] = colWidths.map((wch) => ({ wch }));
  return sheet;
}

interface FilteredFinancialData {
  hours: WorkLog[];
  transport: TransportLog[];
  tithing: TithingLog[];
}

export function filterFinancialData(input: FinancialExportInput, from: string, to: string): FilteredFinancialData {
  return {
    hours: input.workLogs
      .filter((log) => isWithinRange(log.date, from, to))
      .sort((a, b) => a.date.localeCompare(b.date) || a.hour - b.hour || a.id.localeCompare(b.id)),
    transport: input.transportLogs
      .filter((log) => isWithinRange(log.date, from, to))
      .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)),
    tithing: input.tithingLogs
      .filter((log) => isWithinRange(toLocalDateString(log.createdAt), from, to))
      .sort((a, b) => toLocalDateString(a.createdAt).localeCompare(toLocalDateString(b.createdAt)) || a.id.localeCompare(b.id)),
  };
}

export function countFinancialExport(input: FinancialExportInput, from: string, to: string): ExportCounts {
  const filtered = filterFinancialData(input, from, to);
  return {
    hours: filtered.hours.length,
    transport: filtered.transport.length,
    tithing: filtered.tithing.length,
    total: filtered.hours.length + filtered.transport.length + filtered.tithing.length,
  };
}

function rateForLog(log: WorkLog, companies: Company[]): number {
  if (log.hourlyRateSnapshot != null) return log.hourlyRateSnapshot;
  return companies.find((company) => company.id === log.companyId)?.hourlyRate ?? 0;
}

export function buildFinancialWorkbook(input: FinancialExportInput, from: string, to: string): XLSX.WorkBook {
  const filtered = filterFinancialData(input, from, to);
  const label = periodLabel(from, to);
  const workbook = XLSX.utils.book_new();

  const hourRows: (string | number)[][] = [
    ["Periodo", label],
    [],
    [...HOURS_HEADERS],
    ...filtered.hours.map((log) => {
      const rate = money(rateForLog(log, input.companies));
      return [
        log.date,
        `${String(log.hour).padStart(2, "0")}:00`,
        companyName(input.companies, log.companyId),
        rate,
        rate,
        paymentStatus(log.isPaid),
      ];
    }),
  ];

  const transportRows: (string | number)[][] = [
    ["Periodo", label],
    [],
    [...TRANSPORT_HEADERS],
    ...filtered.transport.map((log) => [
      log.date,
      companyName(input.companies, log.companyId),
      log.description ?? "",
      money(log.tripCost),
      paymentStatus(log.isPaid),
    ]),
  ];

  const tithingRows: (string | number)[][] = [
    ["Periodo", label],
    [],
    [...TITHING_HEADERS],
    ...filtered.tithing.map((log) => [
      toLocalDateString(log.createdAt),
      companyName(input.companies, log.companyId),
      money(log.amount),
      paymentStatus(log.isPaid),
    ]),
  ];

  const companyIds = new Set<string>([
    ...filtered.hours.map((log) => log.companyId),
    ...filtered.transport.map((log) => log.companyId),
    ...filtered.tithing.map((log) => log.companyId),
  ]);

  const summaryBody = [...companyIds]
    .map((companyId) => {
      const hours = filtered.hours.filter((log) => log.companyId === companyId);
      const transport = filtered.transport.filter((log) => log.companyId === companyId);
      const tithing = filtered.tithing.filter((log) => log.companyId === companyId);
      const income = money(hours.reduce((sum, log) => sum + rateForLog(log, input.companies), 0));
      const transportTotal = money(transport.reduce((sum, log) => sum + log.tripCost, 0));
      const tithingTotal = money(tithing.reduce((sum, log) => sum + log.amount, 0));
      return {
        name: companyName(input.companies, companyId),
        hours: hours.length,
        income,
        transport: transportTotal,
        net: money(income - transportTotal),
        tithing: tithingTotal,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  const totals = summaryBody.reduce(
    (sum, row) => ({
      hours: sum.hours + row.hours,
      income: money(sum.income + row.income),
      transport: money(sum.transport + row.transport),
      net: money(sum.net + row.net),
      tithing: money(sum.tithing + row.tithing),
    }),
    { hours: 0, income: 0, transport: 0, net: 0, tithing: 0 },
  );

  const summaryRows: (string | number)[][] = [
    ["Periodo", label],
    [],
    [...SUMMARY_HEADERS],
    ...summaryBody.map((row) => [row.name, row.hours, row.income, row.transport, row.net, row.tithing]),
    ["Total", totals.hours, totals.income, totals.transport, totals.net, totals.tithing],
  ];

  XLSX.utils.book_append_sheet(workbook, sheetFromRows(hourRows, [14, 10, 24, 14, 14, 14], [0, 1, 2, 5], [3, 4]), "Horas");
  XLSX.utils.book_append_sheet(workbook, sheetFromRows(transportRows, [14, 24, 28, 14, 14], [0, 1, 2, 4], [3]), "Transporte");
  XLSX.utils.book_append_sheet(workbook, sheetFromRows(tithingRows, [14, 24, 14, 14], [0, 1, 3], [2]), "Diezmo");
  XLSX.utils.book_append_sheet(workbook, sheetFromRows(summaryRows, [24, 10, 16, 16, 14, 14], [0], [2, 3, 4, 5]), "Resumen");

  return workbook;
}

export function financialExportFilename(from: string, to: string): string {
  return `finanzas_${from}_a_${to}.xlsx`;
}

export function downloadFinancialExport(input: FinancialExportInput, from: string, to: string): ExportCounts {
  const counts = countFinancialExport(input, from, to);
  if (counts.total === 0) return counts;
  const workbook = buildFinancialWorkbook(input, from, to);
  XLSX.writeFile(workbook, financialExportFilename(from, to));
  return counts;
}
