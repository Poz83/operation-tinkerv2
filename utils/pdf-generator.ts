
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { jsPDF } from 'jspdf';
import { ColoringPage, PAGE_SIZES } from '../types';

export const generateColoringBookPDF = (
  pages: ColoringPage[], 
  title: string = "My Coloring Book",
  pageSizeId: string = 'portrait'
) => {
  const sizeConfig = PAGE_SIZES.find(s => s.id === pageSizeId) || PAGE_SIZES[1]; // default to portrait
  const width = sizeConfig.width;
  const height = sizeConfig.height;

  // 1. Create PDF
  // Unit: 'in' (inches) makes it easier to handle KDP margins
  const doc = new jsPDF({
    orientation: width > height ? 'landscape' : 'portrait',
    unit: 'in',
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
    // We leave a safe margin so the user doesn't color into the book binding.
    // Standard safe margin is 0.5 inches.
    const margin = 0.5;
    const workingWidth = width - (margin * 2);
    const workingHeight = height - (margin * 2);

    // Add the image
    // We fill the "safe area" defined by the margins.
    // Since the image generation aspect ratio is synchronized with the page size configuration,
    // fitting to margins ensures it is centered and scaled correctly without distortion.
    if (page.imageUrl) {
        try {
            doc.addImage(page.imageUrl, 'PNG', margin, margin, workingWidth, workingHeight, undefined, 'FAST');
        } catch (e) {
            console.error("Error adding image to PDF", e);
        }
    }
  });

  // 3. Save
  // Format: username-projectname-randomNumbers.pdf
  const username = "Jamie"; // Dummy data for now
  // Sanitize title: replace non-alphanumeric characters with hyphens, remove duplicate hyphens, lowercase
  const sanitizedTitle = title.trim().replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').toLowerCase();
  const randomNumbers = Math.floor(10000 + Math.random() * 90000); // 5 digit random number
  
  doc.save(`${username}-${sanitizedTitle}-${randomNumbers}.pdf`);
};
