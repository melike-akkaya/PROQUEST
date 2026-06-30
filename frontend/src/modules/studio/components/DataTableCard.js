import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Pagination,
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
  pageSize = null,
}) {
  const theme = useTheme();
  const [page, setPage] = useState(1);
  const paginationEnabled = Number.isFinite(pageSize) && pageSize > 0 && rows?.length > pageSize;
  const totalPages = paginationEnabled ? Math.ceil(rows.length / pageSize) : 1;
  const visibleRows = paginationEnabled
    ? rows.slice((page - 1) * pageSize, page * pageSize)
    : rows;

  useEffect(() => {
    setPage(1);
  }, [rows, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

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
        <>
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
                {visibleRows.map((row, rowIndex) => {
                  const absoluteRowIndex = paginationEnabled
                    ? (page - 1) * pageSize + rowIndex
                    : rowIndex;

                  return (
                    <TableRow key={absoluteRowIndex} hover>
                      {Object.entries(row).map(([column, value]) => (
                        <TableCell
                          key={`${absoluteRowIndex}-${column}`}
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
                  );
                })}
              </TableBody>
            </Table>
          </Box>

          {paginationEnabled ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2.25 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, nextPage) => setPage(nextPage)}
                color="primary"
                size="small"
                shape="rounded"
                hidePrevButton
                hideNextButton
                sx={{
                  '& .MuiPaginationItem-root': {
                    minWidth: 34,
                    height: 34,
                    borderRadius: '999px',
                    color: theme.palette.mode === 'dark' ? '#d7e0ef' : '#33425c',
                    border: `1px solid ${
                      theme.palette.mode === 'dark' ? alpha('#ffffff', 0.08) : alpha(accent, 0.12)
                    }`,
                    backgroundColor:
                      theme.palette.mode === 'dark' ? alpha('#ffffff', 0.03) : alpha(accent, 0.03),
                  },
                  '& .MuiPaginationItem-root.Mui-selected': {
                    color: theme.palette.mode === 'dark' ? '#f4f7fb' : '#11203b',
                    borderColor: alpha(accent, 0.42),
                    backgroundColor: alpha(accent, theme.palette.mode === 'dark' ? 0.22 : 0.14),
                  },
                  '& .MuiPaginationItem-root.Mui-selected:hover': {
                    backgroundColor: alpha(accent, theme.palette.mode === 'dark' ? 0.28 : 0.18),
                  },
                  '& .MuiPaginationItem-ellipsis': {
                    border: 'none',
                    backgroundColor: 'transparent',
                  },
                }}
              />
            </Box>
          ) : null}
        </>
      )}
    </Paper>
  );
}
