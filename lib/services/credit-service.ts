/* eslint-disable @typescript-eslint/no-explicit-any */
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  teams,
  creditUsageLogs,
  creditGrantsLogs,
  Team,
} from '@/lib/db/schema';
import { stripe } from '@/lib/payments/stripe';
import { InsufficientCreditsError } from '@/lib/utils';

const CREDIT_PLANS: Record<string, { credits: number; name: string }> = {
  price_1PDRpL2M4y2B2g5GS2Z8o42j: { credits: 100, name: 'Basic' },
  price_1PDRpL2M4y2B2g5Gj2W7s8x7: { credits: 500, name: 'Pro' },
  price_1PDRpL2M4y2B2g5Gk8f6h9Y2: { credits: 2000, name: 'Enterprise' },
  price_1PDRpL2M4y2B2g5GZ2x8o42j: { credits: 1200, name: 'Basic (Yearly)' },
  price_1PDRpL2M4y2B2g5GT2W7s8x7: { credits: 6000, name: 'Pro (Yearly)' },
  price_1PDRpL2M4y2B2g5Gh8f6h9Y2: {
    credits: 24000,
    name: 'Enterprise (Yearly)',
  },
};

class CreditService {
  async getCreditBalance(teamId: number) {
    const team = await this.getTeam(teamId);
    return {
      balance: team.creditBalance,
      limit: team.creditLimit,
      usage: team.creditLimit - team.creditBalance,
    };
  }

  async useCredits(
    teamId: number,
    userId: number | null,
    credits: number,
    actionType: string,
    description?: string,
    metadata?: Record<string, any>
  ) {
    const team = await this.getTeam(teamId);

    if (team.creditBalance < credits) {
      throw new InsufficientCreditsError();
    }

    const newBalance = team.creditBalance - credits;

    await db
      .update(teams)
      .set({ creditBalance: newBalance })
      .where(eq(teams.id, teamId));

    await db.insert(creditUsageLogs).values({
      teamId,
      userId,
      creditsUsed: credits,
      actionType,
      description,
      metadata: JSON.stringify(metadata),
    });

    if (team.stripeCustomerId && team.stripeMeterId) {
      try {
        await stripe.billing.meterEvents.create({
          meter: team.stripeMeterId,
          value: credits,
          timestamp: Math.floor(Date.now() / 1000),
          customer: team.stripeCustomerId,
          metadata: {
            team_id: team.id,
            user_id: userId,
            action_type: actionType,
          },
        });
      } catch (error) {
        console.error('Failed to report usage to Stripe:', error);
        // Optional: Implement retry logic or alert system
      }
    }

    return this.getCreditBalance(teamId);
  }

  async grantCreditsForSubscription(
    subscription: any,
    grantReason = 'subscription_payment'
  ) {
    const team = await this.getTeamByStripeCustomerId(subscription.customer);
    if (!team) return;

    const planItem = subscription.items.data.find(
      (item: any) => item.price.recurring
    );
    if (!planItem) return;

    const planId = planItem.price.id;
    const plan = CREDIT_PLANS[planId];
    if (!plan) return;

    const creditsToGrant = plan.credits;
    const billingPeriodStart = new Date(subscription.current_period_start * 1000);
    const billingPeriodEnd = new Date(subscription.current_period_end * 1000);

    const newCreditLimit = creditsToGrant;
    const newCreditBalance = newCreditLimit; // Reset balance to full limit

    await db
      .update(teams)
      .set({
        creditBalance: newCreditBalance,
        creditLimit: newCreditLimit,
        creditsGrantedThisPeriod: creditsToGrant,
        billingPeriodStart,
        billingPeriodEnd,
        stripeMeterId: process.env.STRIPE_CREDIT_METER_ID,
        planName: plan.name,
      })
      .where(eq(teams.id, team.id));

    await db.insert(creditGrantsLogs).values({
      teamId: team.id,
      creditsGranted: creditsToGrant,
      grantReason,
      billingPeriodStart,
      billingPeriodEnd,
      metadata: JSON.stringify({ subscriptionId: subscription.id }),
    });

    return this.getCreditBalance(team.id);
  }

  async resetCreditsForCanceledSubscription(subscription: any) {
    const team = await this.getTeamByStripeCustomerId(subscription.customer);
    if (!team) return;

    await db
      .update(teams)
      .set({
        creditBalance: 0,
        creditLimit: 0,
        creditsGrantedThisPeriod: 0,
        billingPeriodStart: null,
        billingPeriodEnd: null,
      })
      .where(eq(teams.id, team.id));
  }

  async getUsageHistory(teamId: number, limit = 20, offset = 0) {
    return db
      .select()
      .from(creditUsageLogs)
      .where(eq(creditUsageLogs.teamId, teamId))
      .orderBy(creditUsageLogs.createdAt)
      .limit(limit)
      .offset(offset);
  }

  async getGrantsHistory(teamId: number, limit = 20, offset = 0) {
    return db
      .select()
      .from(creditGrantsLogs)
      .where(eq(creditGrantsLogs.teamId, teamId))
      .orderBy(creditGrantsLogs.createdAt)
      .limit(limit)
      .offset(offset);
  }

  private async getTeam(teamId: number): Promise<Team> {
    const results = await db.select().from(teams).where(eq(teams.id, teamId));
    if (results.length === 0) {
      throw new Error(`Team with ID ${teamId} not found`);
    }
    return results[0];
  }

  private async getTeamByStripeCustomerId(
    customerId: string
  ): Promise<Team | null> {
    const results = await db
      .select()
      .from(teams)
      .where(eq(teams.stripeCustomerId, customerId));
    return results[0] || null;
  }
}

export const creditService = new CreditService();
