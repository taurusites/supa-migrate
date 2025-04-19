import React from "react";
import Wizard from "../components/Wizard";
import { Container, Typography } from "@mui/material";

const HomePage = () => {
  return (
    <Container maxWidth="md" className="py-8">
      <Typography variant="h4" align="center" gutterBottom>
        Supabase Migration Tool
      </Typography>
      <Wizard />
    </Container>
  );
};

export default HomePage;