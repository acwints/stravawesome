import fs from 'node:fs';
import dotenv from 'dotenv';
import { Polar } from '@polar-sh/sdk';

const envPath = fs.existsSync('.env.local') ? '.env.local' : '.env';
const env = fs.existsSync(envPath) ? dotenv.parse(fs.readFileSync(envPath)) : {};
const required = [
  'POLAR_ACCESS_TOKEN',
  'POLAR_WEBHOOK_SECRET',
  'POLAR_ORGANIZATION_ID',
  'POLAR_PRODUCT_ID',
];
const missing = required.filter((key) => !env[key] && !process.env[key]);

if (missing.length > 0) {
  console.error(`Polar preflight failed: missing ${missing.join(', ')}`);
  process.exit(1);
}

const config = {
  accessToken: process.env.POLAR_ACCESS_TOKEN || env.POLAR_ACCESS_TOKEN,
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET || env.POLAR_WEBHOOK_SECRET,
  organizationId: process.env.POLAR_ORGANIZATION_ID || env.POLAR_ORGANIZATION_ID,
  productId: process.env.POLAR_PRODUCT_ID || env.POLAR_PRODUCT_ID,
  priceId: process.env.POLAR_PRICE_ID || env.POLAR_PRICE_ID,
  server: (process.env.POLAR_SERVER || env.POLAR_SERVER) === 'sandbox' ? 'sandbox' : 'production',
};

const polar = new Polar({
  accessToken: config.accessToken,
  server: config.server,
});

function shortId(value) {
  return value ? `${value.slice(0, 8)}...` : '';
}

const orgs = (await polar.organizations.list({ limit: 100 })).result?.items || [];
const organization = orgs.find((org) => org.id === config.organizationId);

if (!organization) {
  console.error(`Polar preflight failed: configured organization ${shortId(config.organizationId)} was not found.`);
  process.exit(1);
}

const product = await polar.products.get({ id: config.productId });
const prices = product.prices || [];
const configuredPrice = config.priceId
  ? prices.find((price) => price.id === config.priceId)
  : prices.find((price) => !price.isArchived);

const failures = [];

if (product.organizationId !== organization.id) {
  failures.push('product does not belong to configured organization');
}

if (product.isArchived) {
  failures.push('configured product is archived');
}

if (!product.isRecurring) {
  failures.push('configured product is not recurring');
}

if (!configuredPrice) {
  failures.push(config.priceId ? 'configured price was not found on product' : 'product has no active price');
} else if (configuredPrice.isArchived) {
  failures.push('configured price is archived');
}

if (failures.length > 0) {
  console.error(`Polar preflight failed: ${failures.join('; ')}`);
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  server: config.server,
  organization: {
    id: shortId(organization.id),
    name: organization.name,
    slug: organization.slug,
  },
  product: {
    id: shortId(product.id),
    name: product.name,
    recurring: product.isRecurring,
  },
  price: configuredPrice ? {
    id: shortId(configuredPrice.id),
    amount: configuredPrice.priceAmount,
    currency: configuredPrice.priceCurrency,
  } : null,
  webhookSecretConfigured: Boolean(config.webhookSecret),
}, null, 2));
