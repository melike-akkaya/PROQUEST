// App.js
import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';

import Home from './pages/Home';
import LLMQuery from './components/LLMQuery';
import VectorSearch from './components/VectorSearch';
import Footer from './components/Footer';
import Navbar from './components/Navbar';

export default function App() {
  const [mode, setMode] = useState('light');

  const theme = useMemo(() => createTheme({
    palette: { mode },
  }), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <CssBaseline />
        <Navbar mode={mode} toggleMode={() => setMode(prev => prev === 'light' ? 'dark' : 'light')} />

        <Box component="main" sx={{ mt: 10, px: 2, pb: 6 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/query/llm" element={<LLMQuery />} />
            <Route path="/query/vector" element={<VectorSearch />} />
          </Routes>
        </Box>

        <Footer />
      </Router>
    </ThemeProvider>
  );
}
