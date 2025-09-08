import { Header } from "@/components/layout/header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { SourceStatus } from "@/components/dashboard/source-status";
import { JobsTable } from "@/components/jobs/jobs-table";

export default function Dashboard() {
  return (
    <div className="flex-1 overflow-auto">
      <Header 
        title="Dashboard Overview"
        description="Monitor your job scraping operations and KazaConnect integration"
      />
      
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <StatsCards />

        {/* Activity Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ActivityFeed />
          <SourceStatus />
        </div>

        {/* Jobs Management */}
        <JobsTable />
      </div>
    </div>
  );
}
