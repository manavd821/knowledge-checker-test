import { ObservableStore } from "@/store/observable-store";
import { LocalParticipantVM, ParticipantState, ParticipantVM } from "@/store/types";

export class ParticipantStore extends ObservableStore<ParticipantState>{
    constructor(){
        super(
            {
                local: null,
                remote: new Map<string, ParticipantVM>(),
            },
            "participant"
        )
    }
    
    add_local_participant(participant: LocalParticipantVM){
        this.set(prev => ({
            ...prev,
            local: participant
        }));
    }
    update_local_participant(update: Partial<LocalParticipantVM>){
        this.set(prev => {
            if(!prev.local){
                return prev;
            }
            return {
                ...prev,
                local: {
                    ...prev.local,
                    ...update,
                },
            };
        });
    }
    add_remote_participant(participant: ParticipantVM){
        this.set(prev => {
            const remote = new Map(prev.remote);
            const existing = remote.get(participant.id);
            remote.set(participant.id, {
                ...participant,
                videoTrack: existing?.videoTrack ?? participant.videoTrack,
                audioTrack: existing?.audioTrack ?? participant.audioTrack,
            });
            return { ...prev, remote };
        });
    }
    remove_remote_participant(sid: string){
        this.set(prev => {
            const remote = new Map(prev.remote);
            remote.delete(sid);
            return {
                ...prev,
                remote,
            }
        })
    }
    update_remote_participant(
        sid: string,
        update: Partial<ParticipantVM>,
    ){
        this.set(prev => {
            const remote = new Map(prev.remote);
            const participant = remote.get(sid);
            if(!participant){
                return prev;
            }
            remote.set(sid, {
                ...participant,
                ...update
            });
            return {
                ...prev,
                remote
            }
        });
    }
    set_video_track(
        participant_id: string,
        track: MediaStreamTrack,
    ): void {
        this.set(prev => {
            if (
                prev.local?.id === participant_id
            ) {
                return {
                    ...prev,
                    local: {
                        ...prev.local,
                        videoTrack: track,
                    },
                };
            }

            const participant = prev.remote.get(participant_id);

            if (!participant) {
                return prev;
            }

            const remote = new Map(prev.remote);

            remote.set(participant_id, {
                ...participant,
                videoTrack: track,
            });

            return {
                ...prev,
                remote,
            };
        });
    }
    set_audio_track(
        participant_id: string,
        track: MediaStreamTrack,
    ): void {
        
        this.set(prev => {
            if (prev.local?.id === participant_id) {
                return {
                    ...prev,
                    local: {
                        ...prev.local,
                        audioTrack: track,
                    },
                };
            }

            const participant = prev.remote.get(participant_id);

            if (!participant) {
                return prev;
            }

            const remote = new Map(prev.remote);

            remote.set(participant_id, {
                ...participant,
                audioTrack: track,
            });

            return {
                ...prev,
                remote,
            };
        });
    }
    remove_video_track(
        participant_id: string,
    ): void {
        this.set(prev => {
            if (
                prev.local?.id === participant_id
            ) {
                return {
                    ...prev,
                    local: {
                        ...prev.local,
                        videoTrack: undefined,
                    },
                };
            }

            const participant = prev.remote.get(participant_id);

            if (!participant) {
                return prev;
            }

            const remote = new Map(prev.remote);

            remote.set(participant_id, {
                ...participant,
                videoTrack: undefined,
            });

            return {
                ...prev,
                remote,
            };
        });
    }
    remove_audio_track(
        participant_id: string,
    ): void {
        this.set(prev => {
            if (prev.local?.id === participant_id) {
                return {
                    ...prev,
                    local: {
                        ...prev.local,
                        audioTrack: undefined,
                    },
                };
            }

            const participant = prev.remote.get(participant_id);

            if (!participant) {
                return prev;
            }

            const remote = new Map(prev.remote);

            remote.set(participant_id, {
                ...participant,
                audioTrack: undefined,
            });

            return {
                ...prev,
                remote,
            };
        });
    }
}