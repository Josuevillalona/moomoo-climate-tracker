export interface User {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  email: string;
}

export interface DashboardStats {
  totalDeals: number;
  totalFunding: number;
  activeInvestors: number;
  growthRate: number;
}

export interface Deal {
  id: string;
  company: string;
  sector: string;
  stage: 'Seed' | 'Series A' | 'Series B' | 'Series C+';
  amount: number;
  date: string;
  investors: string[];
  description?: string;
}

export interface TimeTracker {
  hours: number;
  minutes: number;
  status: 'running' | 'paused' | 'stopped';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  assignee?: User;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface ProgressData {
  label: string;
  percentage: number;
  color: string;
}
