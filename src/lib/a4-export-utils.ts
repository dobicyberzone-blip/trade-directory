/**
 * A4 Export Utilities
 * Production-ready utilities for pixel-perfect A4 exports
 * 
 * CRITICAL FIX: Uses 96 DPI for layout dimensions, html2canvas scale for quality
 * This ensures normal font sizes while maintaining high-resolution output
 */

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// TRUE A4 dimensions at different DPIs
export const A4_DIMENSIONS = {
  // Physical dimensions in mm
  MM: {
    WIDTH: 210,
    HEIGHT: 297,
  },
  // At 96 DPI (screen resolution) - USE THIS FOR LAYOUT
  DPI_96: {
    PORTRAIT: { width: 794, height: 1123 },
    LANDSCAPE: { width: 1123, height: 794 },
  },
  // At 300 DPI (print quality) - ONLY FOR REFERENCE
  DPI_300: {
    PORTRAIT: { width: 2480, height: 3508 },
    LANDSCAPE: { width: 3508, height: 2480 },
  },
  // jsPDF points (72 DPI)
  POINTS: {
    PORTRAIT: { width: 595.28, height: 841.89 },
    LANDSCAPE: { width: 841.89, height: 595.28 },
  },
} as const;

export type Orientation = 'portrait' | 'landscape';
export type ExportFormat = 'png' | 'pdf' | 'jpg';
export type Quality = 'screen' | 'print' | 'high';

export interface ExportConfig {
  orientation: Orientation;
  format: ExportFormat;
  quality: Quality;
  fileName: string;
  dpi?: number; // Custom DPI (default: 300 for print, 96 for screen)
}

/**
 * Get layout dimensions (ALWAYS 96 DPI for proper font sizing)
 * The layout should ALWAYS use screen resolution dimensions
 * html2canvas scale will handle the resolution increase
 */
export function getExportDimensions(orientation: Orientation, quality: Quality) {
  // ALWAYS use 96 DPI dimensions for layout
  // This ensures fonts and elements are normal size
  const dimensions = A4_DIMENSIONS.DPI_96;
  
  return orientation === 'portrait' 
    ? dimensions.PORTRAIT 
    : dimensions.LANDSCAPE;
}

/**
 * Calculate html2canvas scale factor for desired DPI
 * This scales UP the 96 DPI layout to higher resolution
 */
export function getCanvasScale(quality: Quality): number {
  switch (quality) {
    case 'high':
      return 3.125; // 300 DPI (300/96 = 3.125)
    case 'print':
      return 3.125; // 300 DPI (300/96 = 3.125)
    case 'screen':
    default:
      return 1; // 96 DPI (no scaling)
  }
}

/**
 * Export element to PNG with pixel-perfect A4 dimensions
 */
export async function exportToPNG(
  element: HTMLElement,
  config: ExportConfig
): Promise<void> {
  // Layout dimensions (96 DPI - normal font sizes)
  const dimensions = getExportDimensions(config.orientation, config.quality);
  
  // Scale factor for resolution (1x for screen, 3.125x for print)
  const scale = getCanvasScale(config.quality);

  // Capture with html2canvas
  const canvas = await html2canvas(element, {
    scale: scale, // This scales UP the 96 DPI layout for print quality
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#ffffff',
    logging: false,
    width: dimensions.width,
    height: dimensions.height,
    windowWidth: dimensions.width,
    windowHeight: dimensions.height,
    // Prevent scrolling issues
    scrollX: 0,
    scrollY: 0,
    x: 0,
    y: 0,
  });

  // Convert to blob
  const mimeType = config.format === 'jpg' ? 'image/jpeg' : 'image/png';
  const qualityValue = config.format === 'jpg' ? 0.95 : 1.0;

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create image blob'));
        }
      },
      mimeType,
      qualityValue
    );
  });

  // Download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${config.fileName}.${config.format}`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Cleanup
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Export element to PDF with pixel-perfect A4 dimensions
 */
export async function exportToPDF(
  element: HTMLElement,
  config: ExportConfig
): Promise<void> {
  // Layout dimensions (96 DPI - normal font sizes)
  const dimensions = getExportDimensions(config.orientation, config.quality);
  
  // Scale factor for resolution (1x for screen, 3.125x for print)
  const scale = getCanvasScale(config.quality);

  // Capture with html2canvas
  const canvas = await html2canvas(element, {
    scale: scale, // This scales UP the 96 DPI layout for print quality
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#ffffff',
    logging: false,
    width: dimensions.width,
    height: dimensions.height,
    windowWidth: dimensions.width,
    windowHeight: dimensions.height,
    scrollX: 0,
    scrollY: 0,
    x: 0,
    y: 0,
  });

  // Convert canvas to image data
  const imgData = canvas.toDataURL('image/png', 1.0);

  // Get PDF dimensions in points
  const pdfDimensions = config.orientation === 'portrait'
    ? A4_DIMENSIONS.POINTS.PORTRAIT
    : A4_DIMENSIONS.POINTS.LANDSCAPE;

  // Create PDF
  const pdf = new jsPDF({
    orientation: config.orientation,
    unit: 'pt',
    format: 'a4',
    compress: true,
  });

  // Calculate image dimensions to fit A4 perfectly
  // Use the full page dimensions
  const imgWidth = pdfDimensions.width;
  const imgHeight = pdfDimensions.height;

  // Add image to PDF (no margins, full bleed)
  pdf.addImage(
    imgData,
    'PNG',
    0, // x position
    0, // y position
    imgWidth,
    imgHeight,
    undefined,
    'FAST'
  );

  // Set metadata
  pdf.setProperties({
    title: config.fileName,
    subject: 'Business Profile Export',
    author: 'KEPROBA E-Trade Directory Kenya',
    keywords: 'business, profile, export, kenya',
    creator: 'KEPROBA E-Trade Directory',
  });

  // Save
  pdf.save(`${config.fileName}.pdf`);
}

/**
 * Prepare element for export by freezing layout
 */
export function prepareElementForExport(element: HTMLElement): () => void {
  // Store original styles
  const originalStyles = {
    position: element.style.position,
    left: element.style.left,
    top: element.style.top,
    zIndex: element.style.zIndex,
    visibility: element.style.visibility,
  };

  // Apply export styles
  element.style.position = 'fixed';
  element.style.left = '-9999px';
  element.style.top = '0';
  element.style.zIndex = '-1';
  element.style.visibility = 'visible';

  // Return cleanup function
  return () => {
    element.style.position = originalStyles.position;
    element.style.left = originalStyles.left;
    element.style.top = originalStyles.top;
    element.style.zIndex = originalStyles.zIndex;
    element.style.visibility = originalStyles.visibility;
  };
}

/**
 * Wait for all images in element to load
 */
export async function waitForImages(element: HTMLElement): Promise<void> {
  const images = Array.from(element.querySelectorAll('img'));
  
  const promises = images.map((img) => {
    if (img.complete) return Promise.resolve();
    
    return new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${img.src}`));
      
      // Timeout after 10 seconds
      setTimeout(() => resolve(), 10000);
    });
  });

  await Promise.all(promises);
}
