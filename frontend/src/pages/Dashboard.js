import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Dashboard = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Bem-vindo ao Sistema de Gestão de Frota
        </Typography>
        <Typography variant="body1">
          Este é seu painel. Use o menu de navegação para acessar diferentes funcionalidades.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Dashboard; 