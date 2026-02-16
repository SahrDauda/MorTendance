/**
 * One-time script to delete duplicate attendance records
 * Run with: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/delete-duplicate-attendance.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteDuplicates() {
    console.log('🔍 Finding duplicate attendance records...')

    try {
        // Find all attendance records grouped by session and member
        const allRecords = await prisma.attendanceRecord.findMany({
            include: {
                session: {
                    include: {
                        group: true
                    }
                },
                member: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        })

        console.log(`📊 Total records found: ${allRecords.length}`)

        // Group by sessionId + memberId to find duplicates
        const recordMap = new Map<string, typeof allRecords>()
        
        for (const record of allRecords) {
            const key = `${record.sessionId}_${record.memberId}`
            if (!recordMap.has(key)) {
                recordMap.set(key, [])
            }
            recordMap.get(key)!.push(record)
        }

        // Find duplicates
        const duplicates: Array<{ key: string; records: typeof allRecords }> = []
        for (const [key, records] of recordMap) {
            if (records.length > 1) {
                duplicates.push({ key, records })
            }
        }

        console.log(`⚠️  Found ${duplicates.length} sets of duplicate records`)

        if (duplicates.length === 0) {
            console.log('✅ No duplicates found!')
            return
        }

        // Show duplicates
        for (const dup of duplicates) {
            const [keep, ...toDelete] = dup.records
            console.log(`\n📋 Duplicate found:`)
            console.log(`   Member: ${keep.member.name}`)
            console.log(`   Session: ${keep.session.group?.name || 'N/A'} - ${keep.session.date.toISOString().split('T')[0]}`)
            console.log(`   Keeping: ${keep.id} (created: ${keep.createdAt})`)
            console.log(`   Deleting: ${toDelete.map(r => r.id).join(', ')}`)
        }

        // Delete duplicates (keep the first one, delete the rest)
        let deletedCount = 0
        for (const dup of duplicates) {
            const [, ...toDelete] = dup.records
            const idsToDelete = toDelete.map(r => r.id)
            
            await prisma.attendanceRecord.deleteMany({
                where: {
                    id: { in: idsToDelete }
                }
            })
            deletedCount += idsToDelete.length
        }

        console.log(`\n✅ Deleted ${deletedCount} duplicate records`)

        // Also check for duplicate sessions (same group/date/type)
        console.log('\n🔍 Checking for duplicate sessions...')
        const allSessions = await prisma.attendanceSession.findMany({
            include: {
                records: true,
                group: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        })

        const sessionMap = new Map<string, typeof allSessions>()
        for (const sess of allSessions) {
            const key = `${sess.groupId || 'null'}_${sess.cbsLocationId || 'null'}_${sess.date.toISOString().split('T')[0]}_${sess.type}`
            if (!sessionMap.has(key)) {
                sessionMap.set(key, [])
            }
            sessionMap.get(key)!.push(sess)
        }

        const duplicateSessions: Array<{ key: string; sessions: typeof allSessions }> = []
        for (const [key, sessions] of sessionMap) {
            if (sessions.length > 1) {
                duplicateSessions.push({ key, sessions })
            }
        }

        console.log(`⚠️  Found ${duplicateSessions.length} sets of duplicate sessions`)

        if (duplicateSessions.length > 0) {
            let mergedCount = 0
            for (const dup of duplicateSessions) {
                const [keepSession, ...deleteSessions] = dup.sessions
                console.log(`\n📋 Duplicate session found:`)
                console.log(`   Group: ${keepSession.group?.name || 'N/A'}`)
                console.log(`   Date: ${keepSession.date.toISOString().split('T')[0]}`)
                console.log(`   Type: ${keepSession.type}`)
                console.log(`   Keeping: ${keepSession.id} (${keepSession.records.length} records)`)
                
                for (const deleteSession of deleteSessions) {
                    console.log(`   Merging: ${deleteSession.id} (${deleteSession.records.length} records)`)
                    
                    // Move records to kept session
                    for (const record of deleteSession.records) {
                        // Check if record already exists
                        const exists = keepSession.records.find(r => r.memberId === record.memberId)
                        if (!exists) {
                            await prisma.attendanceRecord.update({
                                where: { id: record.id },
                                data: { sessionId: keepSession.id }
                            })
                        } else {
                            // Delete duplicate record
                            await prisma.attendanceRecord.delete({
                                where: { id: record.id }
                            })
                        }
                    }
                    
                    // Delete duplicate session
                    await prisma.attendanceSession.delete({
                        where: { id: deleteSession.id }
                    })
                    mergedCount++
                }
            }
            console.log(`\n✅ Merged ${mergedCount} duplicate sessions`)
        }

        console.log('\n✨ Cleanup complete!')
    } catch (error) {
        console.error('❌ Error:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

deleteDuplicates()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
