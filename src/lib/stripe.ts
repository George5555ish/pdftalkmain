import { PLANS } from '@/config/stripe'
import User from '@/db/User.model'
import { trpcDbUtils } from '@/trpc/utils'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2024-09-30.acacia',
  typescript: true,
})

export async function getUserSubscriptionPlan() {
  const { getUser } = getKindeServerSession()
  const user = await getUser()
console.log('user from get user sub function'+ new Date())
console.log(user)
if (!user) {
  return {
    ...PLANS[0],
    isSubscribed: false,
    isCanceled: false,
    stripeCurrentPeriodEnd: null,
  }
}
  if (!user.id) {
    return {
      ...PLANS[0],
      isSubscribed: false,
      isCanceled: false,
      stripeCurrentPeriodEnd: null,
    }
  }

  const dbUser = await trpcDbUtils.findOneUser(user.id)

  console.log('dbUser from get user sub')
  console.log(dbUser)
  if (!dbUser) {
    return {
      ...PLANS[0],
      isSubscribed: false,
      isCanceled: false,
      stripeCurrentPeriodEnd: null,
    }
  }

  const isSubscribed = Boolean(
    dbUser.stripePriceId &&
      dbUser.stripeCurrentPeriodEnd && // 86400000 = 1 day
      dbUser.stripeCurrentPeriodEnd.getTime() + 86_400_000 > Date.now()
  )
console.log('isSubscribed')
console.log(isSubscribed)
  const plan = isSubscribed
    ? PLANS.find((plan) => plan.price.priceIds.test === dbUser.stripePriceId)
    : null

  let isCanceled = false
  if (isSubscribed && dbUser.stripeSubscriptionId) {
    const stripePlan = await stripe.subscriptions.retrieve(
      dbUser.stripeSubscriptionId
    )
    isCanceled = stripePlan.cancel_at_period_end
  }

  return {
    ...plan,
    stripeSubscriptionId: dbUser.stripeSubscriptionId,
    stripeCurrentPeriodEnd: dbUser.stripeCurrentPeriodEnd,
    stripeCustomerId: dbUser.stripeCustomerId,
    isSubscribed,
    isCanceled,
  }
}