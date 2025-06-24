import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    return redirect("/lessons")
  }

  const resolvedParams = await searchParams
  const { classCode } = await params
  const message = resolvedParams.message as string | undefined

  return (
    <InvitationLogin 
      classCode={classCode}
      initialMessage={message}
    />
  )
}