import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {

  return (
    <div className="flex min-h-dvh flex-col">
      <header
        data-testid="home-header"
        className="flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b bg-background px-4 py-2"
      >
        <p className="text-sm font-semibold tracking-tight">
          Knowledge Checker
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/sign-up">Sign up</Link>
          </Button>
        </div>
      </header>

      <main className="">
        <div>
          <Button asChild size="sm">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
