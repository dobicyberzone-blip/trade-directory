'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

export default function GoogleTranslate() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Check if Google Translate is already loaded
    if (typeof window !== 'undefined' && (window as any).google?.translate) {
      setIsLoaded(true);
    }
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = (error: any) => {

    setHasError(true);
    setIsLoaded(false);
  };

  const initializeTranslate = () => {
    try {
      if (typeof window !== 'undefined' && (window as any).google?.translate) {
        new (window as any).google.translate.TranslateElement({
          pageLanguage: 'en',
          includedLanguages: 'en,af,sq,am,ar,hy,az,eu,be,bn,bs,bg,ca,ceb,zh-CN,zh-TW,co,hr,cs,da,nl,eo,et,fil,fi,fr,fy,gl,ka,de,el,gu,ht,ha,haw,he,hi,hmn,hu,is,ig,id,ga,it,ja,jw,kn,kk,km,rw,ko,ku,ky,lo,la,lv,lt,lb,mk,mg,ms,ml,mt,mi,mr,mn,my,ne,no,or,ps,fa,pl,pt,pa,ro,ru,sm,gd,sr,st,sn,sd,si,sk,sl,so,es,su,sw,sv,tg,ta,te,th,tr,uk,ur,ug,uz,vi,cy,xh,yi,yo,zu',
          layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false
        }, 'google_translate_element');
      }
    } catch (error) {

    }
  };

  return (
    <>
      {!hasError && (
        <>
          <Script
            src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
            strategy="lazyOnload"
            onLoad={handleLoad}
            onError={handleError}
          />
          <Script
            id="google-translate-init"
            strategy="lazyOnload"
            dangerouslySetInnerHTML={{
              __html: `
                window.googleTranslateElementInit = function() {
                  try {
                    if (typeof google !== 'undefined' && google.translate) {
                      new google.translate.TranslateElement({
                        pageLanguage: 'en',
                        includedLanguages: 'en,af,sq,am,ar,hy,az,eu,be,bn,bs,bg,ca,ceb,zh-CN,zh-TW,co,hr,cs,da,nl,eo,et,fil,fi,fr,fy,gl,ka,de,el,gu,ht,ha,haw,he,hi,hmn,hu,is,ig,id,ga,it,ja,jw,kn,kk,km,rw,ko,ku,ky,lo,la,lv,lt,lb,mk,mg,ms,ml,mt,mi,mr,mn,my,ne,no,or,ps,fa,pl,pt,pa,ro,ru,sm,gd,sr,st,sn,sd,si,sk,sl,so,es,su,sw,sv,tg,ta,te,th,tr,uk,ur,ug,uz,vi,cy,xh,yi,yo,zu',
                        layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                        autoDisplay: false
                      }, 'google_translate_element');
                    }
                  } catch (error) {

                  }
                };
              `,
            }}
          />
        </>
      )}
      
      {/* Hidden Google Translate element container */}
      <div 
        id="google_translate_element" 
        style={{ 
          position: 'absolute', 
          left: '-9999px',
          visibility: 'hidden'
        }}
      />
    </>
  );
}