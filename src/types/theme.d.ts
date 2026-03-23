import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Typography {
    commonAvatar?: React.CSSProperties;
    smallAvatar?: React.CSSProperties;
    mediumAvatar?: React.CSSProperties;
    largeAvatar?: React.CSSProperties;
  }
}
