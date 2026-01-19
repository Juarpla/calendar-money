import { Company } from '../types';

interface WorkEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (companyId: string) => void;
  onClear: () => void; // To remove work from a slot
  companies: Company[];
  selectedDate: string;
  selectedHour: number;
  currentCompanyId?: string;
}

export default function WorkEntryModal({
  isOpen,
  onClose,
  onSave,
  onClear,
  companies,
  selectedDate,
  selectedHour,
  currentCompanyId,
}: WorkEntryModalProps) {
  if (!isOpen) return null;

  // Format date readable
  const displayDate = new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  const displayTime = `${selectedHour}:00 - ${selectedHour + 1}:00`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-sm p-6">
        <h3 className="text-xl font-bold mb-1">Log Work</h3>
        <p className="text-sm text-gray-500 mb-4">{displayDate} • {displayTime}</p>

        <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
          {companies.map((company) => (
            <button
              key={company.id}
              onClick={() => onSave(company.id)}
              className={`w-full text-left px-4 py-3 rounded border transition-colors ${
                currentCompanyId === company.id
                  ? 'bg-blue-100 border-blue-500 dark:bg-blue-900/30 dark:border-blue-500'
                  : 'border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800'
              }`}
            >
              <div className="font-medium">{company.name}</div>
              <div className="text-xs text-gray-500">${company.hourlyRate}/hr</div>
            </button>
          ))}
          {companies.length === 0 && (
            <p className="text-center text-gray-500 py-4">No companies added yet. Add one above.</p>
          )}
        </div>

        <div className="flex justify-between gap-3">
          {currentCompanyId && (
             <button
             onClick={onClear}
             className="px-4 py-2 text-red-600 border border-red-200 rounded hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20"
           >
             Clear Slot
           </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
