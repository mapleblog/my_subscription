require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

function maskEmail(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) return 'unknown';
  const [local, domain] = email.split('@');
  const keep = local.slice(0, 2);
  return `${keep}${'*'.repeat(Math.max(0, local.length - 2))}@${domain}`;
}

async function listDomains(apiKey) {
  const res = await fetch('https://api.resend.com/domains', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const text = await res.text();
  return { status: res.status, text };
}

async function sendTestEmail(apiKey, from, to) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject: 'Subly Resend verification test',
      html: '<p>This is a test email from Subly.</p>',
    }),
  });
  const text = await res.text();
  return { status: res.status, text };
}

async function main() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log('RESEND_API_KEY missing');
    process.exit(2);
  }

  const domains = await listDomains(apiKey);
  console.log('domains_status=', domains.status);
  console.log(domains.text.slice(0, 800));

  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.log('DATABASE_URL/DIRECT_URL missing');
    process.exit(2);
  }
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  try {
    const user =
      (await prisma.user.findFirst({ where: { isVerified: false }, orderBy: { createdAt: 'desc' } })) ||
      (await prisma.user.findFirst({ orderBy: { createdAt: 'desc' } }));

    if (!user) {
      console.log('no_user_in_db');
      return;
    }

    const envFrom = process.env.MAIL_FROM;
    const from = envFrom || (process.env.NODE_ENV !== 'production' ? 'onboarding@resend.dev' : 'no-reply@subly.app');
    const to = user.email;

    console.log('send_to=', maskEmail(to));
    console.log('send_from_domain=', from.includes('@') ? from.split('@')[1] : 'invalid');

    const sent = await sendTestEmail(apiKey, from, to);
    console.log('send_status=', sent.status);
    console.log(sent.text.slice(0, 800));
  } finally {
    try {
      await pool.end();
    } catch {}
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('fatal', e && e.message ? e.message : e);
  process.exit(1);
});
