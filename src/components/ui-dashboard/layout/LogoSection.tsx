'use client';

import Link from 'next/link';
import Image from 'next/image';

// material-ui
import ButtonBase from '@mui/material/ButtonBase';
import Box from '@mui/material/Box';
// project imports
import config from '../config';

// ==============================|| MAIN LOGO ||============================== //

export default function LogoSection() {
  
  return (
    <ButtonBase 
      disableRipple 
      component={Link} 
      href={config.defaultPath}
      sx={{
        borderRadius: '8px',
        padding: '12px 16px',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'scale(1.02)',
          backgroundColor: 'rgba(0, 0, 0, 0.02)'
        }
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        minHeight: '60px'
      }}>
        <Image 
          src="/Keproba-logo.png" 
          alt="KEPROBA" 
          width={240}
          height={60}
          style={{ 
            height: 'auto', 
            width: '240px',
            maxHeight: '60px',
            objectFit: 'contain',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}
          priority
        />
      </Box>
    </ButtonBase>
  );
}