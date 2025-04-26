import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  IconButton,
  Box,
  useTheme,
} from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

export default function Navbar({ mode, toggleMode }) {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const currentTab = location.pathname.includes('/query/vector') ? 1
    : location.pathname.includes('/query/llm') ? 0
    : false;

  const handleTabChange = (_, newValue) => {
    if (newValue === 0) navigate('/query/llm');
    if (newValue === 1) navigate('/query/vector');
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backgroundColor: theme.palette.mode === 'dark'
          ? 'rgba(15,15,15,0.9)'
          : '#f9f9f9',
        borderBottom: theme => `1px solid ${theme.palette.divider}`, // <<< BU ÇİZGİ
        backdropFilter: 'blur(10px)',
        color: theme.palette.mode === 'dark' ? '#fff' : '#111',
        fontFamily: '"Poppins", "Inter", "Rubik", sans-serif',
      }}
    >
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        {/* Logo */}
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            textDecoration: 'none',
            color: 'inherit',
            fontWeight: 700,
            fontFamily: '"Poppins", "Inter", "Rubik", sans-serif',
          }}
        >
          ProQuest
        </Typography>

        {/* Ortalanmış Tabs */}
        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            TabIndicatorProps={{ style: { display: 'none' } }}
            sx={{
              minHeight: 48,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                fontFamily: '"Poppins", "Inter", "Rubik", sans-serif',
                px: 3,
                py: 1,
                minWidth: 130,
                transition: 'color 0.3s ease',
              },
              '& .MuiTab-root.Mui-selected': {
                backgroundClip: 'text',
                textFillColor: 'transparent',
                backgroundImage: currentTab === 0
                  ? (theme.palette.mode === 'dark'
                      ? 'linear-gradient(90deg,rgb(191, 122, 255), #5aa5f5)'
                      : 'linear-gradient(90deg,rgb(166, 74, 247), #3698e3)')
                  : (theme.palette.mode === 'dark'
                      ? 'linear-gradient(90deg,rgb(92, 81, 245),rgb(96, 255, 242))'
                      : 'linear-gradient(90deg,rgb(69, 84, 245),rgb(91, 255, 219))'),
                fontWeight: 700,
              },
              '& .MuiTab-root:hover': {
                color: theme.palette.mode === 'dark' ? '#ccc' : '#444',
              },
            }}
          >
            <Tab label="LLM Query" />
            <Tab label="Vector Search" />
          </Tabs>
        </Box>

        {/* Sağda mod değiştirme butonu */}
        <IconButton color="inherit" onClick={toggleMode}>
          {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}
