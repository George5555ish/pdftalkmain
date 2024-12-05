import { stripe } from '@/lib/stripe'
import { headers } from 'next/headers'
import type Stripe from 'stripe'
import connectToDatabase from '@/db';

export async function POST(request: Request) {
    console.log('the stripe webhook was called at least')
    const body = await request.text()
    const signature = headers().get('Stripe-Signature') ?? ''


    const {db} = await connectToDatabase()
    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET || ''
        )
    } catch (err) {
        return new Response(
            `Webhook Error: ${err instanceof Error ? err.message : 'Unknown Error'
            }`,
            { status: 400 }
        )
    }

    const session = event.data
        .object as Stripe.Checkout.Session

    if (!session?.metadata?.userId) {
        return new Response(null, {
            status: 200,
        })
    }

    if (event.type === 'checkout.session.completed') {
        
    console.log('checkout event type handled')
        const subscription =
            await stripe.subscriptions.retrieve(
                session.subscription as string
            )
            await db.collection('users').updateOne(
                { kinde_id: session.metadata.userId, }, // Filter
                { $set: {
                    stripeSubscriptionId: subscription.id,
                    stripeCustomerId: subscription.customer as string,
                    stripePriceId: subscription.items.data[0]?.price.id,
                    stripeCurrentPeriodEnd: new Date(
                        subscription.current_period_end * 1000
                    ),
                }, }  
              );
        // await User.updateOne(
        //     {
        //         kinde_id: session.metadata.userId,
        //     },
        //     {
        //         stripeSubscriptionId: subscription.id,
        //         stripeCustomerId: subscription.customer as string,
        //         stripePriceId: subscription.items.data[0]?.price.id,
        //         stripeCurrentPeriodEnd: new Date(
        //             subscription.current_period_end * 1000
        //         ),
        //     },
        // )
    }

    if (event.type === 'invoice.payment_succeeded') {
        // Retrieve the subscription details from Stripe.
        console.log('invoice event type handled')
        const subscription =
            await stripe.subscriptions.retrieve(
                session.subscription as string
            )
            await db.collection('users').updateOne(
                { stripeSubscriptionId: subscription.id, }, // Filter
                { $set:  {
                    stripePriceId: subscription.items.data[0]?.price.id,
                    stripeCurrentPeriodEnd: new Date(
                        subscription.current_period_end * 1000
                    ),
                }, }  
              );
       
    }

    return new Response(null, { status: 200 })
}