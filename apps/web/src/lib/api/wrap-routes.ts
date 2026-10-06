import { NextRequest, NextResponse } from "next/server";
import { request_context } from "@/lib/logging/request-contexts";
import { Logger } from "@/lib/logging/logger";
import { AppError } from "@/exceptions/AppError";

// must stay synchronous: it returns the route handler itself, an `async`
// declaration would wrap it in a promise and break the route contract
export function withRequestContextAndErrorHandling<TContext>
    (handler : (
        req : NextRequest, 
        context : TContext,
    ) => Promise<Response>) {
    return async (
            req : NextRequest, 
            context : TContext
        ) => {
            return request_context.run({
                user_id : req.headers.get('X-User-ID')  || "",
                req_id : crypto.randomUUID(),
                method : req.method,
                route : req.nextUrl.pathname,
            }, async () => {
                const logger= new Logger();
                
                logger.debug("attaching request context", request_context.getStore());
                try {
                    return await handler(req, context);
                } catch (error) {
                    if(error instanceof AppError){
                        logger.log(
                            error.message,
                            error.logLevel,
                            {
                                cause: error.cause,
                                code: error.code,
                            },
                        );

                        return NextResponse.json(
                            error.toJSON(),
                            {
                                status: error.status_code,
                            }
                        );
                    }

                    logger.error(
                        "Unexpected Error",
                        {error},
                    );
                    return NextResponse.json(
                        {
                            success: false,
                            code: "INTERNAL_SERVER_ERROR",
                            message: "Internal Server Error",
                            status_code: 500,
                        },
                        {
                            status: 500,
                        }
                    );
                }
            })
        }
}