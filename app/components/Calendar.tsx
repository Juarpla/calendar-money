import { useState, useMemo } from 'react';
import { Company, WorkLog } from '../types';
import WorkEntryModal from './WorkEntryModal';

interface CalendarProps {
  companies: Company[];
  workLogs: WorkLog[];
  onUpdateLog: (log: WorkLog) => void;
  onRemoveLog: (logId: string) => void;
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7 to 22

export default function Calendar({ companies, workLogs, onUpdateLog, onRemoveLog }: CalendarProps) {
  // State for current view
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calculate start of week (Monday)
  const startOfWeek = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
  }, [currentDate]);

  // Generate days for the week view
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  }, [startOfWeek]);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; hour: number } | null>(null);

  // Helper to format YYYY-MM-DD using local time
  const formatDateKey = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  const handleSlotClick = (date: Date, hour: number) => {
    setSelectedSlot({ date: formatDateKey(date), hour });
    setModalOpen(true);
  };

  const currentLog = useMemo(() => {
    if (!selectedSlot) return undefined;
    return workLogs.find(
      (l) => l.date === selectedSlot.date && l.hour === selectedSlot.hour
    );
  }, [selectedSlot, workLogs]);

  const handleSave = (companyId: string) => {
    if (!selectedSlot) return;
    const newLog: WorkLog = {
      id: currentLog?.id || crypto.randomUUID(),
      date: selectedSlot.date,
      hour: selectedSlot.hour,
      companyId,
    };
    onUpdateLog(newLog);
    setModalOpen(false);
  };

  const handleClear = () => {
    if (currentLog) {
      onRemoveLog(currentLog.id);
    }
    setModalOpen(false);
  };

  const getCompanyForSlot = (date: Date, hour: number) => {
    const key = formatDateKey(date);
    const log = workLogs.find((l) => l.date === key && l.hour === hour);
    if (!log) return null;
    return companies.find((c) => c.id === log.companyId);
  };

  // Mobile View: Only show current selected day
  const [mobileDayIndex, setMobileDayIndex] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
  const mobileDisplayDate = weekDays[mobileDayIndex] || new Date();

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-lg shadow overflow-hidden">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-b dark:border-zinc-700 gap-4">
        <h2 className="text-xl font-bold capitalize">
          {startOfWeek.toLocaleDateString("es-ES", { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex gap-2">
            <button
                onClick={() => {
                   const newDate = new Date(currentDate);
                   newDate.setDate(newDate.getDate() - 7);
                   setCurrentDate(newDate);
                }}
                className="px-3 py-1 bg-gray-100 dark:bg-zinc-800 rounded hover:bg-gray-200"
            >
                Semana Ant.
            </button>
            <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200"
            >
                Hoy
            </button>
            <button
                onClick={() => {
                   const newDate = new Date(currentDate);
                   newDate.setDate(newDate.getDate() + 7);
                   setCurrentDate(newDate);
                }}
                className="px-3 py-1 bg-gray-100 dark:bg-zinc-800 rounded hover:bg-gray-200"
            >
                Semana Sig.
            </button>
        </div>
      </div>

      {/* Mobile Day Selector Tabs */}
      <div className="flex sm:hidden overflow-x-auto border-b dark:border-zinc-700">
        {weekDays.map((day, idx) => (
            <button
                key={idx}
                onClick={() => setMobileDayIndex(idx)}
                className={`flex-1 py-3 text-center text-sm font-medium whitespace-nowrap px-2 ${
                    idx === mobileDayIndex 
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}
            >
                {day.toLocaleDateString("es-ES", { weekday: 'short', day: 'numeric' })}
            </button>
        ))}
      </div>

      <div className="flex flex-col">
        {/* Header Row (Desktop) */}
        <div className="hidden sm:grid sm:grid-cols-8 border-b dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
          <div className="p-2 text-center text-sm text-gray-500 font-medium border-r dark:border-zinc-700">Hora</div>
          {weekDays.map((date, i) => (
            <div key={i} className="p-2 text-center border-r dark:border-zinc-700 last:border-r-0">
               <div className="font-bold text-gray-900 dark:text-gray-100 capitalize">
                 {date.toLocaleDateString("es-ES", { weekday: 'short' })}
               </div>
               <div className="text-sm text-gray-500">
                 {date.getDate()}
               </div>
            </div>
          ))}
        </div>

        {/* Grid Body */}
        <div className="relative">
             {HOURS.map((hour) => (
                 <div key={hour} className={`group grid grid-cols-[60px_1fr] sm:grid-cols-8 min-h-[50px] border-b dark:border-zinc-700 last:border-b-0`}>
                     {/* Time Column */}
                     <div className="p-2 text-xs text-gray-500 text-right pr-3 -mt-2.5 sm:border-r dark:border-zinc-700">
                         {hour}:00
                     </div>

                     {/* Mobile Day Slot */}
                     <div className="sm:hidden relative border-l dark:border-zinc-700">
                        <Slot
                             date={mobileDisplayDate}
                             hour={hour}
                             company={getCompanyForSlot(mobileDisplayDate, hour)}
                             onClick={() => handleSlotClick(mobileDisplayDate, hour)}
                        />
                     </div>

                     {/* Desktop Week Slots */}
                     {weekDays.map((date, i) => (
                         <div key={i} className="hidden sm:block relative border-r dark:border-zinc-700 last:border-r-0">
                             <Slot
                                 date={date}
                                 hour={hour}
                                 company={getCompanyForSlot(date, hour)}
                                 onClick={() => handleSlotClick(date, hour)}
                             />
                         </div>
                     ))}
                 </div>
             ))}
        </div>
      </div>

      <WorkEntryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onClear={handleClear}
        companies={companies}
        selectedDate={selectedSlot?.date || ''}
        selectedHour={selectedSlot?.hour || 0}
        currentCompanyId={currentLog?.companyId}
      />
    </div>
  );
}

function Slot({ date, hour, company, onClick }: { date: Date, hour: number, company: Company | null | undefined, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            style={company ? {
                backgroundColor: `${company.color || '#3b82f6'}26`, // ~15% opacity
                borderLeftColor: company.color || '#3b82f6'
            } : undefined}
            className={`w-full h-full min-h-[40px] absolute inset-0 text-left p-1 text-xs transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800 ${
                company 
                ? 'border-l-4' 
                : ''
            }`}
        >
            {company && (
                <div
                    className="truncate font-medium"
                    style={{ color: company.color || '#1e3a8a'}}
                >
                    {company.name}
                </div>
            )}
        </button>
    )
}
