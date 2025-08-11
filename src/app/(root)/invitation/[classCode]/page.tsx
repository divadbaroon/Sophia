import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { enrollInClass } from "@/lib/actions/class-actions"
import InvitationLogin from "./InvitiationPage"

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function InvitationPage({
  searchParams,
  params,
}: {
  searchParams: SearchParams
  params: Promise<{ classCode: string }>
}) {
  const supabase = await createClient()
  const { classCode } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    // User is already signed in - enroll them and redirect
    try {
      console.log(`Enrolling existing user in ${classCode}`)
      const result = await enrollInClass(classCode)
      
      if (result.success) {
        console.log(`✅ Successfully enrolled in ${classCode}`)
      } else {
        console.log(`⚠️ Enrollment result: ${result.error || 'Already enrolled'}`)
      }
    } catch (error) {
      console.error('❌ Error enrolling user:', error)
    }
    
    return redirect("/classes")
  }

  const resolvedParams = await searchParams
  const message = resolvedParams.message as string | undefined

  return (
    <InvitationLogin 
      classCode={classCode}
      initialMessage={message}
    />
  )
}