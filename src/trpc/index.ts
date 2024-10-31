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
import { utapi } from '@/app/api/uploadthing/utapi'
import {
  getUserSubscriptionPlan,
  stripe,
} from '@/lib/stripe'
import { PLANS } from '@/config/stripe'
import connectToDatabase from '@/db'
// import { PLANS } from '@/config/stripe'
import { trpcDbUtils } from './utils'
import { ObjectId } from 'mongodb'
export const appRouter = router({
  authCallback: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession()
    const user = await getUser()
    const { db } = await connectToDatabase()
    if (!user.id || !user.email)
      throw new TRPCError({ code: 'UNAUTHORIZED' })

    // check if the user is in the database
    const dbUser = await trpcDbUtils.findOneUser( user.id)

    if (!dbUser) {
      // create user in db
      //TODO: INVESTIGATE THIS PART IF A USER TRIES TO CREATE NEW USER 
      // OF THE SAME EMAIL, ERROR HANDLING SHOULD BE WORKED ON
      await trpcDbUtils.createOneUser( {
        kinde_id: user.id,
        email: user.email,
        given_name: user.given_name
      })
    }

    return { success: true }
  }),
  getUserFiles: privateProcedure.query(async ({ ctx }) => {
    const { userId } = ctx //kinde id is here, not _id

    const { db } = await connectToDatabase()
    return await trpcDbUtils.findAllFiles()
  }),


  createStripeSession: privateProcedure.mutation(
    async ({ ctx }) => {
      const { userId } = ctx
      const { db } = await connectToDatabase()
      const billingUrl = absoluteUrl('/dashboard/billing')

      if (!userId)
        throw new TRPCError({ code: 'UNAUTHORIZED' })

      const dbUser = await trpcDbUtils.findOneUser( userId)

      if (!dbUser)
        throw new TRPCError({ code: 'UNAUTHORIZED' })

      const subscriptionPlan =
        await getUserSubscriptionPlan()

      if (
        subscriptionPlan.isSubscribed &&
        dbUser.stripeCustomerId
      ) {
        const stripeSession =
          await stripe.billingPortal.sessions.create({
            customer: dbUser.stripeCustomerId,
            return_url: billingUrl,
          })

        return { url: stripeSession.url }
      }

      const stripeSession =
        await stripe.checkout.sessions.create({
          success_url: billingUrl,
          cancel_url: billingUrl,
          payment_method_types: ['card', 'paypal', 'samsung_pay', 'revolut_pay'],
          mode: 'subscription',
          billing_address_collection: 'auto',
          line_items: [
            {
              price: PLANS.find(
                (plan) => plan.name === 'Pro'
              )?.price.priceIds.test,
              quantity: 1,
            },
          ],
          metadata: {
            userId: userId,
          },
        })

      return { url: stripeSession.url }
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
      const { db } = await connectToDatabase()
      const messages = await trpcDbUtils.findAndSortAndLimit( fileId, limit)

      let nextCursor: typeof cursor | undefined = undefined
      if (messages.length > limit) {
        const nextItem = messages.pop()
        nextCursor = nextItem?._id.toString()
      }

      return {
        messages,
        nextCursor,
      }
    }),

  getFileUploadStatus: privateProcedure
    .input(z.object({ fileId: z.string() }))
    .query(async ({ input, ctx }) => {
      const { db } = await connectToDatabase()
      const file = await trpcDbUtils.findOneFile(
        
        input.fileId,
        ctx.userId,)

      if (!file) return { status: 'PENDING' as const }

      return { status: file.uploadStatus }
    }),

  getFile: privateProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx
      const { db } = await connectToDatabase()
      const file = await trpcDbUtils.findOneFileByKey(
        input.key,
        userId,
      )

      if (!file) throw new TRPCError({ code: 'NOT_FOUND' })

      return file
    }),

  deleteFile: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx
      const { db } = await connectToDatabase()
      const file = await db.collection('files').findOne({
        _id: new ObjectId(input.id),
        userId
      });
      if (!file) throw new TRPCError({ code: 'NOT_FOUND' })

      await trpcDbUtils.deleteOneFile(
         input.id)
      await utapi.deleteFiles(input.id);

      return file
    }),
})

export type AppRouter = typeof appRouter