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

function DarkFieldRow({
  label,
  value,
  compact,
  valueColor,
}: {
  label: string
  value: string
  compact?: boolean
  valueColor: string
}) {
  const labelWidth = compact
    ? label === "Name"
      ? "9mm"
      : label === "Branch"
      ? "12mm"
      : label === "Room"
      ? "11mm"
      : "15mm"
    : label === "Name"
    ? "38px"
    : label === "Branch"
    ? "52px"
    : label === "Room"
    ? "46px"
    : "66px"

  const getFontSize = () => {
    if (value.length > 25) return compact ? "1.65mm" : "9.5px"
    if (value.length > 20) return compact ? "1.85mm" : "11px"
    if (value.length > 15) return compact ? "2.1mm" : "12.5px"
    return compact ? "2.5mm" : "13.5px"
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        width: "100%",
        marginBottom: compact ? "1.2mm" : "5px",
      }}
    >
      <span
        style={{
          fontFamily: "Arial, Helvetica, sans-serif",
          fontWeight: 700,
          color: "#9ca3af",
          fontSize: compact ? "2.2mm" : "11px",
          width: labelWidth,
          flexShrink: 0,
          textAlign: "left",
          paddingBottom: "1px",
        }}
      >
        {label} :
      </span>
      <div
        style={{
          flex: 1,
          borderBottom: "1.5px dotted rgba(255, 255, 255, 0.4)",
          marginLeft: "2px",
          display: "flex",
          alignItems: "flex-end",
          paddingBottom: "1px",
          minHeight: compact ? "3.2mm" : "16px",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            fontFamily: "Arial, Helvetica, sans-serif",
            fontWeight: 800,
            color: valueColor,
            fontSize: getFontSize(),
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            width: "100%",
            textAlign: "left",
            lineHeight: 1.1,
            letterSpacing: value.length > 22 ? "-0.2px" : "normal",
          }}
        >
          {value}
        </span>
      </div>
    </div>
  )
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
  const topHeight = "62%"
  const bottomHeight = "38%"
  const positionToShow = member.position

  return (
    <div
      id={id}
      style={{
        width: width ?? (compact ? "54mm" : 280),
        height: height ?? (compact ? "85.6mm" : 410),
        position: "relative",
        overflow: "hidden",
        borderRadius: compact ? 0 : 12,
        background: "#0b0f19",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        border: compact ? "1mm solid #93C5FD" : "4px solid #93C5FD",
      }}
    >
      {/* Camp Flyer Art */}
      <div
        style={{
          height: topHeight,
          width: "100%",
          overflow: "hidden",
          position: "relative",
          flexShrink: 0,
        }}
      >
        <img
          src={typeof window !== "undefined" ? window.location.origin + "/camp_photo.jpeg" : "/camp_photo.jpeg"}
          alt="MOR Camp 2026"
          crossOrigin="anonymous"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
      </div>

      {/* Gold/Cyan Divider */}
      <div
        style={{
          height: compact ? "0.5mm" : "2px",
          width: "100%",
          background: "linear-gradient(90deg, #38bdf8, #fbbf24)",
          zIndex: 10,
          flexShrink: 0,
        }}
      />

      {/* Attendee details */}
      <div
        style={{
          height: bottomHeight,
          width: "100%",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: compact ? "2mm 2.5mm" : "8px 10px",
          boxSizing: "border-box",
        }}
      >
        <DarkFieldRow
          label="Name"
          value={member.fullName || "—"}
          compact={compact}
          valueColor="#ffffff"
        />
        <DarkFieldRow
          label="Branch"
          value={member.branch || "—"}
          compact={compact}
          valueColor="#fbbf24"
        />
        <DarkFieldRow
          label="Group"
          value={member.caregroup || "Unassigned"}
          compact={compact}
          valueColor="#d1d5db"
        />
        {member.room && (
          <DarkFieldRow
            label="Room"
            value={member.room}
            compact={compact}
            valueColor="#38bdf8"
          />
        )}

        {!isGeneralMember(positionToShow) && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#facc15",
              color: "#000000",
              fontWeight: 900,
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: compact ? "2mm" : "10px",
              padding: compact ? "0.6mm 2.5mm" : "3px 10px",
              borderRadius: "999px",
              marginTop: compact ? "0.8mm" : "4px",
              alignSelf: "center",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}
          >
            {positionToShow}
          </div>
        )}
      </div>
    </div>
  )
}
