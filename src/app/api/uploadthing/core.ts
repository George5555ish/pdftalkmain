import File from '@/db/File.model'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import {
  createUploadthing,
  type FileRouter,
} from 'uploadthing/next'

// import { PDFLoader } from 'langchain/document_loaders/fs/pdf'
// import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
// import { PineconeStore } from 'langchain/vectorstores/pinecone'
// import { getPineconeClient } from '@/lib/pinecone'
// import { getUserSubscriptionPlan } from '@/lib/stripe'
// import { PLANS } from '@/config/stripe'

const f = createUploadthing()

const middleware = async () => {
  const { getUser } = getKindeServerSession()
  const user = await getUser()

  if (!user || !user.id) throw new Error('Unauthorized')

  //   const subscriptionPlan = await getUserSubscriptionPlan()
  const subscriptionPlan = { isSubscribed: false }
  console.log('validated')
  return { subscriptionPlan, userId: user.id }
}

const onUploadComplete = async ({
  metadata,
  file,
}: {
  metadata: Awaited<ReturnType<typeof middleware>>
  file: {
    key: string
    name: string
    url: string
  }
}) => {
  const isFileExist = await File.findOne({
    key: file.key,
  })

  console.log('isFileExist')
  console.log(isFileExist)

  if (isFileExist) return

  await File.create({
    key: file.key,
    name: file.name,
    userId: metadata.userId,
    // url: `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`,
    url: file.url,
    uploadStatus: 'PROCESSING',
  })

  try {
    const response = await fetch(
      `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`
    )

    const blob = await response.blob()

    // const loader = new PDFLoader(blob)

    // const pageLevelDocs = await loader.load()

    // const pagesAmt = pageLevelDocs.length

    const { subscriptionPlan } = metadata
    const { isSubscribed } = subscriptionPlan

    // const isProExceeded =
    //   pagesAmt >
    //   PLANS.find((plan) => plan.name === 'Pro')!.pagesPerPdf
    // const isFreeExceeded =
    //   pagesAmt >
    //   PLANS.find((plan) => plan.name === 'Free')!
    //     .pagesPerPdf

    // if (
    //   (isSubscribed && isProExceeded) ||
    //   (!isSubscribed && isFreeExceeded)
    // ) {
    // await File.updateOne({ 
    //     uploadStatus: 'FAILED',
    //   },
    //    {
    //     id: createdFile.id,
    //   } )
    // }

    // vectorize and index entire document
    // const pinecone = await getPineconeClient()
    // const pineconeIndex = pinecone.Index('quill')

    // const embeddings = new OpenAIEmbeddings({
    //   openAIApiKey: process.env.OPENAI_API_KEY,
    // })

    // await PineconeStore.fromDocuments(
    //   pageLevelDocs,
    //   embeddings,
    //   {
    //     pineconeIndex,
    //     namespace: createdFile.id,
    //   }
    // )

    await File.findOneAndUpdate({
      key: file.key,
    }, {
      uploadStatus: 'SUCCESS',
    }, { new: true })
  } catch (err) {
    await File.findOneAndUpdate({
      key: file.key,
    }, {
      uploadStatus: 'FAILED',
    }, { new: true })
  }
}

export const ourFileRouter = {
  freePlanUploader: f({ pdf: { maxFileSize: '4MB' } })
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
  proPlanUploader: f({ pdf: { maxFileSize: '16MB' } })
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter