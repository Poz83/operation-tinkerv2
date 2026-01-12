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
  
  finishedPages.forEach((page, index) => {
    // Only add a new page if this isn't the first item
    if (index > 0) {
        doc.addPage([width, height], width > height ? 'landscape' : 'portrait');
    }
    
    // KDP MARGIN LOGIC:
    // Standard safe margin is 0.5 inches (12.7 mm).
    const margin = 12.7;
    const workingWidth = width - (margin * 2);
    const workingHeight = height - (margin * 2);

    // Add the image
    if (page.imageUrl) {
        try {
            doc.addImage(page.imageUrl, 'PNG', margin, margin, workingWidth, workingHeight, undefined, 'FAST');
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
