import { Company, WorkLog } from '../types';

interface EarningsSummaryProps {
  companies: Company[];
  workLogs: WorkLog[];
}

export default function EarningsSummary({ companies, workLogs }: EarningsSummaryProps) {
  const earningsByCompany = companies.map(company => {
    const logs = workLogs.filter(log => log.companyId === company.id);
    const totalHours = logs.length; // Assuming each log is 1 hour
    const totalEarned = totalHours * company.hourlyRate;
    return {
      ...company,
      totalHours,
      totalEarned
    };
  });

  const grandTotal = earningsByCompany.reduce((sum, c) => sum + c.totalEarned, 0);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-4">
      <h2 className="text-lg font-bold mb-4">💰 Earnings Summary</h2>

      <div className="space-y-4">
        {earningsByCompany.map(item => (
          <div key={item.id} className="flex flex-col border-b last:border-0 pb-2 dark:border-zinc-700">
            <div className="flex justify-between items-center">
              <span className="font-semibold">{item.name}</span>
              <span className="text-green-600 dark:text-green-400 font-bold">${item.totalEarned.toFixed(2)}</span>
            </div>
            <div className="text-sm text-gray-500 flex justify-between">
               <span>{item.totalHours} hours @ ${item.hourlyRate}/hr</span>
               {item.locationLink && (
                 <a href={item.locationLink} target="_blank" className="text-blue-500 hover:underline">Location</a>
               )}
            </div>
          </div>
        ))}

        {earningsByCompany.length === 0 && (
            <p className="text-gray-500">No work logged yet.</p>
        )}
      </div>

      <div className="mt-4 pt-4 border-t dark:border-zinc-700 flex justify-between items-center">
         <span className="text-xl font-bold">Total Pending</span>
         <span className="text-2xl font-bold text-green-600 dark:text-green-400">${grandTotal.toFixed(2)}</span>
      </div>
    </div>
  );
}
