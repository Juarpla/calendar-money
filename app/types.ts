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
}
