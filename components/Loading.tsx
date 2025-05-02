import React from "react";
import { Box, CircularProgress } from "@mui/material";

export default function Loading() {
  return (
    <Box className="flex justify-center py-8">
      <CircularProgress />
    </Box>
  );
}