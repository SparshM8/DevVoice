import { TopNav } from "@/components/layout/TopNav";
import { DevVoiceConsole } from "@/components/dashboard/DevVoiceConsole";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { RuntimeStatusBadge } from "@/components/dashboard/RuntimeStatusBadge";

export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <RuntimeStatusBadge />
        <ErrorBoundary>
          <DevVoiceConsole />
        </ErrorBoundary>
      </main>
    </div>
  );
}
