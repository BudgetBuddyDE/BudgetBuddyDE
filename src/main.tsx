import React from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import '@/style/global.css';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { AuthProvider } from '@/core/Auth';
import { SnackbarProvider } from './core/Snackbar';
import { AppConfig } from './app.config.ts';

const Wrapper = () => (
  <ThemeProvider theme={AppConfig.theme}>
    <AuthProvider>
      <SnackbarProvider>
        <App />
      </SnackbarProvider>
    </AuthProvider>
    <CssBaseline />
  </ThemeProvider>
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Wrapper />
    <Analytics />
    <SpeedInsights />
  </React.StrictMode>
);
