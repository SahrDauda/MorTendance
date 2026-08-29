import React from "react"
import { QRCodeSVG } from "qrcode.react"

export default function MorTagBack({
  badgeId,
  compact = false,
  width,
  height,
  id,
}: {
  badgeId: string
  compact?: boolean
  width?: string | number
  height?: string | number
  id?: string
}) {
  const qrData = badgeId

  return (
    <div
      id={id}
      style={{
        width: width ?? (compact ? "54mm" : 280),
        height: height ?? (compact ? "76.12mm" : 394.7),
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        padding: compact ? "4.5mm 3.5mm" : "20px 14px",
        boxSizing: "border-box",
        border: compact ? "0.8mm solid #ffffff" : "3px solid #ffffff",
        overflow: "hidden",
        borderRadius: compact ? 0 : 12,
      }}
    >
      <img
        src={typeof window !== "undefined" ? window.location.origin + "/camp_photo.jpeg" : "/camp_photo.jpeg"}
        alt="MOR Camp Background"
        crossOrigin="anonymous"
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
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(15, 23, 42, 0.88)",
          zIndex: 1,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          color: "#fbbf24",
          fontSize: compact ? "3.2mm" : "15px",
          fontWeight: 800,
          letterSpacing: "1.5px",
          marginTop: compact ? "1.5mm" : "6px",
          textAlign: "center",
        }}
      >
        SCAN FOR CHECK-IN
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 2,
          background: "white",
          padding: compact ? "2.5mm" : "10px",
          borderRadius: compact ? "2.5mm" : "10px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
        }}
      >
        <QRCodeSVG
          value={qrData}
          size={compact ? 110 : 140}
          level="M"
          style={{ width: compact ? "32mm" : "140px", height: compact ? "32mm" : "140px" }}
        />
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2px",
          marginBottom: compact ? "2mm" : "8px",
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: compact ? "3.2mm" : "15px",
            fontWeight: 800,
            letterSpacing: "1px",
          }}
        >
          {badgeId}
        </div>
        <div
          style={{
            color: "#94a3b8",
            fontSize: compact ? "1.8mm" : "9px",
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          Mercy Prayer Mountain • Helpline: +23276 824044
        </div>
      </div>
    </div>
  )
}
