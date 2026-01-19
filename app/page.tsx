"use client";

import { useEffect, useState } from "react";
import CompanyManager from "./components/CompanyManager";
import Calendar from "./components/Calendar";
import EarningsSummary from "./components/EarningsSummary";
import { Company, WorkLog } from "./types";

export default function Home() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load data from local storage
  useEffect(() => {
    const savedCompanies = localStorage.getItem("cm_companies");
    const savedLogs = localStorage.getItem("cm_logs");
    if (savedCompanies) setCompanies(JSON.parse(savedCompanies));
    if (savedLogs) setWorkLogs(JSON.parse(savedLogs));
    setLoaded(true);
  }, []);

  // Save data on changes
  useEffect(() => {
    if (loaded) {
      localStorage.setItem("cm_companies", JSON.stringify(companies));
    }
  }, [companies, loaded]);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem("cm_logs", JSON.stringify(workLogs));
    }
  }, [workLogs, loaded]);

  const addCompany = (company: Company) => {
    setCompanies([...companies, company]);
  };

  const deleteCompany = (id: string) => {
    setCompanies(companies.filter((c) => c.id !== id));
    // Optional: remove logs for this company or keep them?
    // Usually safer to keep or ask, but for simplicity let's keep them
    // but they might show up as 'Unknown' if we aren't careful.
    // Actually, let's filter logs too to avoid orphan data.
    setWorkLogs(workLogs.filter((l) => l.companyId !== id));
  };

  const updateLog = (log: WorkLog) => {
    // Check if log already exists for this slot (update) or new
    // The calendar component sends a log with an ID.
    // If ID exists, replace. If not, add.
    // Actually logic in calendar handles creation of ID if needed.
    // But we need to make sure we don't have duplicates for same slot if ID changed somehow.
    // Ideally we assume the ID passed is correct.

    // However, if we are overwriting a slot, we should remove any existing log for that slot first?
    // Calendar logic:
    // find existing log for date/hour.
    // if exists, update it.
    // else create new.

    // Simpler: filter out any log with same date/hour, then add/replace.
    const others = workLogs.filter(l => !(l.date === log.date && l.hour === log.hour));
    setWorkLogs([...others, log]);
  };

  const removeLog = (logId: string) => {
    setWorkLogs(workLogs.filter((l) => l.id !== logId));
  };

  if (!loaded) return null; // Prevent hydration mismatch

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-black text-zinc-900 dark:text-zinc-100 p-4 pb-20 sm:p-8 font-sans">
      <main className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
           <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendar Money</h1>
            <p className="text-zinc-500 dark:text-zinc-400">Track your hourly work and earnings.</p>
           </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Calendar Area */}
          <div className="lg:col-span-8 space-y-6">
             <Calendar
               companies={companies}
               workLogs={workLogs}
               onUpdateLog={updateLog}
               onRemoveLog={removeLog}
             />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
             <EarningsSummary
                companies={companies}
                workLogs={workLogs}
             />
             <CompanyManager
                companies={companies}
                onAddCompany={addCompany}
                onDeleteCompany={deleteCompany}
             />
          </div>
        </div>
      </main>
    </div>
  );
}
