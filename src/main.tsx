import {CssBaseline, ThemeProvider} from '@mui/material';
import React from 'react';
import ReactDOM from 'react-dom/client';

import {AuthProvider} from '@/features/Auth';
import {SnackbarProvider} from '@/features/Snackbar/index.ts';
import '@/style/global.css';

import App from './App.tsx';
import {AppConfig} from './app.config.ts';

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
  </React.StrictMode>,
);
