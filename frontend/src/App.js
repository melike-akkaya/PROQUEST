import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';

import HomePage from './modules/home/HomePage';
import LLMQuery from './components/LLMQuery';
import RAG from './components/RAG';
import VectorSearch from './components/VectorSearch';
import SiteFooter from './modules/home/components/SiteFooter';
import LiquidNavbar from './components/LiquidNavbar';
import StudioPage from './modules/studio/StudioPage';
import Footer from './components/Footer';
import Navbar from './components/Navbar';

function AppContent({ mode, toggleMode }) {
  const location = useLocation();
  const isModernRoute = location.pathname === '/' || location.pathname.startsWith('/studio');

  return (
    <>
      <CssBaseline />

      {isModernRoute ? (
        <LiquidNavbar mode={mode} toggleMode={toggleMode} />
      ) : (
        <Navbar mode={mode} toggleMode={toggleMode} />
      )}

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
          <Route path="/studio" element={<StudioPage />} />
          <Route path="/query/llm" element={<LLMQuery />} />
          <Route path="/query/vector" element={<VectorSearch />} />
          <Route path="/query/rag" element={<RAG />} />
        </Routes>
      </Box>

      {isModernRoute ? <SiteFooter /> : <Footer />}
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
