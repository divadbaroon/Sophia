"use client"

import { Skeleton } from "@/components/ui/skeleton"

import SessionCard from "@/components/dashboard/SessionCard"
import SearchHeader from "@/components/dashboard/utils/SearchHeader"

import { PastfilterOptions } from "@/lib/data/sample_queue_data"

import { PastSessionsProps } from "@/types"

export default function PastSessions({ sessions, isLoading }: PastSessionsProps) {
  return (
    <>
      <SearchHeader
        title="Past Sessions"
        description="Review your previous office hours and feedback"
        showNewButton={false}
        filterOptions={PastfilterOptions}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          [...Array(6)].map((_, index) => (
            <div key={index} className="space-y-4">
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))
        ) : sessions.length === 0 ? (
          <div className="col-span-3 text-center py-12">
            <p className="text-gray-500">No past sessions found</p>
          </div>
        ) : (
          sessions.map((session) => (
            <SessionCard
              key={session.id}
              type="past"
              data={session}
            />
          ))
        )}
      </div>
    </>
  )
}