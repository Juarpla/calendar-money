"use client";

import { useEffect, useState } from "react";
import CompanyManager from "./components/CompanyManager";
import Calendar from "./components/Calendar";
import EarningsSummary from "./components/EarningsSummary";
import { Company, WorkLog } from "./types";
import {
    createCompanyAction,
    updateCompanyAction,
    deleteCompanyAction,
    createOrUpdateWorkLogAction,
    deleteWorkLogAction,
    resetPaymentsAction
} from "./actions";

interface ClientPageProps {
    initialCompanies: Company[];
    initialWorkLogs: WorkLog[];
}

export default function ClientHome({ initialCompanies, initialWorkLogs }: ClientPageProps) {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>(initialWorkLogs);

  useEffect(() => {
      setCompanies(initialCompanies);
  }, [initialCompanies]);

  useEffect(() => {
      setWorkLogs(initialWorkLogs);
  }, [initialWorkLogs]);

  // Migration logic
  useEffect(() => {
      const migrateData = async () => {
          if (initialCompanies.length === 0 && initialWorkLogs.length === 0) {
              const savedCompanies = localStorage.getItem("cm_companies");
              const savedLogs = localStorage.getItem("cm_logs");

              if (savedCompanies) {
                  const localCompanies: Company[] = JSON.parse(savedCompanies);
                  const companiesWithColor = localCompanies.map(c => ({
                      ...c,
                      color: c.color || '#3b82f6' // Ensure color exists if migrating old data
                  }));
                  // Upload companies first
                  await Promise.all(companiesWithColor.map(c => createCompanyAction(c)));

                  if (savedLogs) {
                      const localLogs: WorkLog[] = JSON.parse(savedLogs);
                      await Promise.all(localLogs.map(l => createOrUpdateWorkLogAction(l)));
                  }
                  console.log("Migration from LocalStorage completed.");
              }
          }
      };
      migrateData();
  }, [initialCompanies.length, initialWorkLogs.length]);

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
    await createOrUpdateWorkLogAction(log);
  };

  const removeLog = async (logId: string) => {
    setWorkLogs(prev => prev.filter((l) => l.id !== logId));
    await deleteWorkLogAction(logId);
  };

  const markAsPaid = async (companyId: string) => {
    setWorkLogs(prev => prev.map(log =>
      log.companyId === companyId ? { ...log, isPaid: true } : log
    ));
    await resetPaymentsAction(companyId);
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-black text-zinc-900 dark:text-zinc-100 p-4 pb-20 sm:p-8 font-sans">
      <main className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
           <div>
            <h1 className="text-3xl font-bold tracking-tight">Mi Calendario de Pagos</h1>
            <p className="text-zinc-500 dark:text-zinc-400">Rastrea tu trabajo por horas y ganancias.</p>
           </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
             <Calendar
               companies={companies}
               workLogs={workLogs}
               onUpdateLog={updateLog}
               onRemoveLog={removeLog}
             />
          </div>

          <div className="lg:col-span-4 space-y-6">
             <EarningsSummary
                companies={companies}
                workLogs={workLogs}
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
      </main>
    </div>
  );
}
