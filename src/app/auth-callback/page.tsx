"use client"

import { useRouter, useSearchParams } from 'next/navigation'
// import { trpc } from '../_trpc/client'
import { Loader2 } from 'lucide-react'
import { trpc } from '../_trpc/client'
import { Suspense, useEffect } from 'react'

const Page = () => {
  const router = useRouter()

  const searchParams = useSearchParams()
  const origin = searchParams.get('origin')
  const { data, isLoading, error } = trpc.authCallback.useQuery(undefined, {
    retry: true,
    retryDelay: 500,
})

useEffect(() => {
  if (data) {
      const { success } = data
      if (success) {
          // user is synced to db
          console.log('Data fetched successfully:', data);
          console.log('isLoading',isLoading)
          router.push(origin ? `/${origin}` : '/dashboard')
      }
  }
  else if (error) {
      if (error.data?.code === 'UNAUTHORIZED') {
          router.push('/sign-in')
      } 
      
  }  
}, [data, origin, error]);

  return (
    <div className='w-full mt-24 flex justify-center'>
      <div className='flex flex-col items-center gap-2'>
        <Loader2 className='h-8 w-8 animate-spin text-zinc-800' />
        <h3 className='font-semibold text-xl'>
          Setting up your account...
        </h3>
        <p>You will be redirected automatically.</p>
      </div>
    </div>
  )
}

const AuthCallbackPage = () => {
  return (
    <Suspense>
        <Page />
    </Suspense>
)
}

export default AuthCallbackPage