/**
 * These stay off. Rewind has no adapter for them, so an environment variable
 * cannot turn one on.
 */
export const flags = {
  emailIngestion: false,
  bankLinking: false,
  ocr: false,
  merchantSubmission: false,
  payments: false,
  chargebacks: false,
  hostedDatabase: false,
} as const;

export function externalIntegrationsEnabled() {
  return false;
}
