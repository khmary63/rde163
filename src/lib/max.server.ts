// MAX Bot API helper — server only.
// Docs: https://dev.max.ru/docs-api
// API: https://platform-api.max.ru — POST /messages?chat_id=...
// Auth: header `Authorization: <token>` (без префикса Bearer, query-параметр
// access_token больше не поддерживается).
// Body: { text: string }

export async function sendMaxMessage(text: string): Promise<void> {
  const token = process.env.MAX_BOT_TOKEN;
  const chatId = process.env.MAX_MANAGER_CHAT_ID;
  if (!token || !chatId) {
    console.warn("[max] MAX_BOT_TOKEN / MAX_MANAGER_CHAT_ID not configured");
    return;
  }
  const url = `https://platform-api.max.ru/messages?chat_id=${encodeURIComponent(chatId)}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ text: text.slice(0, 4000) }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[max] sendMessage failed [${res.status}]: ${body}`);
    }
  } catch (e) {
    console.error("[max] sendMessage error:", e);
  }
}
