"use client";

import { useMemo, useState } from "react";
import { Company, TithingLog, TransportLog, WorkLog } from "../types";
import {
  countFinancialExport,
  downloadFinancialExport,
  suggestExportRange,
  validateExportRange,
} from "../lib/exportFinancial";

interface ExportFinancialModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  workLogs: WorkLog[];
  transportLogs: TransportLog[];
  tithingLogs: TithingLog[];
}

export default function ExportFinancialModal({
  isOpen,
  onClose,
  companies,
  workLogs,
  transportLogs,
  tithingLogs,
}: ExportFinancialModalProps) {
  const suggested = suggestExportRange({ companies, workLogs, transportLogs, tithingLogs });
  const [from, setFrom] = useState(suggested.from);
  const [to, setTo] = useState(suggested.to);
  const [error, setError] = useState("");

  const counts = useMemo(() => {
    if (validateExportRange(from, to)) {
      return { hours: 0, transport: 0, tithing: 0, total: 0 };
    }
    return countFinancialExport({ companies, workLogs, transportLogs, tithingLogs }, from, to);
  }, [companies, workLogs, transportLogs, tithingLogs, from, to]);

  if (!isOpen) return null;

  const handleDownload = () => {
    const rangeError = validateExportRange(from, to);
    if (rangeError) {
      setError(rangeError);
      return;
    }
    if (counts.total === 0) {
      setError("No hay registros financieros en ese rango de fechas.");
      return;
    }
    downloadFinancialExport({ companies, workLogs, transportLogs, tithingLogs }, from, to);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 className="text-xl font-bold mb-1">Exportar data financiera</h3>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">
          Elige el periodo que quieres descargar. Esto solo genera una copia en Excel y no elimina ni modifica tus datos.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="export-from" className="block text-sm font-medium mb-2">
              Desde
            </label>
            <input
              id="export-from"
              type="date"
              value={from}
              onChange={(event) => {
                setFrom(event.target.value);
                setError("");
              }}
              className="w-full px-4 py-2 rounded border border-gray-200 dark:border-zinc-700 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="export-to" className="block text-sm font-medium mb-2">
              Hasta
            </label>
            <input
              id="export-to"
              type="date"
              value={to}
              onChange={(event) => {
                setTo(event.target.value);
                setError("");
              }}
              className="w-full px-4 py-2 rounded border border-gray-200 dark:border-zinc-700 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {validateExportRange(from, to) == null && (
          <p className="text-sm text-gray-600 dark:text-zinc-300 mb-4">
            {counts.total === 0
              ? "No hay registros en ese rango."
              : `${counts.hours} hora${counts.hours === 1 ? "" : "s"}, ${counts.transport} transporte${counts.transport === 1 ? "" : "s"} y ${counts.tithing} diezmo${counts.tithing === 1 ? "" : "s"}.`}
          </p>
        )}

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={validateExportRange(from, to) != null || counts.total === 0}
            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Descargar
          </button>
        </div>
      </div>
    </div>
  );
}
