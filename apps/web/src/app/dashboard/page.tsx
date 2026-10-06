import { Plus } from "lucide-react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SessionHistory } from "@/components/dashboard/session-history";
import { Button } from "@/components/ui/button";

/**
 * Simple dashboard: session history, create-session navigation and sign out.
 * Server state comes from TanStack Query inside SessionHistory; there is no
 * Redux slice for sessions or any other server data.
 */
export default function DashboardPage(){
    return (
        <div className="flex min-h-dvh flex-col">
            <DashboardHeader />

            <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:py-8">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Dashboard
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Welcome back
                        </p>
                    </div>

                    <Button asChild>
                        <Link href="/new-session">
                            <Plus />
                            New Session
                        </Link>
                    </Button>
                </div>

                <div className="mt-6">
                    <SessionHistory />
                </div>
            </main>
        </div>
    );
}