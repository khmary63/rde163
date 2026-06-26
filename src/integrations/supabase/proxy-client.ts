// Клиент бэкенда. По умолчанию идёт через собственный прокси на VPS
// (https://rde163.ru/api), чтобы трафик не блокировался корпоративными
// VPN/РКН. На превью‑доменах Lovable и при локальной разработке прокси
// недоступен (CORS / нет DNS) — в этом случае откатываемся на прямой
// Supabase URL, иначе вход и любые запросы падают с «Failed to fetch».

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const PROXY_URL = 'https://rde163.ru/api';
const DIRECT_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://xfrdeuxecdvmgentedib.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY;

function resolveBaseUrl(): string {
  if (typeof window === 'undefined') return DIRECT_URL;
  const host = window.location.hostname;
  // Прокси работает только для боевых доменов проекта.
  const proxyHosts = ['rde163.ru', 'www.rde163.ru', 'rde163.lovable.app'];
  if (proxyHosts.includes(host)) return PROXY_URL;
  return DIRECT_URL;
}

export const supabase = createClient<Database>(
  resolveBaseUrl(),
  SUPABASE_PUBLISHABLE_KEY!,
  {
    auth: {
      // Совпадает с дефолтным storageKey, который использует
      // авто‑генерируемый клиент (sb-<project-ref>-auth-token),
      // чтобы существующие сессии пользователей не сбрасывались.
      storageKey: 'sb-xfrdeuxecdvmgentedib-auth-token',
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);
