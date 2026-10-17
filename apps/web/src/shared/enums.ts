export const AVATAR_STYLES = [
    { bg: "bg-blue-600",     text: "text-blue-100" },
    { bg: "bg-emerald-600",  text: "text-emerald-100" },
    { bg: "bg-violet-600",   text: "text-violet-100" },
    { bg: "bg-fuchsia-600",  text: "text-fuchsia-100" },
    { bg: "bg-rose-600",     text: "text-rose-100" },
    { bg: "bg-orange-600",   text: "text-orange-100" },
    { bg: "bg-cyan-600",     text: "text-cyan-100" },
    { bg: "bg-indigo-600",   text: "text-indigo-100" },
    { bg: "bg-teal-600",     text: "text-teal-100" },
    { bg: "bg-amber-600",    text: "text-amber-100" },
] as const;

export const MAX_PARTICIPANTS = 4
export const MAX_DOCUMENTS = 2;
export const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024; // 5MB
export const ARRAY_FIELD = new Set(["participants", "session_documents"]);

// Upper bound on the extracted document text sent to the AI service for
// session-brief generation. A single upload may be up to 5MB, which can exceed
// the brief model's context window, so the combined text is bounded here. The
// payload marks the cut-off explicitly, so the model never treats a truncated
// document as complete.
export const MAX_BRIEF_DOCUMENT_CHARS = 16000;
