"use client";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";

/**
 * Dashboard header: brand + Clerk user identity + the existing Clerk
 * sign-out mechanism (SignOutButton clones the child button; no manual
 * token/cookie handling, Clerk owns the sign-out session).
 */
export function DashboardHeader(){
    const { user } = useUser();

    const name = user?.fullName ?? "";
    const email = user?.primaryEmailAddress?.emailAddress ?? "";
    const label = name || email;

    return (
        <header
        data-testid="dashboard-header"
        className="flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b bg-background px-4 py-2"
        >
            <p className="text-sm font-semibold tracking-tight">
                Knowledge Checker
            </p>

            <div className="flex items-center gap-3">
                {user && label && (
                    <div className="flex min-w-0 items-center gap-2">
                        <Avatar className="size-8">
                            <AvatarImage
                                src={user.imageUrl}
                                alt={label}
                            />
                            <AvatarFallback>
                                {getInitials(label) || "U"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="hidden min-w-0 text-right sm:block">
                            <p className="truncate text-sm font-medium leading-tight">
                                {label}
                            </p>
                            {email && email !== label && (
                                <p className="truncate text-xs leading-tight text-muted-foreground">
                                    {email}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <SignOutButton redirectUrl="/sign-in">
                    <Button variant="outline" size="sm">
                        Sign out
                    </Button>
                </SignOutButton>
            </div>
        </header>
    );
}