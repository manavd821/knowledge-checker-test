import { useSyncExternalStore } from "react";
import { transcript_store } from "@/store/factory";

export const useTranscript = () => {
    const store = transcript_store;

    return useSyncExternalStore(
        store.subscribe,
        store.getSnapShot,
        store.getSnapShot,
    );
};