import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/unsubscribe")({
  validateSearch: (s: Record<string, unknown>) => ({ token: (s.token as string) || "" }),
  component: UnsubscribePage,
  head: () => ({ meta: [{ title: "Отписка от рассылки — РДЭ" }] }),
});

type Status = "validating" | "ready" | "already" | "invalid" | "submitting" | "done" | "error";

function UnsubscribePage() {
  const { token } = useSearch({ from: "/unsubscribe" });
  const [status, setStatus] = useState<Status>("validating");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    fetch(`/email/unsubscribe?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) return setStatus("invalid");
        if (j.alreadyUnsubscribed || j.already_unsubscribed) {
          setEmail(j.email ?? null);
          return setStatus("already");
        }
        setEmail(j.email ?? null);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [token]);

  const confirm = async () => {
    setStatus("submitting");
    try {
      const r = await fetch(`/email/unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!r.ok) return setStatus("error");
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-12 text-center">
      <h1 className="text-2xl font-semibold text-foreground">Отписка от писем</h1>
      <div className="mt-4 text-sm text-muted-foreground">
        {status === "validating" && <p>Проверяем ссылку…</p>}
        {status === "invalid" && <p>Ссылка недействительна или устарела.</p>}
        {status === "error" && <p>Не удалось обработать запрос. Попробуйте позже.</p>}
        {status === "already" && (
          <p>{email ? `Адрес ${email} уже отписан.` : "Этот адрес уже отписан."}</p>
        )}
        {status === "ready" && (
          <>
            <p>
              Подтвердите отписку{email ? ` для ${email}` : ""}. Вы перестанете получать
              транзакционные уведомления от РДЭ.
            </p>
            <Button className="mt-6" onClick={confirm}>Отписаться</Button>
          </>
        )}
        {status === "submitting" && <p>Отписываем…</p>}
        {status === "done" && (
          <p>Готово. {email ? `${email} ` : ""}больше не будет получать письма.</p>
        )}
      </div>
    </div>
  );
}
