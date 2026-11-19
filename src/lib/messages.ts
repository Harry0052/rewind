const ERRORS: Record<string, string> = {
  origin: "Open Rewind in this browser and try again.",
  rate: "Too many saves in a short time. Wait a little, then try again.",
  name: "Use 2 to 40 letters, or leave the name blank. Do not use an email address.",
  timezone: "Choose a timezone Rewind recognizes, such as America/New_York.",
  generic: "Rewind could not save that. Nothing new was stored.",
  forbidden: "That session is not on this server.",
  merchant: "Enter the store name, using letters, numbers, spaces, and & . ' -.",
  date: "Enter a purchase date that is not in the future.",
  items: "Add at least one item with a description and a price like 24.50.",
  currency: "Choose USD, EUR, GBP, or CAD.",
  note: "Keep the receipt note under 2,000 characters.",
  sample: "Sample purchases are not yours. Add your own receipt instead.",
  not_found: "That record is not in this browser.",
  closed: "Rewind will not prepare a request unless the stored policy still shows an open window.",
  subject: "Enter a subject between 3 and 200 characters.",
  body: "Enter a letter between 10 and 8,000 characters.",
  confirm: "Check the box so Rewind only records what you confirm.",
  amount: "Enter the amount you actually received, up to the purchase total.",
  locked: "This outcome is already recorded.",
  status: "Rewind does not recognize that update.",
  file: "Attach a PDF, PNG, JPEG, or WEBP under 5 MB. Nothing was stored.",
};

const NOTICES: Record<string, string> = {
  profile: "Settings saved on this server.",
  created: "Purchase saved.",
  saved: "Changes saved.",
  deleted: "Purchase deleted.",
  draft: "Draft saved. Rewind has not sent this letter.",
  sent: "You recorded that you sent this. Rewind did not send it.",
  won: "You recorded the amount you received. That amount is now confirmed savings.",
  denied: "You recorded a denial. Nothing was added to confirmed savings.",
  withdrawn: "You withdrew this case. It is not marked as sent.",
  uploaded: "File stored for this browser. Rewind did not scan it or read it.",
  file_deleted: "File deleted.",
  deleted_account: "Your Rewind data was deleted from this server.",
};

export function errorMessage(code: string | undefined) {
  if (!code) return null;
  return ERRORS[code] ?? "Rewind could not complete that. Nothing was marked successful.";
}

export function noticeMessage(code: string | undefined) {
  if (!code) return null;
  return NOTICES[code] ?? null;
}
