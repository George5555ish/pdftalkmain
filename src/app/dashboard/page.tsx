import React from 'react'
import {
  // LoginLink,
  // RegisterLink,
  getKindeServerSession,
} from '@kinde-oss/kinde-auth-nextjs/server'
import User from "@/db/User.model"
import { redirect } from 'next/navigation'
import DashboardComponent from '@/components/Dashboard'
import { getUserSubscriptionPlan } from '@/lib/stripe'
async function Dashboard() {
  const { getUser } = getKindeServerSession()
  const user = await getUser()
  if (!user || !user.id) redirect('/auth-callback?origin=dashboard')

  const dbUser = await User.findOne({ 
    kinde_id: user.id 
  })

  if (!dbUser) redirect('/auth-callback?origin=dashboard')

  const subscriptionPlan = await getUserSubscriptionPlan()
  return (
    <DashboardComponent user={user} subscriptionPlan={ subscriptionPlan} />
  )
}

export default Dashboard