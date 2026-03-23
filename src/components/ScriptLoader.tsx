'use client';

import Script from 'next/script';

export default function ScriptLoader() {
  const handleArcGISError = (e: any) => {

  };

  return (
    <>
      {/* ArcGIS 4.31 Script - Load lazily after page is interactive */}
      <Script
        src="https://js.arcgis.com/4.31/"
        strategy="lazyOnload"
        id="arcgis-script"
        onError={handleArcGISError}
      />
    </>
  );
}