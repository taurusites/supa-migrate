import React from "react";
import { Box, Paper, Typography, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

interface Props {
  credentials: any;
  schemas: any[];
  selection: any[];
  sql: string;
}

export default function DebugPanel({ credentials, schemas, selection, sql }: Props) {
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <Box className="mt-8">
      <Paper className="p-4">
        <Typography variant="h6" gutterBottom>Debug Information</Typography>
        
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Credentials Status</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <pre>{JSON.stringify({
              hasCredentials: !!credentials,
              urlValid: credentials?.url?.startsWith('https://'),
              keyLength: credentials?.key?.length || 0
            }, null, 2)}</pre>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Schemas ({schemas.length})</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <pre>{JSON.stringify(schemas, null, 2)}</pre>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Selection ({selection.filter(s => s.selected).length} selected)</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <pre>{JSON.stringify(selection.filter(s => s.selected), null, 2)}</pre>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Generated SQL ({sql.length} chars)</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <pre className="whitespace-pre-wrap max-h-64 overflow-auto">{sql.substring(0, 1000)}{sql.length > 1000 ? '...' : ''}</pre>
          </AccordionDetails>
        </Accordion>
      </Paper>
    </Box>
  );
}