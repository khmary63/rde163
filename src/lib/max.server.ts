// MAX Bot API helper — server only.
// API: https://botapi.max.ru — POST /messages?chat_id=...
// Auth: Authorization: Bearer <token> (access_token query param is deprecated)
// Body: { text: string }

export async function sendMaxMessage(text: string): Promise<void> {
  const token = process.env.MAX_BOT_TOKEN;
  const chatId = process.env.MAX_MANAGER_CHAT_ID;
  if (!token || !chatId) {
    console.warn("[max] MAX_BOT_TOKEN / MAX_MANAGER_CHAT_ID not configured");
    return;
  }
  const url = `https://botapi.max.ru/messages?chat_id=${encodeURIComponent(chatId)}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
