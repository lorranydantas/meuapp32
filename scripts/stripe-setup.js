/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const CREDIT_PLANS = {
  price_basic_monthly: { credits: 100, name: 'Basic' },
  price_pro_monthly: { credits: 500, name: 'Pro' },
  price_enterprise_monthly: { credits: 2000, name: 'Enterprise' },
  price_basic_yearly: { credits: 1200, name: 'Basic (Yearly)' },
  price_pro_yearly: { credits: 6000, name: 'Pro (Yearly)' },
  price_enterprise_yearly: { credits: 24000, name: 'Enterprise (Yearly)' },
};

async function setup() {
  console.log('Setting up Stripe billing meter...');

  try {
    const meter = await stripe.billing.meters.create({
      name: 'SaaS Credits',
      default_aggregation: {
        formula: 'sum',
      },
      customer_mapping: {
        type: 'by_id',
        value_path: 'stripe_customer_id',
      },
    });

    console.log('✅ Billing meter created:');
    console.log(`Meter ID: ${meter.id}`);
    console.log('Add this to your .env file:');
    console.log(`STRIPE_CREDIT_METER_ID=${meter.id}`);

    await createMeteredPrices(meter.id);

    console.log('\nSetup complete!');
  } catch (error) {
    if (error.code === 'resource_already_exists') {
      console.warn('⚠️  Billing meter "SaaS Credits" already exists.');
      const meters = await stripe.billing.meters.list({ active: true });
      const existingMeter = meters.data.find(
        (m) => m.display_name === 'SaaS Credits'
      );
      if (existingMeter) {
        console.log(`Using existing meter ID: ${existingMeter.id}`);
        console.log('Add this to your .env file if not already present:');
        console.log(`STRIPE_CREDIT_METER_ID=${existingMeter.id}`);
        await createMeteredPrices(existingMeter.id);
      }
    } else {
      console.error('Error setting up Stripe billing meter:', error.message);
      throw error;
    }
  }
}

async function createMeteredPrices(meterId) {
  console.log('\nCreating metered prices for existing products...');
  try {
    const products = await stripe.products.list({ active: true });
    for (const product of products.data) {
      const prices = await stripe.prices.list({
        product: product.id,
        active: true,
      });
      for (const price of prices.data) {
        if (price.recurring && !price.transform_quantity) {
          try {
            const meteredPrice = await stripe.prices.create({
              product: product.id,
              currency: price.currency,
              unit_amount: 0, // No charge per credit, just metering
              recurring: {
                interval: price.recurring.interval,
                interval_count: price.recurring.interval_count,
                usage_type: 'metered',
              },
              billing_scheme: 'per_unit',
              nickname: `${price.nickname} (Metered)`,
              metadata: {
                parent_price_id: price.id,
                is_metered_price: 'true',
              },
              tax_behavior: 'unspecified',
            });
            console.log(
              `✅ Metered price created for ${product.name} (${price.nickname})`
            );
            console.log(`   - Price ID: ${meteredPrice.id}`);
          } catch (priceError) {
            if (priceError.code === 'resource_already_exists') {
              console.warn(
                `   - ⚠️ Metered price for ${product.name} (${price.nickname}) already exists.`
              );
            } else {
              console.error(
                `   - ❌ Error creating metered price for ${product.name}:`,
                priceError.message
              );
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error creating metered prices:', error.message);
  }
}

async function fullSetup() {
  console.log('Starting full setup for existing subscriptions...');
  await setup(); // Ensure meter and prices exist

  const meterId = process.env.STRIPE_CREDIT_METER_ID;
  if (!meterId) {
    console.error(
      'STRIPE_CREDIT_METER_ID not found in environment variables. Run `setup` first.'
    );
    return;
  }

  console.log('\nUpdating existing subscriptions with metered price...');
  try {
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
    });

    for (const subscription of subscriptions.data) {
      const hasMeteredPrice = subscription.items.data.some(
        (item) => item.price.recurring?.usage_type === 'metered'
      );

      if (hasMeteredPrice) {
        console.log(
          `- Subscription ${subscription.id} already has a metered price. Skipping.`
        );
        continue;
      }

      const flatRateItem = subscription.items.data.find(
        (item) => item.price.recurring?.usage_type !== 'metered'
      );
      if (!flatRateItem) {
        console.warn(
          `- Subscription ${subscription.id} has no flat-rate item. Skipping.`
        );
        continue;
      }

      const meteredPrices = await stripe.prices.list({
        product: flatRateItem.price.product,
        active: true,
        metadata: { parent_price_id: flatRateItem.price.id },
      });
      const meteredPrice = meteredPrices.data[0];

      if (!meteredPrice) {
        console.error(
          `- ❌ No metered price found for product ${flatRateItem.price.product}. Skipping subscription ${subscription.id}.`
        );
        continue;
      }

      await stripe.subscriptions.update(subscription.id, {
        items: [
          ...subscription.items.data.map((item) => ({
            id: item.id,
          })),
          {
            price: meteredPrice.id,
          },
        ],
        proration_behavior: 'none',
      });
      console.log(`✅ Subscription ${subscription.id} updated.`);

      // Grant initial credits
      const planKey = Object.keys(CREDIT_PLANS).find(
        (key) => key === flatRateItem.price.id
      );
      if (planKey) {
        const credits = CREDIT_PLANS[planKey].credits;
        await grantCredits(subscription.customer, credits, 'initial_grant');
        console.log(
          `   - Granted ${credits} initial credits to customer ${subscription.customer}`
        );
      }
    }
  } catch (error) {
    console.error('Error updating subscriptions:', error.message);
  }
}

async function grantCredits(customerId, credits, grantReason) {
  const meterId = process.env.STRIPE_CREDIT_METER_ID;
  if (!meterId) {
    console.error('STRIPE_CREDIT_METER_ID not set.');
    return;
  }
  try {
    await stripe.billing.meterEvents.create({
      meter: meterId,
      value: credits,
      timestamp: Math.floor(Date.now() / 1000),
      customer: customerId,
      metadata: {
        grant_reason: grantReason,
      },
    });
    console.log(`Granted ${credits} credits to customer ${customerId}`);
  } catch (error) {
    console.error(
      `Error granting credits to customer ${customerId}:`,
      error.message
    );
  }
}

async function testGrant(customerId, credits) {
  if (!customerId || !credits) {
    console.error('Usage: node stripe-setup.js test-grant <customer_id> <credits>');
    return;
  }
  console.log(`Granting ${credits} test credits to customer ${customerId}...`);
  await grantCredits(customerId, parseInt(credits, 10), 'test_grant');
}

const command = process.argv[2];
const args = process.argv.slice(3);

switch (command) {
  case 'setup':
    setup();
    break;
  case 'full-setup':
    fullSetup();
    break;
  case 'test-grant':
    testGrant(...args);
    break;
  default:
    console.log('Usage: node stripe-setup.js <command>');
    console.log('Commands: setup, full-setup, test-grant');
}
