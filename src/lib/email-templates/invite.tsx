import * as React from 'react'
import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Text,
} from '@react-email/components'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ siteName, siteUrl, confirmationUrl }: InviteEmailProps) => (
  <Html lang="ru" dir="ltr">
    <Head />
    <Preview>Приглашение присоединиться к {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Вас пригласили</Heading>
        <Text style={text}>
          Вас пригласили присоединиться к{' '}
          <Link href={siteUrl} style={link}><strong>{siteName}</strong></Link>.
          Нажмите кнопку ниже, чтобы принять приглашение и создать аккаунт.
        </Text>
        <Button style={button} href={confirmationUrl}>Принять приглашение</Button>
        <Text style={footer}>
          Если приглашение пришло по ошибке — просто проигнорируйте это письмо.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0A0E13', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 20px' }
const link = { color: '#00BCE4', textDecoration: 'underline' }
const button = { backgroundColor: '#00BCE4', color: '#0A0E13', fontSize: '14px', fontWeight: 'bold' as const, borderRadius: '6px', padding: '12px 22px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
