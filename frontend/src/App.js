import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';

import HomePage from './modules/home/HomePage';
import SiteFooter from './modules/home/components/SiteFooter';
import LiquidNavbar from './components/LiquidNavbar';
import StudioPage from './modules/studio/StudioPage';

function LegacyStudioRedirect() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const moduleId = params.get('module');
  const target = ['llm', 'vector', 'rag'].includes(moduleId) ? `/query/${moduleId}` : '/query/rag';

  return <Navigate to={target} replace />;
}

function AppContent({ mode, toggleMode }) {
  const location = useLocation();
  const isModernRoute = location.pathname === '/' || location.pathname.startsWith('/query') || location.pathname.startsWith('/studio');

  return (
    <>
      <CssBaseline />

      {isModernRoute ? <LiquidNavbar mode={mode} toggleMode={toggleMode} /> : null}

      <Box
        component="main"
        sx={{
          mt: isModernRoute ? 0 : 10,
          px: isModernRoute ? 0 : 2,
          pb: isModernRoute ? 0 : 6,
          pt: isModernRoute ? 0 : undefined,
        }}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/studio" element={<LegacyStudioRedirect />} />
          <Route path="/query/llm" element={<StudioPage />} />
          <Route path="/query/vector" element={<StudioPage />} />
          <Route path="/query/rag" element={<StudioPage />} />
        </Routes>
      </Box>

      {isModernRoute ? <SiteFooter /> : null}
    </>
  );
}

export default function App() {
  const [mode, setMode] = useState('light');

  const theme = useMemo(() => createTheme({
    palette: { mode },
  }), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <AppContent mode={mode} toggleMode={() => setMode(prev => prev === 'light' ? 'dark' : 'light')} />
      </Router>
    </ThemeProvider>
  );
}
