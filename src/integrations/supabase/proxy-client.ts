// Клиент бэкенда через собственный прокси на VPS (api.neyromarket.com).
// Базовый URL указывает на прокси, ключ — публичный anon-ключ из окружения.
// Используется во всех клиентских (браузерных) местах вместо ./client,
// чтобы трафик (БД, авторизация, edge-функции, storage) шёл через VPS
// и не блокировался корпоративными VPN/РКН.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const PROXY_URL = 'https://api-rde163.neyromarket.com';
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY;

// Импортируйте клиент так:
// import { supabase } from "@/integrations/supabase/proxy-client";

export const supabase = createClient<Database>(PROXY_URL, SUPABASE_PUBLISHABLE_KEY!, {
  auth: {
    // Совпадает с дефолтным storageKey, который раньше использовал
    // авто-генерируемый клиент (sb-<project-ref>-auth-token),
    // чтобы существующие сессии пользователей не сбрасывались.
    storageKey: 'sb-xfrdeuxecdvmgentedib-auth-token',
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
});
