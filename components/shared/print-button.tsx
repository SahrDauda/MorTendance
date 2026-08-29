"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

export default function PrintButton({
  text,
  autoPrint = false,
  filename = "mor-tag.pdf",
  targetId,
  pdfFormat = "auto",
  className = "",
}: {
  text: string;
  autoPrint?: boolean;
  filename?: string;
  targetId?: string;
  pdfFormat?: "auto" | "a4";
  className?: string;
}) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window === "undefined") return;

    setIsGenerating(true);

    try {
      const html2pdfModule = await import("html2pdf.js");
      const html2pdf = html2pdfModule.default || html2pdfModule;
      
      const element = (targetId
        ? document.getElementById(targetId)
        : document.querySelector(".print-container")) as HTMLElement;

      if (!element) {
        alert("Could not find the target element to download.");
        setIsGenerating(false);
        return;
      }

      const pxToMm = 0.264583;
      const widthMm = Math.max(element.offsetWidth * pxToMm, 1) + 1;
      const heightMm = Math.max(element.offsetHeight * pxToMm, 1) + 1;

      const opt = {
        margin: pdfFormat === "a4" ? 10 : 0,
        filename: filename,
        image: { type: "jpeg" as const, quality: 1.0 },
        html2canvas: { scale: 3, useCORS: true, letterRendering: true, logging: true, y: 0, scrollY: 0 },
        jsPDF:
          pdfFormat === "a4"
            ? { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const }
            : {
                unit: "mm" as const,
                format: [widthMm, heightMm] as [number, number],
                orientation: (widthMm > heightMm ? "landscape" : "portrait") as "landscape" | "portrait",
              },
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF: " + (error instanceof Error ? error.message : JSON.stringify(error)));
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (autoPrint && typeof window !== "undefined") {
      const timer = setTimeout(() => {
        const fakeEvent = { stopPropagation: () => {} } as React.MouseEvent;
        handleDownload(fakeEvent);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  return (
    <Button
      onClick={handleDownload}
      disabled={isGenerating}
      className={className}
      variant={isGenerating ? "outline" : "default"}
    >
      {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
      {isGenerating ? "Generating..." : text}
    </Button>
  );
}
