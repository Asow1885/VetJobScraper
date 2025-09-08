export interface DashboardStats {
  total: number;
  veteran: number;
  postedToKaza: number;
  pending: number;
  activeSources: number;
}

export interface ActivityItem {
  id: string;
  type: 'scraping' | 'posting' | 'error' | 'success';
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    veterans?: number;
    remote?: number;
    success?: number;
    failed?: number;
  };
}

export interface SourceStatus {
  id: string;
  name: string;
  icon: string;
  status: 'active' | 'warning' | 'error' | 'inactive';
  lastActivity: string;
}
