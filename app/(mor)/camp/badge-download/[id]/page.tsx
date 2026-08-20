import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import MorTagFront from "@/components/camp/mor-tag-front"
import MorTagBack from "@/components/camp/mor-tag-back"
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

  const safeFilename = `${member.fullName.replace(/\s+/g, "_")}_MOR_Badge_${member.badgeId}.pdf`

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
        Your PDF is generating automatically. If the download doesn&apos;t start, click the button above.
      </p>

      {/* Badge previews – rendered at exact card dimensions directly in the DOM */}
      <div style={{ display: "flex", flexDirection: "row", gap: "32px", alignItems: "flex-start", flexWrap: "wrap", justifyContent: "center" }}>

        {/* Front */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "#64748b", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Front</span>
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

        {/* Back */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "#64748b", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Back</span>
          <div style={{ boxShadow: "0 20px 40px rgba(0,0,0,0.6)", borderRadius: "8px", overflow: "hidden" }}>
            <div id="badge-back" style={{ width: "54mm", height: "85.6mm", overflow: "hidden", boxSizing: "border-box" }}>
              <MorTagBack compact width="54mm" height="85.6mm" badgeId={member.badgeId} />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
