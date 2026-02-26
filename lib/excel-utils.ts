import { EventType, MemberStatus } from "@prisma/client";

export interface ParsedAttendanceRecord {
    tempName: string;
    isPresent: boolean;
    status: MemberStatus;
}

export interface ParsedAttendanceSession {
    groupId: string;
    groupName: string;
    type: EventType;
    date: Date;
    notes: string;
    records: ParsedAttendanceRecord[];
}

export interface ParsedMember {
    name: string;
    status: MemberStatus;
    groupId: string;
    groupName: string;
}

export function parseGroupAttendanceExcel(
    data: Record<string, any[][]>,
    initialGroups: { id: string, name: string }[]
): { sessions: ParsedAttendanceSession[], members: ParsedMember[] } {
    const sessions: ParsedAttendanceSession[] = [];
    const membersMap = new Map<string, ParsedMember>();

    const monthMap: Record<string, number> = {
        jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7, sep: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11
    };

    const statusMap: Record<string, MemberStatus> = {
        'leader': 'LEADER' as MemberStatus,
        'leaders': 'LEADER' as MemberStatus,
        'intense': 'INTENSE' as MemberStatus,
        'consistent': 'CONSISTENT' as MemberStatus,
        'semi-consistent': 'SEMI_CONSISTENT' as MemberStatus,
        'inconsistent': 'INCONSISTENT' as MemberStatus,
        'unstable': 'INCONSISTENT' as MemberStatus,
        'first timer': 'FIRST_TIMER' as MemberStatus,
        'first timers': 'FIRST_TIMER' as MemberStatus,
        'preliminary': 'PRELIMINARY' as MemberStatus
    };

    Object.entries(data).forEach(([sheetName, rows]) => {
        // More lenient sheet detection:
        // Try to match the sheet name to a group name directly or after removing year/group keywords
        const normalizedSheet = sheetName.toLowerCase();

        // Extract Year from sheet name
        const yearMatch = sheetName.match(/\b(20\d{2})\b/);
        const targetYear = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();

        const cleanSheetName = normalizedSheet
            .replace(/group/i, "")
            .replace(/attendance/i, "")
            .replace(/\b20\d{2}\b/g, "")
            .trim();

        if (!cleanSheetName) return;

        const group = initialGroups.find(g => {
            const normalizedGroupName = g.name.toLowerCase();
            return normalizedSheet.includes(normalizedGroupName) ||
                normalizedGroupName.includes(cleanSheetName) ||
                cleanSheetName.includes(normalizedGroupName);
        });

        if (!group) return;

        const monthRow = rows[0] || [];
        const weekRow = rows[2] || [];

        const validCols: { colIndex: number, date: Date, label: string }[] = [];
        let currentMonthStr = "";

        for (let c = 2; c < Math.min(weekRow.length, 100); c++) {
            const monthCell = monthRow[c]?.toString().trim().toLowerCase();
            if (monthCell && monthCell.length > 2) {
                currentMonthStr = monthCell.replace(/[^a-z]/g, '');
            }

            const weekHeader = weekRow[c]?.toString().trim();
            if (!weekHeader?.toLowerCase().startsWith("week")) continue;

            const currentMonthIndex = monthMap[currentMonthStr.substring(0, 3)] ?? monthMap[currentMonthStr];
            if (currentMonthIndex === undefined) continue;

            const weekNum = parseInt(weekHeader.replace(/\D/g, ""), 10);
            if (isNaN(weekNum)) continue;

            // Calculate Xth Saturday of the month
            let d = new Date(targetYear, currentMonthIndex, 1);
            while (d.getDay() !== 6) d.setDate(d.getDate() + 1);
            d.setDate(d.getDate() + (weekNum - 1) * 7);

            validCols.push({
                colIndex: c,
                date: d,
                label: `${currentMonthStr.charAt(0).toUpperCase() + currentMonthStr.slice(1)} - Week ${weekNum}`
            });
        }

        let currentStatus: MemberStatus = MemberStatus.PRELIMINARY;

        for (let r = 4; r < rows.length; r++) {
            const rowVal = rows[r][0]?.toString().trim();
            if (!rowVal) continue;

            const normalizedRow = rowVal.toLowerCase();
            if (statusMap[normalizedRow]) {
                currentStatus = statusMap[normalizedRow];
                continue;
            }

            const memberName = rowVal;
            const memberKey = `${memberName.toLowerCase()}_${group.id}`;

            if (!membersMap.has(memberKey)) {
                membersMap.set(memberKey, {
                    name: memberName,
                    status: currentStatus,
                    groupId: group.id,
                    groupName: group.name
                });
            }

            for (const col of validCols) {
                const cellVal = rows[r][col.colIndex]?.toString().trim().toUpperCase();
                if (cellVal === 'PR') {
                    const sessionKey = `${col.date.toISOString()}_${group.id}`;
                    let session = sessions.find(s => s.groupId === group.id && s.date.getTime() === col.date.getTime());

                    if (!session) {
                        session = {
                            groupId: group.id,
                            groupName: group.name,
                            type: EventType.SATURDAY_FELLOWSHIP,
                            date: col.date,
                            notes: col.label,
                            records: []
                        };
                        sessions.push(session);
                    }

                    session.records.push({
                        tempName: memberName,
                        isPresent: true,
                        status: currentStatus
                    });
                }
            }
        }
    });

    return { sessions, members: Array.from(membersMap.values()) };
}
