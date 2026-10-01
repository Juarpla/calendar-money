import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import * as XLSX from "xlsx";
import { Company, TithingLog, TransportLog, WorkLog } from "../app/types";
import {
  buildFinancialWorkbook,
  countFinancialExport,
  filterFinancialData,
  financialExportFilename,
  suggestExportRange,
  toLocalDateString,
  validateExportRange,
  type FinancialExportInput,
} from "../app/lib/exportFinancial";

if (process.env.TZ !== "America/Lima") {
  throw new Error(`Este verificador debe correr con TZ=America/Lima. TZ actual: ${process.env.TZ ?? "(vacía)"}`);
}

const companies: Company[] = [
  { id: "c1", name: "Alfa", locationLink: "", hourlyRate: 20, color: "#111" },
  { id: "c2", name: "Beta", locationLink: "", hourlyRate: 30, color: "#222" },
];

const workLogs: WorkLog[] = [
  { id: "w-before", date: "2026-03-09", hour: 8, companyId: "c1", hourlyRateSnapshot: 25, isPaid: false },
  { id: "w-start-late", date: "2026-03-10", hour: 9, companyId: "c1", hourlyRateSnapshot: 25, isPaid: true },
  { id: "w-start-early", date: "2026-03-10", hour: 7, companyId: "c2", isPaid: false },
  { id: "w-end", date: "2026-03-15", hour: 18, companyId: "c1", hourlyRateSnapshot: 40, isPaid: false },
  { id: "w-after", date: "2026-03-16", hour: 8, companyId: "c2", hourlyRateSnapshot: 10, isPaid: true },
];

const transportLogs: TransportLog[] = [
  { id: "t-before", date: "2026-03-09", companyId: "c1", tripCost: 5.5, description: "Fuera", isPaid: false },
  { id: "t-start", date: "2026-03-10", companyId: "c1", tripCost: 12.5, description: "Bus", isPaid: false },
  { id: "t-end", date: "2026-03-15", companyId: "c2", tripCost: 8, isPaid: true },
  { id: "t-after", date: "2026-03-16", companyId: "c1", tripCost: 3, description: "Taxi", isPaid: false },
];

const tithingLogs: TithingLog[] = [
  { id: "d-before", companyId: "c1", amount: 1, createdAt: "2026-03-10T04:59:00.000Z", isPaid: false },
  { id: "d-start", companyId: "c1", amount: 4.5, createdAt: "2026-03-10T05:00:00.000Z", isPaid: true },
  { id: "d-end", companyId: "c2", amount: 11.11, createdAt: "2026-03-16T04:59:00.000Z", isPaid: false },
  { id: "d-after", companyId: "c2", amount: 99, createdAt: "2026-03-16T05:00:00.000Z", isPaid: true },
];

const input: FinancialExportInput = { companies, workLogs, transportLogs, tithingLogs };
const from = "2026-03-10";
const to = "2026-03-15";

assert.equal(toLocalDateString("2026-03-10T04:59:00.000Z"), "2026-03-09");
assert.equal(toLocalDateString("2026-03-10T05:00:00.000Z"), "2026-03-10");
assert.equal(toLocalDateString("2026-03-16T04:59:00.000Z"), "2026-03-15");
assert.equal(toLocalDateString("2026-03-16T05:00:00.000Z"), "2026-03-16");
assert.equal(toLocalDateString("2026-03-10"), "2026-03-10");

assert.equal(validateExportRange(from, to), null);
assert.equal(validateExportRange("2026-03-16", "2026-03-10"), "La fecha de inicio no puede ser posterior a la fecha de fin.");

const snapshot = JSON.stringify(input);
const counts = countFinancialExport(input, from, to);
assert.deepEqual(counts, { hours: 3, transport: 2, tithing: 2, total: 7 });
assert.deepEqual(
  filterFinancialData(input, from, to).hours.map((log) => log.id),
  ["w-start-early", "w-start-late", "w-end"],
);
assert.equal(JSON.stringify(input), snapshot);

const workbook = buildFinancialWorkbook(input, from, to);
assert.equal(JSON.stringify(input), snapshot);
assert.deepEqual(workbook.SheetNames, ["Horas", "Transporte", "Diezmo", "Resumen"]);

const filePath = path.join(os.tmpdir(), financialExportFilename(from, to));
const written = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
fs.writeFileSync(filePath, written);
const opened = XLSX.read(fs.readFileSync(filePath), { type: "buffer", cellDates: false });

function cell(sheetName: string, row: number, column: number) {
  const sheet = opened.Sheets[sheetName];
  return sheet[XLSX.utils.encode_cell({ r: row, c: column })];
}

function text(sheetName: string, row: number, column: number): string {
  const value = cell(sheetName, row, column);
  assert.ok(value, `Falta ${sheetName} ${XLSX.utils.encode_cell({ r: row, c: column })}`);
  return String(value.v);
}

function numberValue(sheetName: string, row: number, column: number): number {
  const value = cell(sheetName, row, column);
  assert.ok(value, `Falta número ${sheetName} fila ${row + 1}`);
  assert.equal(value.t, "n");
  return value.v as number;
}

function dataRows(sheetName: string, stopAtTotal = false): number[] {
  const rows: number[] = [];
  for (let row = 3; row < 50; row++) {
    const value = cell(sheetName, row, 0);
    if (!value || value.v == null || value.v === "") break;
    if (stopAtTotal && value.v === "Total") break;
    rows.push(row);
  }
  return rows;
}

function assertDatesInRange(sheetName: string, column: number, rangeFrom: string, rangeTo: string) {
  const rows = dataRows(sheetName, sheetName === "Resumen");
  assert.ok(rows.length > 0, `${sheetName} no tiene filas`);
  for (const row of rows) {
    const date = text(sheetName, row, column);
    assert.match(date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(date >= rangeFrom && date <= rangeTo, `${sheetName} incluye ${date}, fuera de ${rangeFrom} a ${rangeTo}`);
  }
}

function columnWidths(sheetFile: string): number[] {
  const xml = execFileSync("unzip", ["-p", filePath, `xl/worksheets/${sheetFile}`], { encoding: "utf8" });
  return [...xml.matchAll(/<col[^>]*width="([\d.]+)"/g)].map((match) => Number(match[1]));
}

for (const [sheetName, sheetFile] of [
  ["Horas", "sheet1.xml"],
  ["Transporte", "sheet2.xml"],
  ["Diezmo", "sheet3.xml"],
  ["Resumen", "sheet4.xml"],
] as const) {
  assert.equal(text(sheetName, 0, 0), "Periodo");
  assert.equal(text(sheetName, 0, 1), "2026-03-10 a 2026-03-15");
  const widths = columnWidths(sheetFile);
  assert.ok(widths.length >= 4 && widths.every((width) => width >= 10), `${sheetName} no tiene anchos de columna: ${widths.join(", ")}`);
}

assert.deepEqual(
  [0, 1, 2, 3, 4, 5].map((column) => text("Horas", 2, column)),
  ["Fecha", "Hora", "Empresa", "Tarifa (S/)", "Importe (S/)", "Estado"],
);
assert.deepEqual(
  [0, 1, 2, 3, 4].map((column) => text("Transporte", 2, column)),
  ["Fecha", "Empresa", "Descripción", "Costo (S/)", "Estado"],
);
assert.deepEqual(
  [0, 1, 2, 3].map((column) => text("Diezmo", 2, column)),
  ["Fecha", "Empresa", "Monto (S/)", "Estado"],
);
assert.deepEqual(
  [0, 1, 2, 3, 4, 5].map((column) => text("Resumen", 2, column)),
  ["Empresa", "Horas", "Ingresos (S/)", "Transporte (S/)", "Neto (S/)", "Diezmo (S/)"],
);

const hourRows = dataRows("Horas");
assert.equal(hourRows.length, 3);
assert.deepEqual(hourRows.map((row) => text("Horas", row, 0)), ["2026-03-10", "2026-03-10", "2026-03-15"]);
assert.deepEqual(hourRows.map((row) => text("Horas", row, 1)), ["07:00", "09:00", "18:00"]);
assert.deepEqual(hourRows.map((row) => text("Horas", row, 2)), ["Beta", "Alfa", "Alfa"]);
assert.equal(numberValue("Horas", hourRows[0], 3), 30);
assert.equal(numberValue("Horas", hourRows[0], 4), 30);
assert.equal(text("Horas", hourRows[0], 5), "Pendiente");
assert.equal(numberValue("Horas", hourRows[1], 3), 25);
assert.equal(text("Horas", hourRows[1], 5), "Pagado");
assert.equal(numberValue("Horas", hourRows[2], 3), 40);
assertDatesInRange("Horas", 0, from, to);
assert.equal(cell("Horas", 6, 0), undefined);

const transportRows = dataRows("Transporte");
assert.equal(transportRows.length, 2);
assert.deepEqual(transportRows.map((row) => text("Transporte", row, 0)), ["2026-03-10", "2026-03-15"]);
assert.equal(text("Transporte", transportRows[0], 1), "Alfa");
assert.equal(text("Transporte", transportRows[0], 2), "Bus");
assert.equal(numberValue("Transporte", transportRows[0], 3), 12.5);
assert.equal(text("Transporte", transportRows[0], 4), "Pendiente");
assert.equal(text("Transporte", transportRows[1], 1), "Beta");
assert.equal(cell("Transporte", transportRows[1], 2)?.v ?? "", "");
assert.equal(numberValue("Transporte", transportRows[1], 3), 8);
assert.equal(text("Transporte", transportRows[1], 4), "Pagado");
assertDatesInRange("Transporte", 0, from, to);

const tithingRows = dataRows("Diezmo");
assert.equal(tithingRows.length, 2);
assert.deepEqual(tithingRows.map((row) => text("Diezmo", row, 0)), ["2026-03-10", "2026-03-15"]);
assert.equal(text("Diezmo", tithingRows[0], 1), "Alfa");
assert.equal(numberValue("Diezmo", tithingRows[0], 2), 4.5);
assert.equal(text("Diezmo", tithingRows[0], 3), "Pagado");
assert.equal(text("Diezmo", tithingRows[1], 1), "Beta");
assert.equal(numberValue("Diezmo", tithingRows[1], 2), 11.11);
assert.equal(text("Diezmo", tithingRows[1], 3), "Pendiente");
assertDatesInRange("Diezmo", 0, from, to);

const summaryRows = dataRows("Resumen", true);
assert.deepEqual(summaryRows.map((row) => text("Resumen", row, 0)), ["Alfa", "Beta"]);
assert.deepEqual(
  summaryRows.map((row) => [1, 2, 3, 4, 5].map((column) => numberValue("Resumen", row, column))),
  [
    [2, 65, 12.5, 52.5, 4.5],
    [1, 30, 8, 22, 11.11],
  ],
);
const totalRow = summaryRows[summaryRows.length - 1] + 1;
assert.equal(text("Resumen", totalRow, 0), "Total");
assert.deepEqual(
  [1, 2, 3, 4, 5].map((column) => numberValue("Resumen", totalRow, column)),
  [3, 95, 20.5, 74.5, 15.61],
);

const dayAfter = "2026-03-16";
const afterCounts = countFinancialExport(input, dayAfter, dayAfter);
assert.deepEqual(afterCounts, { hours: 1, transport: 1, tithing: 1, total: 3 });
const afterBook = XLSX.read(
  XLSX.write(buildFinancialWorkbook(input, dayAfter, dayAfter), { type: "buffer", bookType: "xlsx" }),
  { type: "buffer" },
);
function readBack(book: XLSX.WorkBook, sheetName: string, row: number, column: number) {
  return book.Sheets[sheetName][XLSX.utils.encode_cell({ r: row, c: column })]?.v;
}
assert.equal(readBack(afterBook, "Horas", 0, 1), "2026-03-16 a 2026-03-16");
assert.equal(readBack(afterBook, "Horas", 3, 0), "2026-03-16");
assert.equal(readBack(afterBook, "Horas", 3, 2), "Beta");
assert.equal(readBack(afterBook, "Horas", 4, 0), undefined);
assert.equal(readBack(afterBook, "Transporte", 3, 0), "2026-03-16");
assert.equal(readBack(afterBook, "Diezmo", 3, 0), "2026-03-16");
assert.equal(readBack(afterBook, "Diezmo", 3, 2), 99);
assert.equal(readBack(afterBook, "Diezmo", 4, 0), undefined);
assert.equal(readBack(afterBook, "Resumen", 3, 0), "Alfa");
assert.equal(readBack(afterBook, "Resumen", 3, 1), 0);
assert.equal(readBack(afterBook, "Resumen", 3, 3), 3);
assert.equal(readBack(afterBook, "Resumen", 3, 5), 0);
assert.equal(readBack(afterBook, "Resumen", 4, 0), "Beta");
assert.equal(readBack(afterBook, "Resumen", 4, 1), 1);
assert.equal(readBack(afterBook, "Resumen", 4, 2), 10);
assert.equal(readBack(afterBook, "Resumen", 4, 5), 99);
assert.equal(readBack(afterBook, "Resumen", 5, 0), "Total");
assert.equal(readBack(afterBook, "Resumen", 5, 5), 99);

const dayBefore = "2026-03-09";
const beforeBook = XLSX.read(
  XLSX.write(buildFinancialWorkbook(input, dayBefore, dayBefore), { type: "buffer", bookType: "xlsx" }),
  { type: "buffer" },
);
assert.equal(readBack(beforeBook, "Horas", 0, 1), "2026-03-09 a 2026-03-09");
assert.equal(readBack(beforeBook, "Horas", 3, 0), "2026-03-09");
assert.equal(readBack(beforeBook, "Horas", 4, 0), undefined);
assert.equal(readBack(beforeBook, "Transporte", 3, 0), "2026-03-09");
assert.equal(readBack(beforeBook, "Diezmo", 3, 0), "2026-03-09");
assert.equal(readBack(beforeBook, "Diezmo", 3, 2), 1);
assert.notEqual(readBack(beforeBook, "Horas", 3, 0), "2026-03-10");

assert.deepEqual(countFinancialExport(input, "2026-01-01", "2026-01-02"), {
  hours: 0,
  transport: 0,
  tithing: 0,
  total: 0,
});

const emptyBook = XLSX.read(
  XLSX.write(buildFinancialWorkbook(input, "2026-01-01", "2026-01-02"), { type: "buffer", bookType: "xlsx" }),
  { type: "buffer" },
);
assert.equal(readBack(emptyBook, "Horas", 0, 1), "2026-01-01 a 2026-01-02");
assert.equal(readBack(emptyBook, "Horas", 3, 0), undefined);
assert.equal(readBack(emptyBook, "Resumen", 3, 0), "Total");
assert.equal(readBack(emptyBook, "Resumen", 3, 1), 0);

assert.deepEqual(suggestExportRange(input, "2026-04-01"), { from: "2026-03-09", to: "2026-04-01" });
assert.deepEqual(suggestExportRange(input, "2026-03-12"), { from: "2026-03-09", to: "2026-03-16" });
assert.deepEqual(suggestExportRange({ companies, workLogs: [], transportLogs: [], tithingLogs: [] }, "2026-04-09"), {
  from: "2026-04-01",
  to: "2026-04-09",
});

console.log(`Excel verificado: ${filePath}`);
console.log("El rango 2026-03-10 a 2026-03-15 incluye los límites y excluye el día anterior y el siguiente.");
console.log("El diezmo usa el día local de America/Lima y las fechas de horas y transporte no se desplazan.");
