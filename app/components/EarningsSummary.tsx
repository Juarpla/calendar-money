"use client";
import { useEffect, useState } from 'react';
import { Company, WorkLog } from '../types';

interface EarningsSummaryProps {
  companies: Company[];
  workLogs: WorkLog[];
}

export default function EarningsSummary({ companies, workLogs }: EarningsSummaryProps) {
  const [now, setNow] = useState<Date | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const earningsByCompany = companies.map(company => {
    // Filter only unpaid logs for the summary
    const logs = workLogs.filter(log => {
      // Basic filtering
      if (log.companyId !== company.id || log.isPaid) return false;

      // If we haven't determined "now" yet (SSR), don't include to avoid mismatch
      if (!now) return false;

      // Check if 1 hour has passed since start time
      const [year, month, day] = log.date.split('-').map(Number);
      // Construct completion time: date + hour + 1 hour (60 mins)
      const completionTime = new Date(year, month - 1, day, log.hour + 1, 0, 0);

      return now >= completionTime;
    });

    // Calculate total earned summing individual log rates
    const totalEarned = logs.reduce((sum, log) => {
        // Use snapshot if available, otherwise current company rate (backward compatibility)
        const rate = log.hourlyRateSnapshot ?? company.hourlyRate;
        return sum + rate;
    }, 0);

    const totalHours = logs.length;

    return {
      ...company,
      totalHours,
      totalEarned
    };
  });

  const grandTotal = earningsByCompany.reduce((sum, c) => sum + c.totalEarned, 0);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-lg font-bold mb-4"
      >
        <span>💰 Resumen de Pagos</span>
        <span>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="space-y-4">
          {earningsByCompany.map(item => (
            <div key={item.id} className="flex flex-col border-b last:border-0 pb-2 dark:border-zinc-700">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color || '#3b82f6' }} />
                  <span className="font-semibold">{item.name}</span>
                </div>
                <span className="text-green-600 dark:text-green-400 font-bold">S/. {item.totalEarned.toFixed(2)}</span>
              </div>
              <div className="text-sm text-gray-500 flex justify-between pl-5">
                <span>{item.totalHours} horas @ S/. {item.hourlyRate}/hr</span>
                {item.locationLink && (
                  <a href={item.locationLink} target="_blank" className="text-blue-500 hover:underline">Ubicación</a>
                )}
              </div>
            </div>
          ))}

          {earningsByCompany.length === 0 && (
              <p className="text-gray-500">No hay trabajo pendiente de pago.</p>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t dark:border-zinc-700 flex justify-between items-center">
         <span className="text-xl font-bold">Total Pendiente</span>
         <span className="text-2xl font-bold text-green-600 dark:text-green-400">S/. {grandTotal.toFixed(2)}</span>
      </div>
    </div>
  );
}
