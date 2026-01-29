"use client";
import { useState, useEffect } from 'react';
import { Company, TransportLog, WorkLog } from '../types';

interface TransportSummaryProps {
  companies: Company[];
  transportLogs: TransportLog[];
  workLogs: WorkLog[];
}

export default function TransportSummary({ companies, transportLogs, workLogs }: TransportSummaryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const transportByCompany = companies.map(company => {
    // Filter transport logs for this company (only unpaid and after 1 hour has passed)
    const logs = transportLogs.filter(log => {
      if (log.companyId !== company.id || log.isPaid) return false;

      // Find the associated workLog to get the hour
      const workLog = workLogs.find(w => w.id === log.workLogId);
      if (!workLog) return false;

      // Check if 1 hour has passed since the work started
      const [year, month, day] = log.date.split('-').map(Number);
      const completionTime = new Date(year, month - 1, day, workLog.hour + 1, 0, 0);

      return now >= completionTime;
    });

    // Calculate total transport cost
    const totalCost = logs.reduce((sum, log) => sum + log.tripCost, 0);
    const totalTrips = logs.length;

    return {
      ...company,
      totalTrips,
      totalCost,
      logs
    };
  }).filter(item => item.totalTrips > 0); // Only show companies with transport logs

  const grandTotal = transportByCompany.reduce((sum, c) => sum + c.totalCost, 0);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-lg font-bold mb-4"
      >
        <span>🚗 Gastos de Movilidad</span>
        <span>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="space-y-4">
          {transportByCompany.map(item => (
            <div key={item.id} className="flex flex-col border-b last:border-0 pb-3 dark:border-zinc-700">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color || '#3b82f6' }} />
                  <span className="font-semibold">{item.name}</span>
                </div>
                <span className="text-orange-600 dark:text-orange-400 font-bold">S/. {item.totalCost.toFixed(2)}</span>
              </div>

              <div className="text-sm text-gray-500 pl-5">
                <span>{item.totalTrips} viaje{item.totalTrips !== 1 ? 's' : ''} ida y vuelta </span>
              </div>
            </div>
          ))}

          {transportByCompany.length === 0 && (
            <p className="text-gray-500">No hay gastos de movilidad registrados.</p>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t dark:border-zinc-700 flex justify-between items-center">
        <span className="text-xl font-bold">Total Movilidad</span>
        <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">S/. {grandTotal.toFixed(2)}</span>
      </div>
    </div>
  );
}
