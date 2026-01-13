/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { jsPDF } from 'jspdf';
import { ColoringPage, PAGE_SIZES } from '../types';

export const generateColoringBookPDF = (
  pages: ColoringPage[], 
  title: string,
  pageSizeId: string,
  metadata: { style: string; complexity: string; audience: string; originalPrompt: string },
  filename: string
) => {
  const sizeConfig = PAGE_SIZES.find(s => s.id === pageSizeId) || PAGE_SIZES[1]; // default to portrait
  
  // Convert inches to mm for consistency with layout logic (1 inch = 25.4 mm)
  const width = sizeConfig.width * 25.4;
  const height = sizeConfig.height * 25.4;

  // 1. Create PDF
  const doc = new jsPDF({
    orientation: width > height ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [width, height]
  });
  
  // 2. Loop through images
  const finishedPages = pages.filter(p => p.imageUrl);

  // GUTTER-AWARE MARGIN CONFIGURATION
  const baseMargin = 12.7;  // 0.5" outer margin
  const gutterWidth = 6.35; // 0.25" additional inner margin for book binding
  const enableGutter = true; // Feature flag for alternating margins
  const enablePrintBorder = false; // Optional print-safe border

  // Calculate dynamic margins per page for book binding
  const getPageMargins = (pageIndex: number) => {
    if (!enableGutter) {
      return { left: baseMargin, top: baseMargin, right: baseMargin, bottom: baseMargin };
    }

    // Even page (right side of spread): inner edge on left
    // Odd page (left side of spread): inner edge on right
    const isEvenPage = pageIndex % 2 === 0;

    return {
      left: isEvenPage ? baseMargin + gutterWidth : baseMargin,
      right: isEvenPage ? baseMargin : baseMargin + gutterWidth,
      top: baseMargin,
      bottom: baseMargin,
    };
  };

  // Optional print-safe border function
  const addPrintSafeBorder = (
    margins: { left: number; top: number; right: number; bottom: number },
    workingWidth: number,
    workingHeight: number
  ) => {
    if (!enablePrintBorder) return;

    const thickness = 0.5;
    const color: [number, number, number] = [180, 180, 180];
    const inset = 2; // 2mm inset from content edge

    doc.setDrawColor(...color);
    doc.setLineWidth(thickness);

    doc.rect(
      margins.left + inset,
      margins.top + inset,
      workingWidth - inset * 2,
      workingHeight - inset * 2
    );
  };

  finishedPages.forEach((page, index) => {
    // Only add a new page if this isn't the first item
    if (index > 0) {
        doc.addPage([width, height], width > height ? 'landscape' : 'portrait');
    }

    // Calculate dynamic margins for this page
    const margins = getPageMargins(index);
    const workingWidth = width - (margins.left + margins.right);
    const workingHeight = height - (margins.top + margins.bottom);

    // Add the image with lossless compression
    if (page.imageUrl) {
        try {
            // LOSSLESS COMPRESSION: Changed from 'FAST' to 'NONE' for print quality
            doc.addImage(
              page.imageUrl,
              'PNG',
              margins.left,  // Dynamic X position
              margins.top,   // Y position
              workingWidth,
              workingHeight,
              undefined,
              'NONE'  // Lossless compression
            );

            // Optional: Add print-safe border
            addPrintSafeBorder(margins, workingWidth, workingHeight);
        } catch (e) {
            console.error("Error adding image to PDF", e);
        }
    }
  });

  // --- ADD RECIPE / METADATA PAGE ---
  if (metadata) {
    doc.addPage([width, height], width > height ? 'landscape' : 'portrait');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Title
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text("Project Recipe", pageWidth / 2, 40, { align: 'center' });

    // Divider
    doc.setLineWidth(0.5);
    doc.line(40, 45, pageWidth - 40, 45);

    // Metadata Info
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60); // Dark Gray

    let y = 70;
    const lineHeight = 10;
    const leftMargin = 40;

    const addMetaLine = (label: string, value: string) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, leftMargin, y);
        doc.setFont("helvetica", "normal");
        
        // Simple text wrapping for long prompts
        // Width available = Total Width - Left Margin - Gap(40) - Right Margin(approx 50)
        const maxTextWidth = pageWidth - 90; 
        const splitText = doc.splitTextToSize(value, maxTextWidth);
        
        doc.text(splitText, leftMargin + 40, y);
        y += (lineHeight * Math.max(1, splitText.length)) + 5;
    };

    addMetaLine("Created:", new Date().toLocaleDateString());
    addMetaLine("Visual Style:", metadata.style);
    addMetaLine("Complexity:", metadata.complexity);
    addMetaLine("Audience:", metadata.audience);
    addMetaLine("Master Prompt:", metadata.originalPrompt);

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("Generated with Operation Tinker", pageWidth / 2, pageHeight - 20, { align: 'center' });
  }

  // 3. Save
  doc.save(filename || 'coloring-book.pdf');
};
