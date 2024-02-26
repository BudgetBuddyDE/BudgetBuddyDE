import * as React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import { Navbar } from './components/navbar.component';
import { Copyright } from './components/copyright.component';
import { Home } from './routes/home.route';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          overflow: 'auto',
          height: '100vh',
          backgroundColor: (theme) => theme.palette.background.default,
        }}
      >
        <Navbar />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </Container>
        <Box
          component="div"
          sx={{
            mt: 'auto',
          }}
        >
          <Copyright />
        </Box>
      </Box>
    </BrowserRouter>
  );
};
