import type { Metadata } from "next";
import { Notice } from "@/components/ui/notice";
import { buttonClass } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { countMetrics } from "@/lib/metrics";
import { COMMON_TIMEZONES, DEFAULT_TIMEZONE } from "@/lib/time";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const query = await searchParams;
  const user = await readSessionUser(getDb());
  const timezone = user?.timezone ?? DEFAULT_TIMEZONE;
  const metrics = user ? countMetrics(getDb(), user.id) : null;
  const zones = COMMON_TIMEZONES.includes(timezone as (typeof COMMON_TIMEZONES)[number])
    ? [...COMMON_TIMEZONES]
    : [timezone, ...COMMON_TIMEZONES];

  return (
    <main id="main" className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6 md:py-12">
      <p className="text-sm font-semibold tracking-[0.14em] text-muted uppercase">This browser</p>
      <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">Settings</h1>
      <p className="mt-4 max-w-xl text-lg leading-8 text-muted">
        A name and a timezone are optional. Rewind does not ask for an email address. Saving creates a session cookie on
        this browser.
      </p>
      <div className="mt-6">
        <Notice error={query.error} notice={query.notice} />
      </div>
      <form action="/api/settings" method="post" className="mt-6 flex max-w-xl flex-col gap-5 rounded-3xl border border-line bg-card p-5">
        <Field id="display_name" label="What should letters call you?" hint="Leave this blank and letters say “A customer”." error={query.error === "name" ? "Check the name." : null}>
          <input
            id="display_name"
            name="display_name"
            defaultValue={user?.displayName ?? ""}
            autoComplete="given-name"
            maxLength={40}
            aria-invalid={query.error === "name"}
            aria-describedby="display_name-hint"
            className={inputClass}
          />
        </Field>
        <Field id="timezone" label="Your timezone" hint="Deadlines still use the policy’s clock. This timezone is for the dates you see." error={query.error === "timezone" ? "Choose a known timezone." : null}>
          <select id="timezone" name="timezone" defaultValue={timezone} className={inputClass} aria-describedby="timezone-hint">
            {zones.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </Field>
        <button className={buttonClass("primary", "xl")} type="submit">
          Save settings
        </button>
      </form>
      {metrics ? (
        <section className="mt-8 max-w-xl rounded-3xl bg-sand px-5 py-4">
          <h2 className="text-lg font-semibold">Your activity in this database</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            These counts are rows on this computer. They are not a published rate and not a pilot result.
          </p>
          <dl className="mt-3 grid gap-2 text-base">
            <div className="flex justify-between gap-4"><dt>Purchases added</dt><dd className="amount font-semibold">{metrics.purchases}</dd></div>
            <div className="flex justify-between gap-4"><dt>Cases prepared</dt><dd className="amount font-semibold">{metrics.prepared}</dd></div>
            <div className="flex justify-between gap-4"><dt>Recoveries you confirmed</dt><dd className="amount font-semibold">{metrics.recovered}</dd></div>
            <div className="flex justify-between gap-4"><dt>Cases prepared per 100 purchases</dt><dd className="amount font-semibold">{metrics.perHundred == null ? "Not enough purchases" : metrics.perHundred}</dd></div>
          </dl>
        </section>
      ) : null}
      <section className="mt-8 max-w-xl rounded-3xl border border-line bg-card px-5 py-4">
        <h2 className="text-lg font-semibold">Your data</h2>
        {user ? (
          <>
            <p className="mt-2 text-base leading-7 text-muted">
              The download is a JSON file of this browser’s purchases, letters, and confirmed amounts. It does not include anyone else’s data.
            </p>
            <a href="/api/account/export" className={`${buttonClass("secondary")} mt-4`}>
              Download my data
            </a>
            <form action="/api/account/delete" method="post" className="mt-6 flex flex-col gap-3 border-t border-line pt-4">
              <Field id="confirm" label="Delete everything in this browser" hint="Type DELETE. Sample policies stay. This cannot be undone." error={query.error === "confirm" ? "Type DELETE to confirm." : null}>
                <input id="confirm" name="confirm" autoComplete="off" className={inputClass} aria-describedby="confirm-hint" />
              </Field>
              <button className={buttonClass("danger")} type="submit">
                Delete my data
              </button>
            </form>
          </>
        ) : (
          <p className="mt-2 text-base leading-7 text-muted">Save settings once to start a session. Download and delete apply to that session.</p>
        )}
      </section>
    </main>
  );
}
