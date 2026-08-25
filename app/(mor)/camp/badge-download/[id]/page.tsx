import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import MorTagFront from "@/components/camp/mor-tag-front"
import MorBadgePrintButton from "@/components/camp/mor-badge-print-button"
import Link from "next/link"

export default async function BadgeDownloadPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params

  const member = await db.campMember.findFirst({
    where: {
      OR: [
        { id },
        { badgeId: id },
      ],
    },
  })
  if (!member) return notFound()

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b0f19",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        gap: "32px",
      }}
    >
      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
        <Link
          href="/camp/members"
          style={{
            padding: "10px 16px",
            background: "rgba(255,255,255,0.08)",
            color: "#e2e8f0",
            textDecoration: "none",
            borderRadius: "8px",
            fontWeight: 600,
            fontSize: "14px",
          }}
        >
          ← Back to Members
        </Link>

        <MorBadgePrintButton
          member={{
            fullName: member.fullName,
            badgeId: member.badgeId,
            branch: member.branch,
            caregroup: member.caregroup,
            room: member.room,
            position: member.position,
          }}
          autoPrint={true}
        />
      </div>

      <p style={{ color: "#64748b", fontSize: "13px", textAlign: "center", maxWidth: 320 }}>
        Your PDF is downloading automatically. If the download doesn&apos;t start, click the button above.
      </p>

      {/* Badge preview – Front only */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
        <div style={{ boxShadow: "0 20px 40px rgba(0,0,0,0.6)", borderRadius: "8px", overflow: "hidden" }}>
          <div id="badge-front" style={{ width: "54mm", height: "85.6mm", overflow: "hidden", boxSizing: "border-box" }}>
            <MorTagFront
              compact
              width="54mm"
              height="85.6mm"
              member={{
                fullName: member.fullName,
                branch: member.branch ?? undefined,
                caregroup: member.caregroup ?? undefined,
                room: member.room ?? undefined,
                position: member.position,
                badgeId: member.badgeId,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
