import React from "react"

export type CampMemberTagInfo = {
  fullName: string
  branch?: string | null
  caregroup?: string | null
  room?: string | null
  position?: string | null
  badgeId?: string
}

export function isGeneralMember(position?: string | null) {
  const normalized = (position || "").trim().toLowerCase()
  return (
    !normalized ||
    normalized === "general member" ||
    normalized === "member" ||
    normalized === "attendee"
  )
}

export function resolveGroupTagImage(caregroup?: string | null): string {
  const norm = (caregroup || "").trim().toUpperCase()
  if (norm.includes("DIKAIOSIS") || norm.includes("DIK")) return "/tags/DIKAIOSIS.jpeg"
  if (norm.includes("DOXASMOS") || norm.includes("DOX")) return "/tags/DOXASMOS.jpeg"
  if (norm.includes("HAGIASMOS") || norm.includes("HAG")) return "/tags/HAGIASMOS.jpeg"
  if (norm.includes("HUIOTHESIA") || norm.includes("HUIO")) return "/tags/HUIOTHESIA.jpeg"
  if (norm.includes("PALINGENESIA") || norm.includes("PALIGENESIA") || norm.includes("PAL"))
    return "/tags/PALINGENESIA.jpeg"
  return "/tags/DIKAIOSIS.jpeg"
}

export default function MorTagFront({
  member,
  compact = false,
  width,
  height,
  id,
}: {
  member: CampMemberTagInfo
  compact?: boolean
  width?: string | number
  height?: string | number
  id?: string
}) {
  const groupImgPath = resolveGroupTagImage(member.caregroup)
  const safeName = (member.fullName || "Attendee").trim().toUpperCase()
  const isLeader = !isGeneralMember(member.position)
  const isEmmanuel = safeName.includes("EMMANUEL") && safeName.includes("DAUDA")

  // Aspect ratio is 4960 / 6992 = ~0.70938
  // At 54mm width, height is ~76.12mm (or 280px by 394.7px)
  const targetWidth = width ?? (compact ? "54mm" : 280)
  const targetHeight = height ?? (compact ? "76.12mm" : 394.7)

  const getSvgTextParams = (name: string) => {
    const len = name.length
    if (len > 22) return { fontSize: "68", textLength: "820", letterSpacing: "-1" }
    if (len > 18) return { fontSize: "76", textLength: "820", letterSpacing: "-0.5" }
    if (len > 14) return { fontSize: "84", textLength: "820", letterSpacing: "0" }
    if (len > 10) return { fontSize: "92", textLength: "820", letterSpacing: "0.5" }
    if (len > 7) return { fontSize: "98", textLength: "800", letterSpacing: "1" }
    return { fontSize: "106", textLength: undefined, letterSpacing: "1.5" }
  }

  const textParams = getSvgTextParams(safeName)

  return (
    <div
      id={id}
      style={{
        width: targetWidth,
        height: targetHeight,
        position: "relative",
        overflow: "hidden",
        borderRadius: compact ? 0 : 12,
        background: "#0b0f19",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        boxShadow: compact ? "none" : "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
      }}
    >
      {/* High-res Group Background Image */}
      <img
        src={
          typeof window !== "undefined"
            ? window.location.origin + groupImgPath
            : groupImgPath
        }
        alt={member.caregroup || "Camp Tag"}
        crossOrigin="anonymous"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          display: "block",
        }}
      />

      {/* Branch Indicator directly above Group Name (Y: ~59.8%) */}
      <div
        style={{
          position: "absolute",
          top: "59.8%",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0f172a",
            color: "#ffffff",
            fontWeight: 800,
            fontFamily:
              "'Barlow Condensed', 'Arial Black', 'Impact', Arial, sans-serif",
            fontSize: compact ? "1.6mm" : "8px",
            padding: compact ? "0.3mm 2mm" : "1.5px 7px",
            borderRadius: "999px",
            letterSpacing: "0.8px",
            textTransform: "uppercase",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
            whiteSpace: "nowrap",
          }}
        >
          BRANCH: {displayBranch}
        </div>
      </div>

      {/* Name Overlay Box (Coordinates calibrated to exact 4960x6992 white rectangle: Y 80.09%-90.37%, X 5.08%-94.90%) */}
      <div
        style={{
          position: "absolute",
          top: "80.09%",
          left: "5.08%",
          width: "89.84%",
          height: "10.28%",
          background: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2px 8px",
          boxSizing: "border-box",
          overflow: "hidden",
          zIndex: 5,
        }}
      >
        <svg
          viewBox="0 0 1000 160"
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            overflow: "hidden",
          }}
          preserveAspectRatio="xMidYMid meet"
        >
          <text
            x="500"
            y="90"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#0f172a"
            style={{
              fontFamily:
                "'Barlow Condensed', 'Arial Black', 'Impact', 'Trebuchet MS', Arial, sans-serif",
              fontWeight: 900,
              textTransform: "uppercase",
            }}
            fontSize={textParams.fontSize}
            letterSpacing={textParams.letterSpacing}
            textLength={textParams.textLength}
            lengthAdjust={textParams.textLength ? "spacingAndGlyphs" : undefined}
          >
            {safeName}
          </text>
        </svg>
      </div>

      {/* Leader Ribbon Overlay */}
      {isLeader && (
        <div
          style={{
            position: "absolute",
            top: "91.2%",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            width: "90%",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#facc15",
              color: "#000000",
              fontWeight: 900,
              fontFamily: "'Barlow Condensed', Arial, sans-serif",
              fontSize: compact ? "1.8mm" : "9.5px",
              padding: compact ? "0.4mm 2.2mm" : "2px 8px",
              borderRadius: "999px",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
              whiteSpace: "nowrap",
            }}
          >
            ★ LEADER{isEmmanuel ? " • COMMITTED CHRISTIAN" : ""} ★
          </div>
        </div>
      )}
    </div>
  )
}
