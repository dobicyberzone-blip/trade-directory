/**
 * ArcGIS Map Configuration for 10,000+ Records
 * Optimized for performance and user experience
 */

// Kenya map configuration
export const KENYA_MAP_CONFIG = {
  center: [37.9062, -0.0236] as [number, number], // Kenya center
  defaultZoom: 7,
  minZoom: 6,
  maxZoom: 18,
};

// Sector colors for custom markers (optimized for readability)
export const SECTOR_COLORS: Record<string, string> = {
  'Agriculture': '#22c55e',      // Green - Natural/Growth
  'Horticulture': '#84cc16',     // Lime - Fresh produce
  'Manufacturing': '#3b82f6',    // Blue - Industrial
  'Technology': '#8b5cf6',       // Purple - Innovation
  'Textiles & Apparel': '#ec4899', // Pink - Fashion
  'Tourism': '#f59e0b',          // Amber - Warmth/Travel
  'Handicrafts': '#f97316',      // Orange - Creativity
  'Services': '#06b6d4',         // Cyan - Professional
  'BPO': '#0ea5e9',              // Sky - Business
  'Mining': '#78716c',           // Stone - Earthy
  'Energy': '#eab308',           // Yellow - Power
  'Construction': '#64748b',     // Slate - Building
  'default': '#6b7280'           // Gray - Neutral
};

// Verification status colors
export const STATUS_COLORS: Record<string, string> = {
  'VERIFIED': '#22c55e',         // Green - Approved
  'approved': '#22c55e',         // Green - Approved (lowercase)
  'PENDING': '#f97316',          // Orange - In Review
  'pending': '#f97316',          // Orange - In Review (lowercase)
  'UNVERIFIED': '#6b7280',       // Gray - Not Verified
  'REJECTED': '#ef4444'          // Red - Denied
};

// Clustering configuration for optimal performance
export const CLUSTER_CONFIG = {
  clusterRadius: 100,            // Pixels - group markers within this radius
  clusterMinSize: 24,            // Minimum cluster circle size
  clusterMaxSize: 60,            // Maximum cluster circle size
  clusterThreshold: 10,          // Minimum points to form a cluster
  showLabels: true,              // Show count labels on clusters
  labelColor: '#ffffff',         // White text on clusters
  labelFont: {
    weight: 'bold',
    family: 'Noto Sans, Arial, sans-serif',
    size: '12px'
  }
};

// Marker size configuration
export const MARKER_SIZES = {
  small: 8,                      // Zoomed out
  medium: 12,                    // Mid zoom
  large: 16,                     // Zoomed in
  ratingBonus: 2,                // Additional size per rating star
  maxSize: 20                    // Maximum marker size
};

// Performance optimization settings
export const PERFORMANCE_CONFIG = {
  maxRecordCount: 10000,         // Maximum records to render
  updateDelay: 300,              // Debounce delay for updates (ms)
  enableClustering: true,        // Enable clustering by default
  clusterZoomThreshold: 12,      // Disable clustering above this zoom
  lazyLoadThreshold: 1000,       // Use lazy loading above this count
};

// Popup template configuration
export const POPUP_CONFIG = {
  maxWidth: 320,
  maxHeight: 400,
  dockEnabled: true,
  dockPosition: 'top-right' as const,
  collapseEnabled: true,
  showThumbnails: true,
  showCertifications: true,
};

// Basemap options
export const BASEMAP_OPTIONS = {
  streets: 'streets-vector',
  satellite: 'satellite',
  hybrid: 'hybrid',
  topo: 'topo-vector',
  gray: 'gray-vector',
  dark: 'dark-gray-vector',
  osm: 'osm',
  terrain: 'terrain'
};
