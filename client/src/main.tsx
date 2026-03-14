import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AppProvider } from './context/AppContext.tsx';

createRoot(document.getElementById('root')!).render(
      <StrictMode>
            <GoogleOAuthProvider clientId="861656642222-1cihjl7lbdq352at57406021jpbcr8i0.apps.googleusercontent.com">
                  <AppProvider>
                        <App />
                  </AppProvider>
            </GoogleOAuthProvider>
      </StrictMode>,
);
