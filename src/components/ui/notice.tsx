import { errorMessage, noticeMessage } from "@/lib/messages";

export function Notice({ error, notice }: { error?: string; notice?: string }) {
  const failure = errorMessage(error);
  const success = noticeMessage(notice);
  if (failure) {
    return (
      <div role="alert" className="rounded-2xl border-2 border-caution bg-caution-bg px-4 py-3 text-base font-semibold text-caution">
        {failure}
      </div>
    );
  }
  if (success) {
    return (
      <div role="status" className="rounded-2xl border-2 border-ink/10 bg-white px-4 py-3 text-base font-semibold text-ink">
        {success}
      </div>
    );
  }
  return null;
}
