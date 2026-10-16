/**
 * Test-only environment bootstrap.
 *
 * The application logger (`@/lib/logging/logger`) reads `LOG_LEVEL` at import
 * time. Next loads `.env` for the app, but the Node test runner (tsx) does
 * not, so importing any module that pulls in the logger outside Next would
 * otherwise crash. Import this module first from a test file to give the
 * logger a sane default without overriding a real `LOG_LEVEL`.
 */
process.env.LOG_LEVEL ??= "info";
