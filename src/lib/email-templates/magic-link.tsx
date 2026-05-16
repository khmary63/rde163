import * as React from 'react'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text,
} from '@react-email/components'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ siteName, confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="ru" dir="ltr">
    <Head />
    <Preview>Ссылка для входа — {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Ссылка для входа</Heading>
        <Text style={text}>
          Нажмите кнопку ниже, чтобы войти в {siteName}. Ссылка действительна короткое время.
        </Text>
        <Button style={button} href={confirmationUrl}>Войти</Button>
        <Text style={footer}>
          Если вы не запрашивали ссылку — просто проигнорируйте это письмо.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0A0E13', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 20px' }
const button = { backgroundColor: '#00BCE4', color: '#0A0E13', fontSize: '14px', fontWeight: 'bold' as const, borderRadius: '6px', padding: '12px 22px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
