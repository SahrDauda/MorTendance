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
        'leader': MemberStatus.LEADER,
        'leaders': MemberStatus.LEADER,
        'intense': MemberStatus.INTENSE,
        'consistent': MemberStatus.CONSISTENT,
        'semi-consistent': MemberStatus.SEMI_CONSISTENT,
        'inconsistent': MemberStatus.INCONSISTENT,
        'unstable': MemberStatus.INCONSISTENT,
        'first timer': MemberStatus.FIRST_TIMER,
        'first timers': MemberStatus.FIRST_TIMER,
        'preliminary': MemberStatus.PRELIMINARY
    };

    Object.entries(data).forEach(([sheetName, rows]) => {
        if (!rows || rows.length < 3) return;

        let group: { id: string, name: string } | undefined = undefined;
        let targetYear = new Date().getFullYear();

        // 1. Search for group name and year inside the first 6 rows of the sheet
        for (let i = 0; i < Math.min(rows.length, 6); i++) {
            const row = rows[i] || [];
            for (let j = 0; j < Math.min(row.length, 10); j++) {
                const cellVal = row[j]?.toString().trim() || "";
                if (!cellVal) continue;

                // Try to find year
                const yearMatch = cellVal.match(/\b(20\d{2})\b/);
                if (yearMatch) {
                    targetYear = parseInt(yearMatch[1], 10);
                }

                // Try to find group
                if (!group) {
                    const normalizedCell = cellVal.toLowerCase();
                    const cleanCell = normalizedCell.replace(/group/i, "").replace(/attendance/i, "").trim();

                    group = initialGroups.find(g => {
                        const gn = g.name.toLowerCase();
                        return gn === cleanCell || normalizedCell.includes(gn) || cleanCell.includes(gn);
                    });
                }
            }
        }

        // 2. Fallback to sheet name if not found inside
        if (!group) {
            const normalizedSheet = sheetName.toLowerCase();
            const yearMatch = sheetName.match(/\b(20\d{2})\b/);
            if (yearMatch) targetYear = parseInt(yearMatch[1], 10);

            const cleanSheetName = normalizedSheet
                .replace(/group/i, "")
                .replace(/attendance/i, "")
                .replace(/\b20\d{2}\b/g, "")
                .trim();

            if (cleanSheetName) {
                group = initialGroups.find(g => {
                    const gn = g.name.toLowerCase();
                    return normalizedSheet.includes(gn) || gn.includes(cleanSheetName) || cleanSheetName.includes(gn);
                });
            }
        }

        if (!group) return;

        // 3. Coordinate mapping (Find labels and data start)
        let weekRowIndex = -1;
        for (let i = 0; i < Math.min(rows.length, 10); i++) {
            if (rows[i]?.some(cell => cell?.toString().trim().toLowerCase().startsWith("week"))) {
                weekRowIndex = i;
                break;
            }
        }

        if (weekRowIndex === -1) return;

        const monthRow = rows[weekRowIndex - 2] || [];
        const weekRow = rows[weekRowIndex] || [];
        const dataStartRow = weekRowIndex + 2;

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

        for (let r = dataStartRow; r < rows.length; r++) {
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
