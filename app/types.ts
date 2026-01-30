export interface Company {
  id: string;
  name: string;
  locationLink: string;
  hourlyRate: number;
  color?: string;
}

export interface WorkLog {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  hour: number; // 7 to 22
  companyId: string;
  isPaid?: boolean;
  hourlyRateSnapshot?: number; // Rate at the time of work
}

export interface TransportLog {
  id: string;
  workLogId?: string; // Reference to the work log (optional for backward compatibility)
  date: string; // ISO date string YYYY-MM-DD
  companyId: string;
  tripCost: number; // Cost of trip with 2 decimals
  description?: string; // Optional description of the trip
  isPaid?: boolean;
}

export interface TithingLog {
  id: string;
  companyId: string;
  amount: number; // 10% of (earnings - transport costs)
  createdAt: string; // ISO timestamp
  isPaid?: boolean;
}
