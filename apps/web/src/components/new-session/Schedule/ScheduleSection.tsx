import { useId } from "react";
import { format } from "date-fns";
import { ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input";
import { 
    Field, 
    FieldLabel, 
} from "@/components/ui/field";
import { 
    Popover, 
    PopoverContent, 
    PopoverTrigger 
} from "@/components/ui/popover";
import { useSessionConfig } from "@/react/session-form/hooks/use-session-config";

export function ScheduleSection(){
    const {
        scheduledAt,
        updateScheduledAt,
    } = useSessionConfig();
    const time_id = useId();
    const calender_id = useId();

    const handleSelect = (date : Date | undefined) => {
        if(!date) return;

        const updated = new Date(date);
        if(scheduledAt){
            updated.setHours(scheduledAt.getHours());
            updated.setMinutes(scheduledAt.getMinutes());
        }

        updateScheduledAt(updated);
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(!scheduledAt) return;

        const [hours, minutes] = e.target.value.split(":");
        const updated = new Date(scheduledAt);

        updated.setHours(Number(hours));
        updated.setMinutes(Number(minutes));

        updateScheduledAt(updated);

    }
    return (
        <div
        className="flex flex-col sm:flex-row gap-2"
        >
            <Field>
                <FieldLabel 
                className="text-muted-foreground"
                htmlFor={calender_id}>Date</FieldLabel>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        variant="outline"
                        id={calender_id}
                        className="w-32 justify-between font-normal"
                        >{
                            scheduledAt ? format(scheduledAt, "PPP") : "Pick a date"
                        }
                        <ChevronDownIcon/>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                        <Calendar
                        mode="single"
                        selected={scheduledAt}
                        onSelect={handleSelect}
                        />
                    </PopoverContent>
                </Popover>
            </Field>
            <Field>
                <FieldLabel 
                className="text-muted-foreground"
                htmlFor="time-picker-optional">Time</FieldLabel>
                <Input
                type="time"
                value={scheduledAt ? format(scheduledAt, "HH:mm") : ""}
                onChange={handleChange}
                id={time_id}
                />
            </Field>
        </div>
    )
}