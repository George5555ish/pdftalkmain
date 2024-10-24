import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import {
  privateProcedure,
  publicProcedure,
  router,
} from './trpc'
import { TRPCError } from '@trpc/server'
import User from '@/db/User.model'
import File from '@/db/File.model'
import Message from '@/db/Message.model'
import { z } from 'zod' 
import { absoluteUrl } from '@/lib/utils'
import { INFINITE_QUERY_LIMIT } from '@/config/infinite-query'
// import {
//   getUserSubscriptionPlan,
//   stripe,
// } from '@/lib/stripe'
// import { PLANS } from '@/config/stripe'

export const appRouter = router({
  authCallback: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession()
    const user = await getUser()
 
    if (!user.id || !user.email)
      throw new TRPCError({ code: 'UNAUTHORIZED' })

    // check if the user is in the database
    const dbUser = await User.findOne({ 
      kinde_id: user.id 
    })

    if (!dbUser) {
      // create user in db
      //TODO: INVESTIGATE THIS PART IF A USER TRIES TO CREATE NEW USER 
      // OF THE SAME EMAIL, ERROR HANDLING SHOULD BE WORKED ON
      await User.create({
        kinde_id: user.id,
        email: user.email,
        given_name: user.given_name
      })
    }

    return { success: true }
  }),
    getUserFiles: privateProcedure.query(async ({ ctx }) => {
      const { userId } = ctx 
      return await File.find({ 
          userId, 
      })
    }),

    createStripeSession: privateProcedure.mutation(
      async ({ ctx }) => {
        const { userId } = ctx

        const billingUrl = absoluteUrl('/dashboard/billing')

        if (!userId)
          throw new TRPCError({ code: 'UNAUTHORIZED' })

        const dbUser = await User.findOne({ 
            id: userId, 
        })

        if (!dbUser)
          throw new TRPCError({ code: 'UNAUTHORIZED' })

        // const subscriptionPlan =
        //   await getUserSubscriptionPlan()

        // if (
        //   subscriptionPlan.isSubscribed &&
        //   dbUser.stripeCustomerId
        // ) {
        //   const stripeSession =
        //     await stripe.billingPortal.sessions.create({
        //       customer: dbUser.stripeCustomerId,
        //       return_url: billingUrl,
        //     })

        //   return { url: stripeSession.url }
        // }

        // const stripeSession =
        //   await stripe.checkout.sessions.create({
        //     success_url: billingUrl,
        //     cancel_url: billingUrl,
        //     payment_method_types: ['card', 'paypal'],
        //     mode: 'subscription',
        //     billing_address_collection: 'auto',
        //     line_items: [
        //       {
        //         price: PLANS.find(
        //           (plan) => plan.name === 'Pro'
        //         )?.price.priceIds.test,
        //         quantity: 1,
        //       },
        //     ],
        //     metadata: {
        //       userId: userId,
        //     },
        //   })

        // return { url: stripeSession.url }
      }
    ),

    getFileMessages: privateProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
        fileId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { userId } = ctx
      const { fileId, cursor } = input
      const limit = input.limit ?? INFINITE_QUERY_LIMIT

      const file = await File.findOne({ 
          _id: fileId,
          userId, 
      })

      if (!file) throw new TRPCError({ code: 'NOT_FOUND' })

      const messages = await Message.find({
        take: limit + 1,
        where: {
          fileId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        cursor: cursor ? { id: cursor } : undefined,
        select: {
          id: true,
          isUserMessage: true,
          createdAt: true,
          text: true,
        },
      })

      let nextCursor: typeof cursor | undefined = undefined
      if (messages.length > limit) {
        const nextItem = messages.pop()
        nextCursor = nextItem?.id
      }

      return {
        messages,
        nextCursor,
      }
    }),

    getFileUploadStatus: privateProcedure
      .input(z.object({ fileId: z.string() }))
      .query(async ({ input, ctx }) => {
        const file = await File.findOne({ 
            id: input.fileId,
            userId: ctx.userId, 
        })

        if (!file) return { status: 'PENDING' as const }

        return { status: file.uploadStatus }
      }),

    getFile: privateProcedure
      .input(z.object({ key: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { userId } = ctx

        const file = await File.findOne({ 
            key: input.key,
            userId, 
        })

        if (!file) throw new TRPCError({ code: 'NOT_FOUND' })

        return file
      }),

    deleteFile: privateProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { userId } = ctx

        const file = await File.findOne({ 
            _id: input.id,
            userId, 
        })

        if (!file) throw new TRPCError({ code: 'NOT_FOUND' })

        await File.deleteOne({ 
          _id: input.id,
        })

        return file
      }),
})

export type AppRouter = typeof appRouter