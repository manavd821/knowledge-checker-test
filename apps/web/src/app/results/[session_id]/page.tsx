import { SessionDetailsPage } from "@/components/dashboard/session-details";
import { check_session_id_is_uuid } from "@/lib/utils";
import { notFound } from "next/navigation";

/**
 * Results / details of a completed session. Deliberately NOT under
 * `/sessions/[session_id]`, which is the live-session route with its own
 * layout (join manager + timer), so this page can't accidentally join a
 * room just to read results.
 */
export default async function ResultsPage({
    params,
}: {
    params: Promise<{ session_id: string }>,
}){
    const { session_id } = await params;

    if (!check_session_id_is_uuid(session_id)) {
        notFound();
    }

    return <SessionDetailsPage session_id={session_id} />;
}