'use client';

import { ReactNode, CSSProperties } from 'react';
import { Orientation, getExportDimensions } from '@/lib/a4-export-utils';

interface A4ExportWrapperProps {
  children: ReactNode;
  orientation: Orientation;
  quality?: 'screen' | 'print' | 'high';
  className?: string;
}

/**
 * A4 Export Wrapper Component
 * 
 * Wraps content in a container with exact A4 dimensions at 96 DPI.
 * Ensures pixel-perfect exports for both portrait and landscape.
 * 
 * CRITICAL: Always uses 96 DPI dimensions for layout (normal font sizes).
 * html2canvas scale parameter handles resolution increase for print quality.
 * 
 * Usage:
 * <A4ExportWrapper orientation="portrait" quality="print">
 *   <YourContent />
 * </A4ExportWrapper>
 */
export function A4ExportWrapper({
  children,
  orientation,
  quality = 'print',
  className = '',
}: A4ExportWrapperProps) {
  // ALWAYS use 96 DPI dimensions for layout (normal font sizes)
  // The quality parameter is passed through but doesn't affect layout dimensions
  const dimensions = getExportDimensions(orientation, quality);

  const containerStyle: CSSProperties = {
    width: `${dimensions.width}px`,
    height: `${dimensions.height}px`,
    minHeight: `${dimensions.height}px`,
    maxHeight: `${dimensions.height}px`,
    minWidth: `${dimensions.width}px`,
    maxWidth: `${dimensions.width}px`,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    position: 'relative',
    // Prevent any responsive behavior during export
    flexShrink: 0,
    flexGrow: 0,
  };

  return (
    <div 
      className={`a4-export-container ${className}`}
      style={containerStyle}
      data-orientation={orientation}
      data-quality={quality}
    >
      {children}
    </div>
  );
}
