import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function resolveScope(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      managedGroups: { select: { id: true } },
      managedBranch: { select: { id: true } },
    },
  })
  if (!user) return null
  return {
    user,
    groupIds: user.managedGroups.map((g) => g.id),
    branchId: user.managedBranch?.id,
    isGlobal: ["SUPER_ADMIN", "ADMIN"].includes(user.role),
  }
}

function buildMemberWhere(scope: NonNullable<Awaited<ReturnType<typeof resolveScope>>>) {
  const where: any = {}
  if (!scope.isGlobal) {
    if (scope.groupIds.length > 0) where.groupId = { in: scope.groupIds }
    else if (scope.branchId) where.branchId = scope.branchId
  }
  return where
}

function serializeMember(m: any) {
  return {
    id: m.id,
    name: m.name,
    phoneNumber: m.phoneNumber ?? null,
    address: m.address ?? null,
    gender: m.gender ?? null,
    schoolName: m.schoolName ?? null,
    status: m.status,
    groupId: m.groupId,
    groupName: m.group?.name ?? null,
    branchId: m.branchId ?? null,
    branchName: m.branch?.name ?? null,
    joinedAt: m.joinedAt.toISOString(),
  }
}

// ── GET /api/mobile/members ───────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const token = extractBearerToken(req.headers.get("Authorization"))
  const payload = token ? await verifyMobileToken(token) : null
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const scope = await resolveScope(payload.sub)
    if (!scope) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const members = await db.member.findMany({
      where: buildMemberWhere(scope),
      include: {
        group: { select: { name: true } },
        branch: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ members: members.map(serializeMember) })
  } catch (error: any) {
    console.error("[Mobile] members GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ── POST /api/mobile/members ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const token = extractBearerToken(req.headers.get("Authorization"))
  const payload = token ? await verifyMobileToken(token) : null
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { name, phoneNumber, gender, groupId } = await req.json()

    if (!name?.trim() || !groupId) {
      return NextResponse.json(
        { error: "name and groupId are required" },
        { status: 400 }
      )
    }

    const group = await db.ministryGroup.findUnique({
      where: { id: groupId },
      include: { branch: { select: { id: true, name: true } } },
    })
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 })

    const branchId = group.branchId || (await db.branch.findFirst())?.id
    if (!branchId) {
      return NextResponse.json({ error: "Branch not found for group" }, { status: 400 })
    }

    const member = await db.member.create({
      data: {
        name: name.trim(),
        phoneNumber: phoneNumber || null,
        gender: gender || null,
        groupId,
        branchId,
        status: "PRELIMINARY",
      },
      include: {
        group: { select: { name: true } },
        branch: { select: { name: true } },
      },
    })

    return NextResponse.json({ member: serializeMember(member) }, { status: 201 })
  } catch (error: any) {
    console.error("[Mobile] members POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
