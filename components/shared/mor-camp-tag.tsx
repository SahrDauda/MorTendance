import React from "react";

export type MorTagMemberInfo = {
  id: string;
  name: string;
  groupName?: string | null;
  branchName?: string | null;
  phoneNumber?: string | null;
  status?: string | null;
  roomName?: string | null;
};

function DarkFieldRow({
  label,
  value,
  compact,
  valueColor,
}: {
  label: string;
  value: string;
  compact?: boolean;
  valueColor: string;
}) {
  const labelWidth = compact ? "17mm" : "75px";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        width: "100%",
        marginBottom: compact ? "1.5mm" : "6px",
      }}
    >
      <span
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontWeight: 700,
          color: "#9ca3af", // gray-400
          fontSize: compact ? "2.3mm" : "12px",
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
        }}
      >
        <span
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontWeight: 800,
            color: valueColor,
            fontSize: compact ? "2.6mm" : "14px",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            width: "100%",
            textAlign: "left",
            lineHeight: 1.1,
          }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

export function MorTagFront({
  member,
  width = "54mm",
  height = "85.6mm",
}: {
  member: MorTagMemberInfo;
  width?: string | number;
  height?: string | number;
}) {
  const isCompact = typeof width === "string" && width.endsWith("mm");
  const topHeight = "64%";
  const bottomHeight = "36%";

  return (
    <div
      style={{
        width: width,
        height: height,
        position: "relative",
        overflow: "hidden",
        borderRadius: isCompact ? 0 : 12,
        background: "#0b0f19",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        border: isCompact ? "1mm solid #dc2626" : "4px solid #dc2626", // Camp theme red border
      }}
    >
      {/* Camp Flyer Banner Section */}
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
          src="/camp_photo.jpeg"
          alt="MOR Camp Banner"
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

      {/* Gold Divider */}
      <div style={{ height: isCompact ? "0.5mm" : "2px", width: "100%", background: "#fbbf24", zIndex: 10, flexShrink: 0 }} />

      {/* Attendee details bottom card */}
      <div
        style={{
          height: bottomHeight,
          width: "100%",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: isCompact ? "2mm 4mm" : "10px 15px",
          boxSizing: "border-box",
        }}
      >
        <DarkFieldRow label="Name" value={member.name || "—"} compact={isCompact} valueColor="#ffffff" />
        <DarkFieldRow label="Branch" value={member.branchName || "HQ"} compact={isCompact} valueColor="#fbbf24" />
        <DarkFieldRow label="Group" value={member.groupName || "General"} compact={isCompact} valueColor="#d1d5db" />
        <DarkFieldRow label="Room" value={member.roomName || "Unassigned"} compact={isCompact} valueColor="#d1d5db" />

        {/* Attendee role tag overlay */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#dc2626", // camp red
            color: "#ffffff",
            fontWeight: 900,
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: isCompact ? "2.2mm" : "11px",
            padding: isCompact ? "0.8mm 3mm" : "4px 14px",
            borderRadius: "999px",
            marginTop: isCompact ? "1mm" : "6px",
            alignSelf: "center",
            letterSpacing: "0.5px",
            textTransform: "uppercase",
          }}
        >
          Attendee
        </div>
      </div>
    </div>
  );
}

export function MorTagBack({
  member,
  width = "54mm",
  height = "85.6mm",
}: {
  member: MorTagMemberInfo;
  width?: string | number;
  height?: string | number;
}) {
  const isCompact = typeof width === "string" && width.endsWith("mm");
  
  const qrUrl = typeof window !== "undefined"
    ? `${window.location.origin}/check-in?memberId=${member.id}`
    : `https://mor-camp.vercel.app/check-in?memberId=${member.id}`;

  return (
    <div
      style={{
        width: width,
        height: height,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        padding: isCompact ? "8mm 4mm" : "30px 15px",
        boxSizing: "border-box",
        border: isCompact ? "1mm solid #ffffff" : "4px solid #ffffff", // White border
        overflow: "hidden",
        borderRadius: isCompact ? 0 : 12,
      }}
    >
      <img
        src="/camp_photo.jpeg"
        alt="MOR Camp Background"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
        }}
      />
      {/* Dark overlay */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(15, 23, 42, 0.88)", zIndex: 1 }} />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          color: "#fbbf24", // Gold
          fontSize: isCompact ? "3.5mm" : "16px",
          fontWeight: 800,
          letterSpacing: "1.5px",
          marginTop: isCompact ? "2mm" : "10px",
          textTransform: "uppercase",
        }}
      >
        Scan to Lodging
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 2,
          background: "white",
          padding: isCompact ? "3mm" : "12px",
          borderRadius: isCompact ? "3mm" : "12px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
        }}
      >
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrUrl)}`}
          alt="QR Code"
          style={{ width: isCompact ? "35mm" : "140px", height: isCompact ? "35mm" : "140px" }}
        />
      </div>

      {/* Emergency Contact */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          color: "white",
          fontSize: isCompact ? "2.5mm" : "12px",
          fontWeight: 700,
          letterSpacing: "1px",
          textAlign: "center",
          marginBottom: isCompact ? "2mm" : "10px",
        }}
      >
        <div>Emergency Contact</div>
        <div style={{ color: "#fbbf24", marginTop: "2px", fontWeight: 800 }}>+232 76 824044</div>
      </div>
    </div>
  );
}
