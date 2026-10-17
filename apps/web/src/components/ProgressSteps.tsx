import { Step } from "@/react/session-form/session-form.types"
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Fragment } from "react";

export function ProgressSteps({ 
    currentStep, 
    steps,
} : {
    currentStep : number;
    steps : Step[];
}){
    return (
        <div className="w-full flex justify-between items-center">
            {
                steps.map(step => (
                    <Fragment key={step.id}>
                        <div 
                        className=" flex items-center gap-2"
                        >
                            <Badge
                            variant={step.id-1 <= currentStep ? 'default' : 'outline'}
                            >{step.id}</Badge>
                            <span
                            className={`hidden md:inline whitespace-nowrap
                            ${step.id-1 <= currentStep ? "" : "text-muted-foreground"}
                            `}>{step.name}</span>
                        </div>
                        {
                            step.id !== steps.length &&  (
                            <Separator 
                                className={`mx-4 flex-1 ${step.id <= currentStep ? "bg-primary" : "bg-border"}`}/>)
                        }
                    </Fragment>
                ))
            }
        </div>
    )
}