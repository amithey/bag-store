# Deployment checklist

## 1. Connect Vercel

The Vercel CLI is installed on this machine, but the current token is invalid.

Run:

```bash
vercel login
```

After login, deploy:

```bash
npm run deploy
```

## 2. Required Vercel environment variables

Add these in Vercel Project Settings -> Environment Variables:

```bash
RESEND_API_KEY=
ORDER_FROM_EMAIL=
```

`RESEND_API_KEY` is required for sending order emails to the store and customer.
`ORDER_FROM_EMAIL` should be a verified sender in Resend, for example:

```bash
smadar heymans <orders@your-domain.com>
```

## 3. Optional Bit payment link

When the Bit payment link is ready, add:

```bash
BIT_PAYMENT_URL=
```

When this value exists, the order success screen and customer email will include a "Pay with Bit" link.

## 4. Optional automatic WhatsApp alerts

For true automatic WhatsApp alerts, configure Meta WhatsApp Cloud API and add:

```bash
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ALERT_TO=972507810050
```

Without these values, orders still work. The customer still gets a WhatsApp link after checkout, but the store will not receive an automatic WhatsApp push.

## 5. Verify after deployment

1. Place a test order with your own email.
2. Confirm the store email arrives.
3. Confirm the customer summary email arrives.
4. If WhatsApp Cloud API is configured, confirm the store receives the WhatsApp alert.
5. If `BIT_PAYMENT_URL` is configured, confirm the Bit link appears after checkout and in the customer email.
