"use client"

import SessionCard from "@/components/dashboard/SessionCard"
import SearchHeader from "@/components/dashboard/utils/SearchHeader"
import { Skeleton } from "@/components/ui/skeleton"

import { UpcomingfilterOptions } from "@/lib/data/sample_queue_data"

import { UpcomingSessionsProps } from "@/types"

export default function UpcomingSessions({ 
  sessions, 
  isLoading,
  onUpdate,
  onNewClick 
}: UpcomingSessionsProps) {
  const handleUpdateSession = () => {
    onUpdate()
  }

  return (
    <>
      <SearchHeader
        title="Upcoming Sessions"
        description="View and manage your scheduled office hours"
        showNewButton={true}
        onNewClick={onNewClick}
        filterOptions={UpcomingfilterOptions}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          [...Array(3)].map((_, index) => (
            <div key={index} className="space-y-4">
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))
        ) : sessions.length === 0 ? (
          <div className="col-span-3 text-center py-12">
            <p className="text-gray-500">No upcoming sessions found</p>
          </div>
        ) : (
          sessions.map((session) => (
            <SessionCard
              key={session.id}
              type="upcoming"
              data={session}
              onUpdate={{
                upcoming: handleUpdateSession
              }}
            />
          ))
        )}
      </div>
    </>
  )
}