import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { JoinClient } from "./join-client"

export const dynamic = 'force-dynamic'

interface JoinPageProps {
    params: Promise<{ sessionId: string }>
}

export default async function JoinPage({ params }: JoinPageProps) {
    const { sessionId } = await params

    if (!sessionId) notFound()

    // Fetch session details
    const session = await db.attendanceSession.findUnique({
        where: { id: sessionId },
        include: {
            branch: {
                select: { name: true }
            },
            group: {
                select: { name: true }
            },
            records: {
                select: { memberId: true }
            }
        }
    })

    if (!session) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
                <div className="bg-destructive/10 p-4 rounded-full mb-6">
                    <svg className="h-12 w-12 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold">Session Not Found</h1>
                <p className="text-muted-foreground mt-2">The link you're using might be expired or incorrect.</p>
                <a href="/" className="mt-6 text-primary hover:underline font-medium">Return to Home</a>
            </div>
        )
    }

    if (!session.isActive) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
                <h1 className="text-2xl font-bold">Session Closed</h1>
                <p className="text-muted-foreground mt-2">Check-in for this session is no longer available.</p>
            </div>
        )
    }

    // Fetch all members in this group to display in the list
    // If no group is explicitly linked to session, we fallback to branch members or show empty?
    // Actually, sessions usually have a group or a CBS location.

    interface Member {
        id: string
        name: string
    }

    let members: Member[] = []

    if (session.groupId) {
        members = await db.member.findMany({
            where: { groupId: session.groupId },
            select: { id: true, name: true }
        })
    } else if (session.branchId) {
        members = await db.member.findMany({
            where: { branchId: session.branchId },
            select: { id: true, name: true },
            take: 100 // Limit if it's a huge branch
        })
    }

    // Map checked-in status
    const presentMemberIds = new Set(session.records.map(r => r.memberId))
    const formattedMembers = members.map(m => ({
        ...m,
        isPresent: presentMemberIds.has(m.id)
    }))

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex flex-col items-center justify-center p-4">
            <JoinClient
                sessionId={sessionId}
                sessionType={session.type}
                branchName={session.branch.name}
                groupName={session.group?.name || "Branch Event"}
                members={formattedMembers}
            />
        </div>
    )
}
