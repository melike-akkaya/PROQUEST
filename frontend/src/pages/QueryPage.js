import React, { useState } from 'react';
import { Box, Tabs, Tab, Fade } from '@mui/material';
import LLMQuery from '../components/LLMQuery';
import VectorSearch from '../components/VectorSearch';

export default function QueryPage() {
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <Box>
      <Tabs
        value={tabIndex}
        onChange={(e, v) => setTabIndex(v)}
        textColor="primary"
        indicatorColor="primary"
        centered
      >
        <Tab label="LLM Query" />
        <Tab label="Vector Search" />
      </Tabs>
      <Box sx={{ mt: 2, p: 3 }}>
        <Fade in={tabIndex === 0} unmountOnExit>
          <div>{tabIndex === 0 && <LLMQuery />}</div>
        </Fade>
        <Fade in={tabIndex === 1} unmountOnExit>
          <div>{tabIndex === 1 && <VectorSearch />}</div>
        </Fade>
      </Box>
    </Box>
  );
}
