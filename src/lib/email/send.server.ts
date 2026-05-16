import * as React from 'react'
import { render } from '@react-email/components'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { TEMPLATES } from '@/lib/email-templates/registry'

const SITE_NAME = 'rde163'
const SENDER_DOMAIN = 'notify.rde163.ru'
const FROM_DOMAIN = 'notify.rde163.ru'

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

interface SendInternalParams {
  templateName: string
  recipientEmail?: string
  templateData?: Record<string, any>
  idempotencyKey?: string
}

/**
 * Server-only helper that enqueues a transactional email directly via the admin
 * client, bypassing the JWT-protected /lovable/email/transactional/send route.
 * Use only from trusted server functions / server routes — never expose to clients.
 */
export async function sendInternalTransactionalEmail(params: SendInternalParams): Promise<{ ok: boolean; reason?: string }> {
  const tpl = TEMPLATES[params.templateName]
  if (!tpl) {
    console.error('[email] template not found', params.templateName)
    return { ok: false, reason: 'template_not_found' }
  }
  const recipient = tpl.to || params.recipientEmail
  if (!recipient) return { ok: false, reason: 'no_recipient' }

  const messageId = crypto.randomUUID()
  const idempotencyKey = params.idempotencyKey || messageId
  const normalized = recipient.toLowerCase()

  // Suppression check
  const { data: suppressed } = await supabaseAdmin
    .from('suppressed_emails')
    .select('id')
    .eq('email', normalized)
    .maybeSingle()
  if (suppressed) return { ok: false, reason: 'suppressed' }

  // Unsubscribe token (reuse or create)
  let unsubscribeToken: string
  const { data: existing } = await supabaseAdmin
    .from('email_unsubscribe_tokens')
    .select('token, used_at')
    .eq('email', normalized)
    .maybeSingle()
  if (existing && !existing.used_at) {
    unsubscribeToken = existing.token
  } else {
    unsubscribeToken = generateToken()
    await supabaseAdmin
      .from('email_unsubscribe_tokens')
      .upsert({ token: unsubscribeToken, email: normalized }, { onConflict: 'email', ignoreDuplicates: true })
    const { data: stored } = await supabaseAdmin
      .from('email_unsubscribe_tokens')
      .select('token')
      .eq('email', normalized)
      .maybeSingle()
    if (stored?.token) unsubscribeToken = stored.token
  }

  const data = params.templateData || {}
  const element = React.createElement(tpl.component, data)
  const html = await render(element)
  const text = await render(element, { plainText: true })
  const subject = typeof tpl.subject === 'function' ? tpl.subject(data) : tpl.subject

  await supabaseAdmin.from('email_send_log').insert({
    message_id: messageId,
    template_name: params.templateName,
    recipient_email: recipient,
    status: 'pending',
  } as any)

  const { error } = await supabaseAdmin.rpc('enqueue_email', {
    queue_name: 'transactional_emails',
    payload: {
      message_id: messageId,
      to: recipient,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject,
      html,
      text,
      purpose: 'transactional',
      label: params.templateName,
      idempotency_key: idempotencyKey,
      unsubscribe_token: unsubscribeToken,
      queued_at: new Date().toISOString(),
    },
  } as any)

  if (error) {
    console.error('[email] enqueue failed', error)
    await supabaseAdmin.from('email_send_log').insert({
      message_id: messageId,
      template_name: params.templateName,
      recipient_email: recipient,
      status: 'failed',
      error_message: error.message,
    } as any)
    return { ok: false, reason: 'enqueue_failed' }
  }

  return { ok: true }
}
