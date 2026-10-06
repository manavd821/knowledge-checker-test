import { Progress } from "@/components/ui/progress";
import { useLiveSessionInfo } from "@/react/live-session/hooks/use-live-session-info";
import { useSessionTimer } from "@/react/live-session/hooks/use-session-timer";

const format_clock = (total_seconds: number) => {
    const safe = Math.max(0, Math.floor(total_seconds));
    const minutes = Math.floor(safe / 60);
    const seconds = safe % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

export function ProgressBar(){

    const  { duration_minutes } = useLiveSessionInfo();
    const { elapsed_seconds } = useSessionTimer();
    const total_seconds = duration_minutes * 60;
    return (
        <div
        className="border px-2 py-3 rounded-xl flex flex-col gap-1"
        >
            <div
            className="flex justify-between items-center"
            >
                <p
                className="text-xs text-muted-foreground"
                >Progress</p>
                <p
                className="text-sm tabular-nums"
                >{format_clock(elapsed_seconds)} / {duration_minutes}:00</p>
            </div>
            <Progress 
            value={
                total_seconds > 0
                    ? Math.min(100, (elapsed_seconds / total_seconds) * 100)
                    : 0
            }
            className="w-full"
            />
        </div>
    )
}