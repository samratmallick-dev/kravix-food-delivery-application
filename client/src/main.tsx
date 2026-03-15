import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import { googleClientId } from './components/common/constant.ts';
import { AppProvider } from './context/AppContext.tsx';

createRoot(document.getElementById('root')!).render(
      <StrictMode>
            <GoogleOAuthProvider clientId={googleClientId}>
                  <AppProvider>
                        <App />
                  </AppProvider>
                  <Toaster />
            </GoogleOAuthProvider>
      </StrictMode>,
);
