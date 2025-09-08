import { Header } from "@/components/layout/header";
import { JobsTable } from "@/components/jobs/jobs-table";
import { StatsCards } from "@/components/dashboard/stats-cards";

export default function Jobs() {
  return (
    <div className="flex-1 overflow-auto">
      <Header 
        title="Jobs Management"
        description="View, filter, and manage all scraped job listings"
      />
      
      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <StatsCards />

        {/* Jobs Table */}
        <JobsTable />
      </div>
    </div>
  );
}
