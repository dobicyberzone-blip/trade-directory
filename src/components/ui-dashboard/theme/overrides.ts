import { Theme } from '@mui/material/styles';

export default function componentsOverrides(theme: Theme, borderRadius: number) {
  return {
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: `${borderRadius}px`,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.12)',
            transform: 'translateY(-1px)'
          }
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
        },
        rounded: {
          borderRadius: `${borderRadius}px`
        },
        elevation1: {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: `${borderRadius * 1.5}px`,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: `1px solid ${theme.palette.divider}`,
          '&:hover': {
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            transform: 'translateY(-2px)'
          },
          transition: 'all 0.2s ease-in-out'
        }
      }
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          color: theme.palette.text.primary,
          padding: '24px',
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`
        },
        title: {
          fontSize: '1.25rem',
          fontWeight: 600,
          color: theme.palette.text.primary
        },
        subheader: {
          color: theme.palette.text.secondary
        }
      }
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '24px'
        }
      }
    },
    MuiCardActions: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
          background: theme.palette.grey[50]
        }
      }
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          color: theme.palette.text.primary,
          paddingTop: '12px',
          paddingBottom: '12px',
          borderRadius: `${borderRadius}px`,
          margin: '2px 8px',
          '&.Mui-selected': {
            color: theme.palette.text.primary,
            backgroundColor: theme.palette.primary.light,
            fontWeight: 600,
            '&:hover': {
              backgroundColor: theme.palette.primary.light
            },
            '& .MuiListItemIcon-root': {
              color: theme.palette.primary.main
            },
            '& .MuiListItemText-primary': {
              color: theme.palette.text.primary
            }
          },
          '&:hover': {
            backgroundColor: theme.palette.warning.light,
            color: theme.palette.text.primary,
            transform: 'translateX(4px)',
            '& .MuiListItemIcon-root': {
              color: theme.palette.primary.main
            }
          },
          transition: 'all 0.2s ease-in-out'
        }
      }
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: theme.palette.mode === 'dark' ? '#FFFFFF' : theme.palette.text.primary,
          minWidth: '40px',
          '& svg, & .MuiSvgIcon-root': {
            color: theme.palette.mode === 'dark' ? '#FFFFFF' : theme.palette.text.primary
          }
        }
      }
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          color: theme.palette.text.primary,
          fontWeight: 500
        },
        secondary: {
          color: theme.palette.text.secondary
        }
      }
    },
    MuiInputBase: {
      styleOverrides: {
        input: {
          color: theme.palette.text.primary,
          '&::placeholder': {
            color: theme.palette.text.secondary,
            fontSize: '0.875rem',
            opacity: 1
          }
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          background: theme.palette.background.paper,
          borderRadius: `${borderRadius}px`,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.divider
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main,
            borderWidth: '2px'
          },
          '&.MuiInputBase-multiline': {
            padding: 1
          }
        },
        input: {
          fontWeight: 500,
          padding: '14px 16px',
          borderRadius: `${borderRadius}px`,
          '&.MuiInputBase-inputSizeSmall': {
            padding: '10px 14px',
            '&.MuiInputBase-inputAdornedStart': {
              paddingLeft: 0
            }
          }
        },
        inputAdornedStart: {
          paddingLeft: 4
        },
        notchedOutline: {
          borderRadius: `${borderRadius}px`
        }
      }
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          '&.Mui-disabled': {
            color: theme.palette.grey[300]
          }
        },
        mark: {
          backgroundColor: theme.palette.background.paper,
          width: '4px'
        },
        valueLabel: {
          color: theme.palette.primary.contrastText,
          backgroundColor: theme.palette.primary.main
        }
      }
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: theme.palette.divider,
          opacity: 1
        }
      }
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          color: theme.palette.primary.contrastText,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          fontWeight: 600
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          '&.MuiChip-deletable .MuiChip-deleteIcon': {
            color: 'inherit'
          }
        },
        colorPrimary: {
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: theme.palette.primary.contrastText
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          color: theme.palette.background.paper,
          background: theme.palette.text.primary,
          borderRadius: `${borderRadius}px`,
          fontSize: '0.875rem',
          fontWeight: 500
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          borderBottom: `1px solid ${theme.palette.divider}`
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: theme.palette.mode === 'dark' 
            ? theme.palette.background.paper 
            : `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
          borderRight: `1px solid ${theme.palette.divider}`
        }
      }
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: theme.palette.grey[50],
          '& .MuiTableCell-root': {
            color: theme.palette.text.primary,
            fontWeight: 700,
            fontSize: '0.875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            borderBottom: `2px solid ${theme.palette.divider}`
          }
        }
      }
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root': {
            backgroundColor: theme.palette.background.paper,
            '&:hover': {
              backgroundColor: theme.palette.action.hover
            },
            '&:nth-of-type(even)': {
              backgroundColor: theme.palette.grey[50]
            }
          }
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          color: theme.palette.text.primary,
          borderBottom: `1px solid ${theme.palette.divider}`,
          padding: '16px',
          fontSize: '0.875rem'
        },
        head: {
          color: theme.palette.text.primary,
          fontWeight: 700,
          backgroundColor: theme.palette.grey[50]
        }
      }
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          color: theme.palette.text.primary
        },
        h1: {
          color: theme.palette.text.primary,
          fontWeight: 700
        },
        h2: {
          color: theme.palette.text.primary,
          fontWeight: 700
        },
        h3: {
          color: theme.palette.text.primary,
          fontWeight: 600
        },
        h4: {
          color: theme.palette.text.primary,
          fontWeight: 600
        },
        h5: {
          color: theme.palette.text.primary,
          fontWeight: 600
        },
        h6: {
          color: theme.palette.text.primary,
          fontWeight: 600
        },
        body1: {
          color: theme.palette.text.primary
        },
        body2: {
          color: theme.palette.text.primary
        },
        subtitle1: {
          color: theme.palette.text.secondary
        },
        subtitle2: {
          color: theme.palette.text.secondary
        },
        caption: {
          color: theme.palette.text.secondary
        }
      }
    },
    // Chart and SVG text elements
    MuiSvgIcon: {
      styleOverrides: {
        root: {
          color: theme.palette.text.primary
        }
      }
    },
    // IconButton - Consistent white icons in dark mode with hover opacity
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s ease-in-out',
          // In dark mode, icons should be white by default
          color: theme.palette.mode === 'dark' ? '#FFFFFF' : theme.palette.text.primary,
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
            // Full opacity on hover
            '& svg, & .MuiSvgIcon-root': {
              opacity: 1
            }
          },
          '& svg, & .MuiSvgIcon-root': {
            // Slightly reduced opacity in default state for subtle look
            opacity: theme.palette.mode === 'dark' ? 0.85 : 1,
            transition: 'opacity 0.2s ease-in-out, color 0.2s ease-in-out'
          }
        }
      }
    }
  };
}