type LogPayload = Record<string, string | number | boolean | null | undefined>;

export function logEvent(event: string, payload: LogPayload = {}): void {
  const entry = {
    ts: new Date().toISOString(),
    event,
    ...payload,
  };
  console.log(JSON.stringify(entry));
}

export function logError(event: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  logEvent(event, { level: "error", message });
}
