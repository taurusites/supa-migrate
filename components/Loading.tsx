import React from "react";
import { CircularProgress, Box } from "@mui/material";

export default function Loading() {
  return (
    <Box className="flex justify-center py-8">
      <CircularProgress />
    </Box>
  );
}