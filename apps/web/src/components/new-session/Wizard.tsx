"use client";

import { 
    useForm,
    FormProvider,
    FieldErrors,
    Resolver,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useUser } from '@/react/users/hooks/use-user';
import { useMultiStepForm } from '@/react/session-form/hooks/use-multi-step-form';
import { SessionForm, StepFormData } from '@/react/session-form/session-form.types';
import { NewSessionForm } from './NewSessionForm';
import { SessionProvider } from '@/react/session-form/context/session-detail-provider';
import { SessionConfigProvider } from '@/react/session-form/context/session-config-provider';
import { AdditionalContextProvider } from '@/react/session-form/context/additional-context-provider';
import { SessionFormSchema } from '@/modules';

export function Wizard(){
    const user = useUser();
    const {
        currentStep,
        formData,
        isFirstStep,
        isLastStep,
        setCurrentStep, 
        getCurrentStepSchema,
        goToNextStep,
        goToPreviousStep,
        updateFormData,
        submitForm,
    } = useMultiStepForm(user);

    const form = useForm<SessionForm>({
        // resolver : zodResolver(getCurrentStepSchema()),
        resolver : zodResolver(SessionFormSchema) as Resolver<SessionForm>,
        mode: "onChange",
        defaultValues : formData,
        // shouldUnregister: true,
    });
    const {
        setError,
        reset,
    } = form;

    useEffect(() => {
        reset(formData);
    }, [currentStep, formData, reset]);

    const onNext = async(data : StepFormData) => {
        console.log("onNext trigger")
        // validation check
        console.log(data);
        console.log(formData)
        // const valid = await trigger();
        // if(!valid) return;
        const updatedFormData = {
            ...formData,
            ...data,
        }
        const result = getCurrentStepSchema().safeParse(updatedFormData);
        if(!result.success){
            console.log({issues: result.error.issues})
            result.error.issues.forEach(issue => {
                setError(issue.path.join(".") as any, {
                    message: issue.message,
                })
            });
            return;
        }

        // merge current step data with previous step
        const updatedData = result.data;

        updateFormData(updatedData);
        // console.log(updatedData)

        if(!isLastStep) goToNextStep();
        else{
            const result = SessionFormSchema.safeParse(updatedData);
            if (!result.success) {
                console.error(result.error.issues);
                return;
            }

            submitForm(result.data);
        }
    }
    const onError = (errors: FieldErrors<SessionForm>) => {
        
        // console.log(errors.session_type?.type)
        console.log("Validation failed:", errors);
    };

    return (
        <FormProvider {...form}>
            <SessionProvider>
                <SessionConfigProvider>
                    <AdditionalContextProvider>
                        <NewSessionForm
                            currentStep={currentStep}
                            isFirstStep={isFirstStep}
                            isLastStep={isLastStep}
                            goToPreviousStep={goToPreviousStep}
                            setCurrentStep={setCurrentStep}
                            onNext={onNext}
                            onError={onError}
                        />
                    </AdditionalContextProvider>
                </SessionConfigProvider>
            </SessionProvider>
        </FormProvider>
    )
}