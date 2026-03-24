import React from 'react';
import { Box, Stack } from '@mui/material';

import useStudioPageState from './hooks/useStudioPageState';
import LlmStudioPanel from './panels/LlmStudioPanel';
import RagStudioPanel from './panels/RagStudioPanel';
import VectorStudioPanel from './panels/VectorStudioPanel';

export default function StudioPage() {
  const { activeModule, activeModuleMeta, shellStyles, rag, llm, vector } = useStudioPageState();

  return (
    <Box className="studio-shell" sx={shellStyles}>
      <Box
        sx={{
          maxWidth: activeModule === 'rag' ? 1540 : ['llm', 'vector'].includes(activeModule) ? 1560 : 1080,
          mx: 'auto',
          px: { xs: 2, md: 3 },
          pt: { xs: 13, md: 15 },
          pb: { xs: 1.5, md: 2.25 },
        }}
      >
        <Stack spacing={3}>
          {activeModule === 'rag' ? <RagStudioPanel meta={activeModuleMeta} state={rag} /> : null}
          {activeModule === 'llm' ? <LlmStudioPanel meta={activeModuleMeta} state={llm} /> : null}
          {activeModule === 'vector' ? <VectorStudioPanel meta={activeModuleMeta} state={vector} /> : null}
        </Stack>
      </Box>
    </Box>
  );
}
