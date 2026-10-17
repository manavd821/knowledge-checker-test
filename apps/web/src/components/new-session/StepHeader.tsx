import { Step } from "@/react/session-form/session-form.types"

export function StepHeader({ 
    currentStep, 
    steps,
} : {
    currentStep : number;
    steps : Step[];
}){
    return (
        <div>
            <p className="text-lg">{steps[currentStep].title}</p>
            <p className="text-muted-foreground">{steps[currentStep].description}</p>
        </div>
    )
}