import React from 'react';
import {
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  IconButton,
  Box,
  useTheme,
} from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import logo from '../assets/logo.png';

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
        borderBottom: theme => `1px solid ${theme.palette.divider}`,
        backdropFilter: 'blur(10px)',
        color: theme.palette.mode === 'dark' ? '#fff' : '#111',
        fontFamily: '"Poppins", "Inter", "Rubik", sans-serif',
      }}
    >
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        {/* Logo */}
        <Box
          component={Link}
          to="/"
          sx={{
            display: 'block',
            width: 140,
            height: 'auto',
            textDecoration: 'none',
            color: 'inherit',
            my: 2,
            transition: 'transform 0.2s ease',
            '&:active': {
              transform: 'scale(0.95)',
            },
          }}
        >

          <Box
            component="img"
            src={logo}
            alt="logo"
            sx={{
              width: '100%',
              height: 'auto',
              filter: theme.palette.mode === 'dark'
                ? 'brightness(0) saturate(100%) invert(100%) sepia(0%) hue-rotate(180deg)'
                : 'none',
            }}
          />

        </Box>

        {/* Centered Tabs */}
        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', mr: 12 }}>
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
              opacity: 1,
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
            '& .Mui-disabled': {
              color: theme.palette.mode === 'dark' ? '#666' : '#aaa',
              cursor: 'default',
              pointerEvents: 'none',
              opacity: 0.6,
            },
          }}
        >
          <Tab label="LLM Query" />
          <Tab label="Vector Search" />
          <Tab label="RAG" disabled />
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
