"use client"

import { Skeleton } from "@/components/ui/skeleton"

import SessionCard from "@/components/dashboard/SessionCard"
import SearchHeader from "@/components/dashboard/utils/SearchHeader"

import { ActiveSessionsProps } from "@/types"

import { filterOptions } from "@/lib/data/sample_queue_data"

export default function ActiveSessions({ 
  sessions, 
  isLoading,
  onNewClick 
}: ActiveSessionsProps) {
  return (
    <>
      <SearchHeader
        title="Active Sessions"
        description="Monitor and manage your ongoing office hours"
        showNewButton={true}
        onNewClick={onNewClick} 
        filterOptions={filterOptions}
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
            <p className="text-gray-500">No active sessions found</p>
          </div>
        ) : (
          sessions.map((session) => (
            <SessionCard
              key={session.id}
              type="active"
              data={session}
            />
          ))
        )}
      </div>
    </>
  )
}