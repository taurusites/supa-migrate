import React from "react";
import { Container, Typography } from "@mui/material";
import Wizard from "../components/Wizard";

export default function Home() {
  return (
    <Container maxWidth="md" className="py-8">
      <Typography variant="h4" align="center" gutterBottom>
        Supabase Migration Tool
      </Typography>
      <Wizard />
    </Container>
  );
}