import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Box, CssBaseline, AppBar, Toolbar, Typography } from '@mui/material';
import Home from './pages/Home';
import QueryPage from './pages/QueryPage';
import Footer from './components/Footer';

export default function App() {
  return (
    <Router>
      <CssBaseline />
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" component={Link} to="/" sx={{ color: 'inherit', textDecoration: 'none' }}>
            ProQuest
          </Typography>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1, mt: 8 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/query" element={<QueryPage />} />
        </Routes>
      </Box>

      <Footer />
    </Router>
  );
}
