import { ConfigurationError } from "@/exceptions/ConfigurationError";
import { MessageDeserializationError } from "@/exceptions/MessageDeserializationError";
import { IMessageHandler } from "@/messaging/message-handler.interface";
import { DataChannelMessage } from "@/messaging/types";
import { MessageType } from "@/store/types";

export class MessageRouter{
    private handlers = new Map<MessageType, IMessageHandler>();

    register(handler: IMessageHandler) : void{
        if(this.handlers.has(handler.type)){
            throw new ConfigurationError(`Handler already registered for type: ${handler.type}.`);
        }
        this.handlers.set(handler.type, handler)
    }
    handle(message : DataChannelMessage){
        // let message: DataChannelMessage;
        // try{
        //     message = JSON.parse(new TextDecoder().decode(raw));
        // }
        // catch(error){
        //     throw new MessageDeserializationError(
        //         "Failed to deserialize incoming message.",
        //         raw,
        //         error,
        //     );
        // }
        const handler = this.handlers.get(message.type);
        if(!handler){
            // the AI can publish message types this client does not implement
            // yet (eg. "hint"); ignoring them keeps the data channel alive
            console.warn(
                `No handler registered for message type: ${message.type}. Ignoring.`
            );
            return;
        }
        handler.handle(message.payload);
    }   
}