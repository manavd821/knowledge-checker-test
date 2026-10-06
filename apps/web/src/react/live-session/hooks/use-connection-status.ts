"use client";

import { useSyncExternalStore } from "react";
import { ConnectionStoreState } from "@/store/types";
import { connection_store } from "@/store/factory";

/**
 * Live transport state of the room, derived from typed provider events.
 * The UI never reads the LiveKit room to find this out.
 */
export function useConnectionStatus() : ConnectionStoreState{
    return useSyncExternalStore(
        connection_store.subscribe,
        connection_store.getSnapShot,
        connection_store.getSnapShot,
    );
}