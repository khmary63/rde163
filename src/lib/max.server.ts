// MAX Bot API helper — server only.
// Docs: https://dev.max.ru/docs-api
// API: https://platform-api.max.ru — POST /messages?chat_id=...
// Auth: header `Authorization: <token>` (без префикса Bearer, query-параметр
// access_token больше не поддерживается).
// Body: { text: string }

type MaxChat = {
  chat_id: number;
  status?: string;
  title?: string;
};

async function resolveChatId(token: string, configuredChatId: string): Promise<string> {
  if (/^-?\d+$/.test(configuredChatId)) return configuredChatId;

  console.warn(`[max] MAX_MANAGER_CHAT_ID must be numeric, got ${configuredChatId}. Trying to resolve an active chat.`);
  const res = await fetch("https://platform-api.max.ru/chats?count=100", {
    headers: { Authorization: token },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[max] chats lookup failed [${res.status}]: ${body}`);
    return configuredChatId;
  }

  const payload = (await res.json()) as { chats?: MaxChat[] };
  const chat = payload.chats?.find((c) => c.status === "active" && c.title === "Заказы")
    ?? payload.chats?.find((c) => c.status === "active")
    ?? payload.chats?.[0];

  if (!chat) {
    console.error("[max] chats lookup returned no chats");
    return configuredChatId;
  }

  return String(chat.chat_id);
}

export async function sendMaxMessage(text: string): Promise<void> {
  const token = process.env.MAX_BOT_TOKEN;
  const configuredChatId = process.env.MAX_MANAGER_CHAT_ID;
  if (!token || !configuredChatId) {
    console.warn("[max] MAX_BOT_TOKEN / MAX_MANAGER_CHAT_ID not configured");
    return;
  }
  try {
    const chatId = await resolveChatId(token, configuredChatId);
    const url = `https://platform-api.max.ru/messages?chat_id=${encodeURIComponent(chatId)}`;
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
