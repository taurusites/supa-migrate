import React from "react";
import { Box, Button, Paper } from "@mui/material";
import { download } from "../utils/download";

interface Props {
  sql: string;
  onBack: () => void;
}

export default function SQLViewer({ sql, onBack }: Props) {
  const handleCopy = () => {
    if (navigator) navigator.clipboard.writeText(sql);
  };
  const handleDownload = () => download(sql, "migration.sql", "text/sql");

  return (
    <Box>
      <Paper className="p-4 mb-4 overflow-auto max-h-96" variant="outlined">
        <pre className="whitespace-pre-wrap">{sql}</pre>
      </Paper>
      <Box className="flex justify-between">
        <Button onClick={onBack}>Back</Button>
        <Box>
          <Button onClick={handleCopy} className="mr-2">
            Copy
          </Button>
          <Button variant="contained" onClick={handleDownload}>
            Download
          </Button>
        </Box>
      </Box>
    </Box>
  );
}