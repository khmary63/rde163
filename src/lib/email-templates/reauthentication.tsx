import * as React from 'react'
import {
  Body, Container, Head, Heading, Html, Preview, Text,
} from '@react-email/components'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="ru" dir="ltr">
    <Head />
    <Preview>Ваш код подтверждения</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Подтвердите вход</Heading>
        <Text style={text}>Используйте код ниже для подтверждения личности:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          Код действителен короткое время. Если вы не запрашивали — проигнорируйте это письмо.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0A0E13', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 20px' }
const codeStyle = { fontFamily: 'Courier, monospace', fontSize: '28px', fontWeight: 'bold' as const, letterSpacing: '4px', color: '#0A0E13', backgroundColor: '#f3f5f8', padding: '14px 20px', borderRadius: '6px', textAlign: 'center' as const, margin: '0 0 24px' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
