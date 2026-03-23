'use client';
// material-ui
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

// ==============================|| LOADER ||============================== //

export default function BerryLoader() {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1301,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default'
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <CircularProgress 
          size={60}
          thickness={4}
          sx={{ 
            color: 'primary.main',
            mb: 3
          }} 
        />
        <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 500 }}>
          Loading Dashboard...
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
          Please wait
        </Typography>
      </Box>
    </Box>
  );
}