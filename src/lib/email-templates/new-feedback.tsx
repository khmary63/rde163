import * as React from 'react'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

const SITE_NAME = 'РДЭ — Русский Дом Экспорта'

interface NewFeedbackProps {
  name?: string
  phone?: string
  email?: string
  message?: string
}

const NewFeedbackEmail = ({ name, phone, email, message = '' }: NewFeedbackProps) => (
  <Html lang="ru" dir="ltr">
    <Head />
    <Preview>Новое сообщение из виджета — {name || 'аноним'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🔔 Сообщение из виджета</Heading>
        <Section style={card}>
          {name ? <Text style={row}><strong>Имя:</strong> {name}</Text> : null}
          {phone ? <Text style={row}><strong>Телефон:</strong> {phone}</Text> : null}
          {email ? <Text style={row}><strong>Email:</strong> {email}</Text> : null}
        </Section>
        <Text style={label}>Сообщение</Text>
        <Text style={text}>{message}</Text>
        <Hr style={hr} />
        <Text style={footer}>{SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: NewFeedbackEmail,
  subject: (d: Record<string, any>) =>
    `Сообщение из виджета РДЭ — ${d.name || d.phone || d.email || 'аноним'}`,
  displayName: 'Виджет обратной связи',
  to: 'hrs@mail.rde163.ru',
  previewData: {
    name: 'Иван Петров',
    phone: '+7 999 123-45-67',
    email: 'ivan@example.com',
    message: 'Здравствуйте! Подскажите, есть ли в наличии фильтр на Sitrak C7H?',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '600px' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#111111', margin: '0 0 20px' }
const card = { backgroundColor: '#f7f7f8', borderRadius: '8px', padding: '16px 20px', margin: '0 0 16px' }
const row = { fontSize: '14px', color: '#222222', margin: '4px 0' }
const label = { fontSize: '12px', color: '#888888', textTransform: 'uppercase' as const, margin: '0 0 6px' }
const text = { fontSize: '14px', color: '#222222', lineHeight: '1.5', margin: '0 0 16px', whiteSpace: 'pre-wrap' as const }
const hr = { borderColor: '#e6e6e6', margin: '20px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0' }
