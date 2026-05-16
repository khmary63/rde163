import * as React from 'react'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

const SITE_NAME = 'РДЭ — Русский Дом Экспорта'

interface NewOrderProps {
  number?: string
  customer?: string
  phone?: string
  itemsCount?: number
  total?: number
  notes?: string
  xlsxUrl?: string
}

const NewOrderEmail = ({
  number = '—',
  customer = '—',
  phone,
  itemsCount = 0,
  total = 0,
  notes,
  xlsxUrl,
}: NewOrderProps) => (
  <Html lang="ru" dir="ltr">
    <Head />
    <Preview>Новая заявка №{number} — {customer}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>📦 Новая заявка №{number}</Heading>
        <Section style={card}>
          <Text style={row}><strong>Клиент:</strong> {customer}</Text>
          {phone ? <Text style={row}><strong>Телефон:</strong> {phone}</Text> : null}
          <Text style={row}><strong>Позиций:</strong> {itemsCount}</Text>
          <Text style={row}><strong>Сумма:</strong> {total.toLocaleString('ru-RU')} ₽</Text>
        </Section>
        {xlsxUrl ? (
          <Section style={{ textAlign: 'center', margin: '0 0 20px' }}>
            <Button href={xlsxUrl} style={button}>
              Скачать заявку (Excel)
            </Button>
            <Text style={hint}>Ссылка действительна 30 дней</Text>
          </Section>
        ) : null}
        {notes ? (
          <>
            <Hr style={hr} />
            <Text style={label}>Комментарий клиента</Text>
            <Text style={text}>{notes}</Text>
          </>
        ) : null}
        <Hr style={hr} />
        <Text style={footer}>{SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: NewOrderEmail,
  subject: (d: Record<string, any>) => `Новая заявка №${d.number ?? '—'} — ${d.customer ?? 'клиент'}`,
  displayName: 'Новая заявка',
  to: 'hrs@mail.rde163.ru',
  previewData: {
    number: 'RDE-001234',
    customer: 'ООО Тестовая Компания',
    phone: '+7 999 123-45-67',
    itemsCount: 3,
    total: 125000,
    notes: 'Срочно, нужна доставка до пятницы',
    xlsxUrl: 'https://example.com/order.xlsx',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '600px' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#111111', margin: '0 0 20px' }
const card = { backgroundColor: '#f7f7f8', borderRadius: '8px', padding: '16px 20px', margin: '0 0 16px' }
const row = { fontSize: '14px', color: '#222222', margin: '4px 0' }
const label = { fontSize: '12px', color: '#888888', textTransform: 'uppercase' as const, margin: '0 0 6px' }
const text = { fontSize: '14px', color: '#222222', lineHeight: '1.5', margin: '0 0 16px' }
const hr = { borderColor: '#e6e6e6', margin: '20px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0' }
const button = {
  backgroundColor: '#111111',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  textDecoration: 'none',
  display: 'inline-block',
}
const hint = { fontSize: '12px', color: '#888888', margin: '8px 0 0' }

