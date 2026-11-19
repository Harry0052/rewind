# Rewind pilot plan

This plan has not been run. There is no pilot result in this repository. Do not quote a savings rate from it.

## Who

10 to 30 people who already buy things online and are willing to type a receipt. Not a random public launch. Each person uses their own browser session. Do not share one database file across the group unless you accept that it is one machine.

## What they are asked to do

1. Open the app with `npm run dev` after `npm run db:setup`, or a single machine you host for them with no extra API keys.
2. Add two real purchases from receipts they have, including one they believe is still inside a return window and one they believe is not.
3. Read the explanation. Say whether it matches the policy they can see on the store’s own site. Rewind’s seeded policies are samples, so a real store name will usually say “no policy on file.” That is a successful honest outcome, not a failure of the form.
4. If a sample merchant is used on purpose, prepare the letter, send it only if they would have sent it anyway, and record the real outcome.
5. Come back after a second purchase and add it. That is the retention check.

## What to record

- Did they finish adding a purchase without help?
- Did they understand that an estimate is not money received?
- Did they try to use a disabled path (email import, bank, automatic send)?
- Did a second purchase happen in a later sitting?
- Any case they marked received, with the amount they typed, kept separate from estimates.

## Decision

- Ship a wider trial only if people can add a receipt and correctly tell an estimate from a confirmed amount, and if at least some return for a second purchase.
- Iterate if the form is too heavy or the “no policy on file” state is the whole experience and they needed real sourced policies.
- Stop if people treat the sample windows as real store rules, or if the only requested feature is automatic refunds Rewind will not do.

No compliance certification is claimed. No production launch is claimed.
