"use client";
import { useState } from 'react';
import { Company, TithingLog } from '../types';

interface TithingSummaryProps {
  companies: Company[];
  tithingLogs: TithingLog[];
  onResetTithing: (companyId: string) => void;
}

export default function TithingSummary({ companies, tithingLogs, onResetTithing }: TithingSummaryProps) {
  const [isOpen, setIsOpen] = useState(false);

  const tithingByCompany = companies.map(company => {
    // Filter tithing logs for this company (only unpaid)
    const logs = tithingLogs.filter(log => log.companyId === company.id && !log.isPaid);

    // Calculate total tithing amount
    const totalAmount = logs.reduce((sum, log) => sum + log.amount, 0);

    return {
      ...company,
      totalAmount,
      count: logs.length
    };
  }).filter(item => item.count > 0); // Only show companies with unpaid tithing logs

  const grandTotal = tithingByCompany.reduce((sum, c) => sum + c.totalAmount, 0);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-lg font-bold mb-4"
      >
        <span>🙏 Diezmo Acumulado</span>
        <span>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="space-y-4">
          {tithingByCompany.map(item => (
            <div key={item.id} className="flex flex-col border-b last:border-0 pb-3 dark:border-zinc-700">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color || '#3b82f6' }} />
                  <span className="font-semibold">{item.name}</span>
                </div>
                <span className="text-purple-600 dark:text-purple-400 font-bold">S/. {item.totalAmount.toFixed(2)}</span>
              </div>

              <div className="text-sm text-gray-500 pl-5">
                <span>{item.count} registro{item.count !== 1 ? 's' : ''} de diezmo</span>
              </div>

              <button
                onClick={() => {
                  if(confirm('¿Estás seguro de reiniciar el diezmo acumulado para ' + item.name + '?')) {
                    onResetTithing(item.id);
                  }
                }}
                className="mt-2 ml-5 px-4 py-2 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-200 dark:hover:bg-purple-900/60 transition-colors active:scale-95 touch-manipulation w-fit"
              >
                Reiniciar Diezmo
              </button>
            </div>
          ))}

          {tithingByCompany.length === 0 && (
            <p className="text-gray-500">No hay diezmos registrados.</p>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t dark:border-zinc-700 flex justify-between items-center">
        <span className="text-xl font-bold">Total Diezmo</span>
        <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">S/. {grandTotal.toFixed(2)}</span>
      </div>
    </div>
  );
}
