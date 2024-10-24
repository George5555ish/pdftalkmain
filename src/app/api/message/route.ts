import File from '@/db/File.model'
import Message from '@/db/Message.model'
import { openai } from '@/lib/openai'
// import { getPineconeClient } from '@/lib/pinecone'
import { SendMessageValidator } from '@/lib/validators/SendMessageValidator'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { OpenAIEmbeddings } from '@langchain/openai'
import { getPineconeClient } from '@/lib/pinecone'
import { PineconeStore } from '@langchain/pinecone'
import { NextRequest } from 'next/server'

import { OpenAIStream, StreamingTextResponse } from 'ai'
import { streamText } from 'ai';
export const POST = async (req: NextRequest) => {
  // endpoint for asking a question to a pdf file

  const body = await req.json()

  const { getUser } = getKindeServerSession()
  const user = await getUser()

  const { id: userId } = user

  console.log('user')
  console.log(user)

  if (!userId)
    return new Response('Unauthorized', { status: 401 })

  const { fileId, message } =
    SendMessageValidator.parse(body)

  const file = await File.findOne({

    _id: fileId,
    userId,

  })

  if (!file)
    return new Response('Not found', { status: 404 })

  await Message.create({
    text: message,
    isUserMessage: true,
    userId,
    fileId, // _id for file model
  })
  //TODO: Try and check if the file in the db is vectorized, 
  // because if it isn't, it will fail to send the vectorized messaged to open ai

  // 1: vectorize message
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  })

  const pinecone = await getPineconeClient()
  const pineconeIndex = pinecone.Index('pdftalk') as any;

  const vectorStore = await PineconeStore.fromExistingIndex(
    embeddings,
    {
      pineconeIndex,
      namespace: file._id,
    }
  )

  const results = await vectorStore.similaritySearch(
    message,
    4
  )

  const prevMessages = await Message.find({ _id: fileId })
    .sort({ createdAt: 1 })   // Sort by createdAt in ascending order
    .limit(5);


  const formattedPrevMessages = prevMessages.map((msg) => ({
    role: msg.isUserMessage
      ? ('user' as const)
      : ('assistant' as const),
    content: msg.text,
  }))

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    stream: true,
    messages: [
      {
        role: 'system',
        content:
          'Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format.',
      },
      {
        role: 'user',
        content: `Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format. \nIf you don't know the answer, just say that you don't know, don't try to make up an answer.
        
  \n----------------\n
  
  PREVIOUS CONVERSATION:
  ${formattedPrevMessages.map((message) => {
          if (message.role === 'user')
            return `User: ${message.content}\n`
          return `Assistant: ${message.content}\n`
        })}
  
  \n----------------\n
  
  CONTEXT:
  ${results.map((r) => r.pageContent).join('\n\n')}
  
  USER INPUT: ${message}`,
      },
    ],
  })

  // const mainStream = response.body;
  // const { textStream } = await streamText({
  //   model: StreamOpenAI('gpt-4o-mini'), 
  //   messages:response,

  // });
  const stream = OpenAIStream(response, {
    async onCompletion(completion) {
      await Message.create({
        text: completion,
        isUserMessage: false,
        fileId,
        userId,
      },)
    },
  })

  return new StreamingTextResponse(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8', // Ensure it’s plain text
      'Transfer-Encoding': 'chunked',               // Stream chunks
      'Cache-Control': 'no-cache',
    }
  })
}