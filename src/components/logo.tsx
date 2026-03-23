import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Typography, Box } from '@mui/material';

export function Logo({ 
  className, 
  isLight = false,
  showText = true,
  text = "",
  size = 'medium',
  priority = false,
  variant = 'default'
}: { 
  className?: string, 
  isLight?: boolean,
  showText?: boolean,
  text?: string,
  size?: 'small' | 'medium' | 'large',
  priority?: boolean,
  variant?: 'default' | 'footer'
}) {
  const logoSrc = variant === 'footer' ? "/KEPROBA_FOOTER.png" : "/Keproba-logo.png";
  
  const sizeConfig = {
    small: { 
      width: { mobile: 240, desktop: 280 }, 
      height: { mobile: 96, desktop: 112 }, 
      textSize: 'body1' as const 
    },
    medium: { 
      width: { mobile: 360, desktop: 400 }, 
      height: { mobile: 144, desktop: 160 }, 
      textSize: 'h6' as const 
    },
    large: { 
      width: { mobile: 480, desktop: 500 }, 
      height: { mobile: 192, desktop: 375 }, 
      textSize: 'h5' as const 
    }
  };
  
  const config = sizeConfig[size];
  
  return (
    <Box className={cn("flex items-center gap-2", className)} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
       <Image 
          src={logoSrc} 
          alt="KEPROBA Logo" 
          width={config.width.desktop} 
          height={config.height.desktop}
          priority={priority}
          className={cn(
            'h-auto w-auto object-contain transition-all duration-300',
            // Mobile sizes - significantly increased for better mobile visibility
            size === 'small' && 'max-h-24 sm:max-h-28 md:max-h-32',
            size === 'medium' && 'max-h-36 sm:max-h-40 md:max-h-44',
            size === 'large' && 'max-h-48 sm:max-h-56 md:max-h-64 lg:max-h-72 xl:max-h-80'
          )}
          style={{ 
            height: 'auto', 
            width: 'auto', 
            maxWidth: '100%',
            objectFit: 'contain'
          }}
          sizes="(max-width: 640px) 280px, (max-width: 768px) 360px, (max-width: 1024px) 480px, 600px"
        />
      {showText && (
        <Typography 
          variant={config.textSize}
          sx={{ 
            fontWeight: 700,
            color: isLight ? 'white' : 'text.primary',
            display: { xs: 'none', sm: 'block' }
          }}
        >
          {text}
        </Typography>
      )}
    </Box>
  );
}