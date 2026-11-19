type FailureLog = {
  scope: string;
  code: string;
  detail?: string;
};

/** Server log for failures. Do not pass receipt text, letters, or tokens. */
export function logFailure(entry: FailureLog) {
  console.error(
    JSON.stringify({
      source: "rewind",
      scope: entry.scope,
      code: entry.code,
      detail: entry.detail?.slice(0, 180) ?? null,
      at: new Date().toISOString(),
    }),
  );
}
