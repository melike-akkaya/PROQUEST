import React from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import { downloadCsv } from '../utils/studioHelpers';

export default function DataTableCard({
  title,
  subtitle,
  rows,
  filename,
  accent = '#5677ff',
  cellRenderers = {},
  emptyMessage = 'No data available.',
}) {
  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 6,
        border: `1px solid ${theme.palette.mode === 'dark' ? alpha('#ffffff', 0.08) : alpha(accent, 0.1)}`,
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(145deg, rgba(20,27,39,0.94) 0%, rgba(13,18,28,0.98) 100%)'
          : 'linear-gradient(145deg, rgba(255,255,255,0.96) 0%, rgba(247,250,255,0.94) 100%)',
        backdropFilter: 'blur(18px)',
        boxShadow: theme.palette.mode === 'dark'
          ? `0 24px 54px ${alpha('#000000', 0.2)}`
          : `0 24px 54px ${alpha(accent, 0.08)}`,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 1.5,
          mb: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: theme.palette.mode === 'dark' ? '#f4f7fb' : '#11203b' }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{ color: theme.palette.mode === 'dark' ? '#9aa8bf' : '#5b6982', mt: 0.5, fontSize: '0.9rem' }}>
              {subtitle}
            </Typography>
          )}
        </Box>

        {!!rows?.length && filename && (
          <Button
            size="small"
            startIcon={<DownloadRoundedIcon fontSize="small" />}
            onClick={() => downloadCsv(filename, rows)}
            sx={{
              borderRadius: '999px',
              textTransform: 'none',
              color: accent,
              backgroundColor: alpha(accent, 0.08),
              '&:hover': {
                backgroundColor: alpha(accent, 0.14),
              },
            }}
          >
            Export CSV
          </Button>
        )}
      </Box>

      {!rows?.length ? (
        <Typography sx={{ color: theme.palette.mode === 'dark' ? '#9aa8bf' : '#6a7890', fontSize: '0.94rem' }}>{emptyMessage}</Typography>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                {Object.keys(rows[0]).map((column) => (
                  <TableCell
                    key={column}
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.mode === 'dark' ? '#f4f7fb' : '#11203b',
                      borderBottomColor: alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.6 : 1),
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {column}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, rowIndex) => (
                <TableRow key={rowIndex} hover>
                  {Object.entries(row).map(([column, value]) => (
                    <TableCell
                      key={`${rowIndex}-${column}`}
                      sx={{
                        color: theme.palette.mode === 'dark' ? '#d7e0ef' : '#33425c',
                        borderBottomColor: alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.45 : 0.7),
                        verticalAlign: 'top',
                      }}
                    >
                      {cellRenderers[column]
                        ? cellRenderers[column](value, row)
                        : (value ?? '').toString()}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Paper>
  );
}
