"use client";

import { useEffect, useState } from "react";
import CompanyManager from "./components/CompanyManager";
import dynamic from "next/dynamic";
import EarningsSummary from "./components/EarningsSummary";
import TransportSummary from "./components/TransportSummary";
import TransportCostModal from "./components/TransportCostModal";
import { Company, WorkLog, TransportLog } from "./types";
import {
    createCompanyAction,
    updateCompanyAction,
    deleteCompanyAction,
    createOrUpdateWorkLogAction,
    deleteWorkLogAction,
    resetPaymentsAction,
    createOrUpdateTransportLogAction,
    resetTransportPaymentsAction
} from "./actions";

interface ClientPageProps {
    initialCompanies: Company[];
    initialWorkLogs: WorkLog[];
    initialTransportLogs: TransportLog[];
}

const CalendarNoSSR = dynamic(() => import("./components/Calendar"), { ssr: false });

export default function ClientHome({ initialCompanies, initialWorkLogs, initialTransportLogs }: ClientPageProps) {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>(initialWorkLogs);
  const [transportLogs, setTransportLogs] = useState<TransportLog[]>(initialTransportLogs);

  // Transport modal state
  type TransportModalState = {
    companyId: string;
    date: string;
    hour: number;
    workLogId: string;
  };
  const [transportModalOpen, setTransportModalOpen] = useState(false);
  const [transportModalData, setTransportModalData] = useState<TransportModalState | null>(null);

  useEffect(() => {
      setCompanies(initialCompanies);
  }, [initialCompanies]);

  useEffect(() => {
      setWorkLogs(initialWorkLogs);
  }, [initialWorkLogs]);

  useEffect(() => {
      setTransportLogs(initialTransportLogs);
  }, [initialTransportLogs]);

  const addCompany = async (company: Company) => {
    setCompanies(prev => [...prev, company]);
    await createCompanyAction(company);
  };

  const updateCompany = async (updatedCompany: Company) => {
      setCompanies(prev => prev.map(c => c.id === updatedCompany.id ? updatedCompany : c));
      await updateCompanyAction(updatedCompany);
  };

  const deleteCompany = async (id: string) => {
    setCompanies(prev => prev.filter((c) => c.id !== id));
    setWorkLogs(prev => prev.filter((l) => l.companyId !== id));
    await deleteCompanyAction(id);
  };

  const updateLog = async (log: WorkLog) => {
    const others = workLogs.filter(l => !(l.date === log.date && l.hour === log.hour));
    setWorkLogs([...others, log]);

    // Create a clean serializable object for server action
    const cleanLog: WorkLog = {
      id: log.id,
      date: log.date,
      hour: log.hour,
      companyId: log.companyId,
      isPaid: log.isPaid,
      hourlyRateSnapshot: log.hourlyRateSnapshot,
    };

    await createOrUpdateWorkLogAction(cleanLog);
  };

  const removeLog = async (logId: string) => {
    setWorkLogs(prev => prev.filter((l) => l.id !== logId));
    await deleteWorkLogAction(logId);
  };

  const markAsPaid = async (companyId: string) => {
    // Work logs
    setWorkLogs(prev => prev.map(log =>
      log.companyId === companyId ? { ...log, isPaid: true } : log
    ));

    // Transport logs: mark as paid so they stop appearing in summaries
    setTransportLogs(prev => prev.map(t =>
      t.companyId === companyId ? { ...t, isPaid: true } : t
    ));

    await Promise.all([
      resetPaymentsAction(companyId),
      resetTransportPaymentsAction(companyId),
    ]);
  };

  const handleOpenTransportModal = (companyId: string, date: string, hour: number, workLogId: string) => {
    setTransportModalData({ companyId, date, hour, workLogId });
    setTransportModalOpen(true);
  };

  const handleSaveTransportCost = async (cost: number, description?: string) => {
    if (!transportModalData) return;

    const newTransportLog: TransportLog = {
      id: crypto.randomUUID(),
      workLogId: transportModalData.workLogId,
      date: transportModalData.date,
      companyId: transportModalData.companyId,
      tripCost: cost,
      description
    };

    // Check if there's already a transport log for this workLogId
    const existingTransportLog = transportLogs.find(t => t.workLogId === transportModalData.workLogId);

    if (existingTransportLog) {
      // Update existing transport log in state
      setTransportLogs(prev => prev.map(t =>
        t.workLogId === transportModalData.workLogId
          ? { ...existingTransportLog, tripCost: cost, description, companyId: transportModalData.companyId, date: transportModalData.date }
          : t
      ));
    } else {
      // Add new transport log to state
      setTransportLogs(prev => [...prev, newTransportLog]);
    }

    // Create a clean serializable object for server action
    const cleanTransportLog: TransportLog = {
      id: newTransportLog.id,
      workLogId: newTransportLog.workLogId,
      date: newTransportLog.date,
      companyId: newTransportLog.companyId,
      tripCost: newTransportLog.tripCost,
      description: newTransportLog.description,
    };

    // Save to database (will update if exists, create if not)
    await createOrUpdateTransportLogAction(cleanTransportLog);

    setTransportModalOpen(false);
    setTransportModalData(null);
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-black text-zinc-900 dark:text-zinc-100 p-4 pb-20 sm:p-8 font-sans" suppressHydrationWarning>
      <main className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
           <div>
            <h1 className="text-3xl font-bold tracking-tight">Mi Calendario de Pagos</h1>
            <p className="text-zinc-500 dark:text-zinc-400">Rastrea tu trabajo por horas y ganancias.</p>
           </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
             <CalendarNoSSR
               companies={companies}
               workLogs={workLogs}
               onUpdateLog={updateLog}
               onRemoveLog={removeLog}
               onOpenTransportModal={handleOpenTransportModal}
             />
          </div>

          <div className="lg:col-span-4 space-y-6">
             <EarningsSummary
                companies={companies}
                workLogs={workLogs}
                transportLogs={transportLogs}
             />
             <TransportSummary
                companies={companies}
                transportLogs={transportLogs}
             />
             <CompanyManager
                companies={companies}
                onAddCompany={addCompany}
                onUpdateCompany={updateCompany}
                onDeleteCompany={deleteCompany}
                onResetPayments={markAsPaid}
             />
          </div>
        </div>

        <TransportCostModal
          isOpen={transportModalOpen}
          onClose={() => {
            setTransportModalOpen(false);
            setTransportModalData(null);
          }}
          onSave={handleSaveTransportCost}
          companyName={transportModalData ? companies.find(c => c.id === transportModalData.companyId)?.name || '' : ''}
          selectedDate={transportModalData?.date || ''}
          existingTransport={transportModalData ? transportLogs.find(t => t.workLogId === transportModalData.workLogId) : undefined}
        />
      </main>
    </div>
  );
}
