/**
 * Script to fetch Polar.sh organization and product information
 * Run with: npx tsx scripts/setup-polar.ts
 */

import { Polar } from '@polar-sh/sdk';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function setupPolar() {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;

  if (!accessToken) {
    console.error('❌ POLAR_ACCESS_TOKEN not found in .env.local');
    process.exit(1);
  }

  console.log('🔍 Connecting to Polar.sh...\n');

  const polar = new Polar({
    accessToken,
  });

  try {
    // Fetch organizations
    console.log('📋 Fetching organizations...');
    const orgsResponse = await polar.organizations.list({
      limit: 10,
    });

    if (!orgsResponse.result || orgsResponse.result.items.length === 0) {
      console.error('❌ No organizations found. Please create one at https://polar.sh');
      process.exit(1);
    }

    console.log(`\n✅ Found ${orgsResponse.result.items.length} organization(s):\n`);
    orgsResponse.result.items.forEach((org, index) => {
      console.log(`  ${index + 1}. ${org.name} (ID: ${org.id})`);
    });

    const organization = orgsResponse.result.items[0];
    console.log(`\n📌 Using organization: ${organization.name}`);

    // Fetch products
    console.log('\n📦 Fetching products...');
    const productsResponse = await polar.products.list({
      organizationId: organization.id,
      limit: 10,
    });

    if (!productsResponse.result || productsResponse.result.items.length === 0) {
      console.log('\n⚠️  No products found. Creating "StravAwesome Premium" product...\n');

      // Create product
      const newProduct = await polar.products.create({
        organizationId: organization.id,
        name: 'StravAwesome Premium',
        description: 'Annual subscription to StravAwesome premium features including AI training coach, route maps, photo gallery, and advanced analytics.',
        prices: [
          {
            type: 'recurring',
            recurringInterval: 'year',
            priceAmount: 1200, // $12.00 in cents
            priceCurrency: 'USD',
          },
        ],
      });

      console.log(`✅ Created product: ${newProduct.name} (ID: ${newProduct.id})`);

      const price = newProduct.prices?.[0];
      if (price) {
        console.log(`✅ Created price: $12/year (ID: ${price.id})`);
      }

      console.log('\n🎉 Setup complete! Add these to your .env.local:\n');
      console.log(`POLAR_ORGANIZATION_ID="${organization.id}"`);
      console.log(`POLAR_PRODUCT_ID="${newProduct.id}"`);
      if (price) {
        console.log(`POLAR_PRICE_ID="${price.id}"`);
      }
    } else {
      console.log(`\n✅ Found ${productsResponse.result.items.length} product(s):\n`);

      productsResponse.result.items.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name} (ID: ${product.id})`);
        if (product.prices && product.prices.length > 0) {
          product.prices.forEach((price) => {
            const amount = price.priceAmount ? price.priceAmount / 100 : 0;
            const interval = price.type === 'recurring' ? `/${price.recurringInterval}` : '';
            console.log(`     - $${amount}${interval} (Price ID: ${price.id})`);
          });
        }
      });

      const product = productsResponse.result.items[0];
      const price = product.prices?.[0];

      console.log('\n🎉 Setup complete! Add these to your .env.local:\n');
      console.log(`POLAR_ORGANIZATION_ID="${organization.id}"`);
      console.log(`POLAR_PRODUCT_ID="${product.id}"`);
      if (price) {
        console.log(`POLAR_PRICE_ID="${price.id}"`);
      }
    }

    console.log('\n💡 Next steps:');
    console.log('  1. Add the environment variables above to .env.local');
    console.log('  2. Restart your development server');
    console.log('  3. Test the checkout flow at /pricing\n');

  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
    }
    process.exit(1);
  }
}

setupPolar();
