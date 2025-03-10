import { Student, ActiveSession, UpcomingSession, PastSession } from "@/types"

const CURRENT_TIME = new Date()
const HOUR_IN_MS = 3600000
const DAY_IN_MS = 24 * HOUR_IN_MS

// Sample queue data
export const queueData: Student[] = [
    {
        id: 1,
        name: "David Barron",
        waitTime: "1m",
        conceptGaps: ["Hash Map", "Key-Value Pair Management"],
        status: "In Queue",
        joinedAt: "2024-02-11T14:30:00Z",
        previousVisits: 3,
        course: "CS101-A"
    },
    {
        id: 2,
        name: "Sarah Johnson",
        waitTime: "5m",
        conceptGaps: ["Loop Control", "Array Indexing"],
        status: "In Queue",
        joinedAt: "2024-02-11T14:35:00Z",
        previousVisits: 1,
        course: "CS101-B"
    }
]

// Active session data
export const activeSessionData: ActiveSession[] = [
    {
        id: 1,
        name: "CS101 Office Hours",
        course: {
          id: "cs101",
          name: "Introduction to Programming",
          code: "CS101"
        },
        date: new Date(CURRENT_TIME.getTime() - HOUR_IN_MS).toISOString(),
        time: new Date(CURRENT_TIME.getTime() - HOUR_IN_MS).toLocaleTimeString(),
        duration: 120,
        location: {
          type: "physical",
          details: "Room 301"
        },
        metrics: {
          currentQueue: 5,
          totalHelped: 8,
          averageWaitTime: 12,
          activeTime: 60
        },
        status: "active",
    },
    {
        id: 2,
        name: "Data Structures Help",
        course: {
          id: "cs201",
          name: "Data Structures and Algorithms",
          code: "CS201"
        },
        date: new Date(CURRENT_TIME.getTime() - 30 * 60000).toISOString(),
        time: new Date(CURRENT_TIME.getTime() - 30 * 60000).toLocaleTimeString(),
        duration: 120,
        location: {
          type: "virtual",
          details: "https://zoom.us/j/123456789"
        },
        metrics: {
          currentQueue: 7,
          totalHelped: 4,
          averageWaitTime: 15,
          activeTime: 30
        },
        status: "active",
    },
    {
        id: 3,
        name: "Algorithms Help",
        course: {
          id: "cs301",
          name: "Advanced Algorithms",
          code: "CS301"
        },
        date: new Date(CURRENT_TIME.getTime() - 15 * 60000).toISOString(),
        time: new Date(CURRENT_TIME.getTime() - 15 * 60000).toLocaleTimeString(),
        duration: 90,
        location: {
          type: "hybrid",
          details: "Room 204 + Zoom (Link in Description)"
        },
        metrics: {
          currentQueue: 3,
          totalHelped: 2,
          averageWaitTime: 8,
          activeTime: 15
        },
        status: "active",
    }
]


// Upcoming session data with discussion details
export const upcomingSessionData: UpcomingSession[] = [
    {
        id: 1,
        name: "Data Structures Review",
        course: {
            id: "cs201",
            name: "Data Structures and Algorithms",
            code: "CS201"
        },
        date: new Date(CURRENT_TIME.getTime() + 2 * DAY_IN_MS).toISOString(),
        time: "14:00",
        duration: 90,
        location: {
            type: "hybrid",
            details: "Room 301 / Zoom"
        },
        status: "upcoming",
        expectedAttendees: 25,
        description: "Review session covering binary trees and graph algorithms",
        recurring: {
            frequency: "weekly",
            endDate: new Date(CURRENT_TIME.getTime() + 30 * DAY_IN_MS).toISOString()
        },
        discussion: {
            topics: ["Binary Trees", "Graph Traversal", "Balancing Trees"],
            prerequisites: ["Basic tree concepts", "Graph basics"],
            materials: ["Lecture slides", "Practice problems"],
            preparation: "Review Chapters 5-7 in the textbook"
        }
    },
    {
        id: 2,
        name: "Midterm Review",
        course: {
            id: "cs101",
            name: "Introduction to Programming",
            code: "CS101"
        },
        date: new Date(CURRENT_TIME.getTime() + 3 * DAY_IN_MS).toISOString(),
        time: "15:30",
        duration: 120,
        location: {
            type: "virtual",
            details: "https://zoom.us/j/123456789"
        },
        status: "upcoming",
        expectedAttendees: 40,
        description: "Comprehensive review session for the midterm exam",
        discussion: {
            topics: ["Variables & Types", "Control Flow", "Functions", "Basic Data Structures"],
            prerequisites: ["All homework up to Week 6"],
            materials: ["Practice exam", "Review sheet"],
            preparation: "Complete practice problems set"
        }
    }
]

// Past session data with detailed metrics
export const pastSessionData: PastSession[] = [
    {
        id: 1,
        name: "Algorithm Design Review",
        course: {
            id: "cs301",
            name: "Advanced Algorithms",
            code: "CS301"
        },
        status: "past",
        date: new Date(CURRENT_TIME.getTime() - 2 * DAY_IN_MS).toISOString(),
        time: new Date(CURRENT_TIME.getTime() - 2 * DAY_IN_MS).toLocaleTimeString(),
        duration: 90,
        location: {
            type: "physical",
            details: "Room 205"
        },
        metrics: {
            studentsHelped: 15,
            averageWaitTime: 12,
            peakQueueSize: 8,
            totalDuration: 95,
            actualStartTime: new Date(CURRENT_TIME.getTime() - 2 * DAY_IN_MS).toISOString(),
            actualEndTime: new Date(CURRENT_TIME.getTime() - 2 * DAY_IN_MS + 95 * 60000).toISOString(),
            topicsCovered: ["Dynamic Programming", "Greedy Algorithms"],
            commonIssues: ["DP state design", "Optimal substructure identification"],
            conceptualBreakthroughs: 4,
            studentSatisfaction: 4.5
        },
        feedback: {
            averageRating: 4.5,
            responses: 12,
            comments: [
                "Very helpful session!",
                "Clear explanations of complex topics",
                "Great examples of real-world applications"
            ],
            improvements: [
                "More practice problems",
                "Longer session time"
            ]
        }
    },
    {
        id: 2,
        name: "Web Development Help",
        course: {
            id: "cs401",
            name: "Web Development",
            code: "CS401"
        },
        status: "past",
        date: new Date(CURRENT_TIME.getTime() - 3 * DAY_IN_MS).toISOString(),
        time: new Date(CURRENT_TIME.getTime() - 3 * DAY_IN_MS).toLocaleTimeString(),
        duration: 120,
        location: {
            type: "virtual",
            details: "Zoom"
        },
        metrics: {
            studentsHelped: 10,
            averageWaitTime: 8,
            peakQueueSize: 5,
            totalDuration: 115,
            actualStartTime: new Date(CURRENT_TIME.getTime() - 3 * DAY_IN_MS).toISOString(),
            actualEndTime: new Date(CURRENT_TIME.getTime() - 3 * DAY_IN_MS + 115 * 60000).toISOString(),
            topicsCovered: ["React Components", "State Management", "API Integration"],
            commonIssues: ["Component lifecycle", "State updates"],
            conceptualBreakthroughs: 3,
            studentSatisfaction: 4.8
        },
        feedback: {
            averageRating: 4.8,
            responses: 8,
            comments: [
                "Great debugging session!",
                "Helped me understand React better",
            ],
            improvements: [
                "More code examples",
                "Follow-up resources"
            ]
        }
    }
]

export const filterOptions = [
{ value: "all", label: "All Sessions" },
{ value: "physical", label: "In-Person Only" },
{ value: "virtual", label: "Virtual Only" },
{ value: "hybrid", label: "Hybrid Sessions" }
]

export const PastfilterOptions = [
{ value: "all", label: "All Sessions" },
{ value: "high-attendance", label: "High Attendance" },
{ value: "long-duration", label: "Long Duration" },
{ value: "physical", label: "In-Person Only" },
{ value: "virtual", label: "Virtual Only" },
{ value: "hybrid", label: "Hybrid Sessions" },
{ value: "high-rated", label: "Highly Rated" }
]

export const UpcomingfilterOptions = [
{ value: "all", label: "All Sessions" },
{ value: "this-week", label: "This Week" },
{ value: "next-week", label: "Next Week" },
{ value: "physical", label: "In-Person Only" },
{ value: "virtual", label: "Virtual Only" },
{ value: "hybrid", label: "Hybrid Sessions" },
{ value: "recurring", label: "Recurring Only" }
]