import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import { googleClientId } from './components/common/constant.ts';
import { AppProvider } from './context/AppContext.tsx';
import "leaflet/dist/leaflet.css";
import { SocketProvider } from './context/SocketContext.tsx';
import { AdminAuthProvider } from './admin/context/AdminAuthContext.tsx';
import { AdminSocketProvider } from './admin/context/AdminSocketContext.tsx';

createRoot(document.getElementById('root')!).render(
      <StrictMode>
            <GoogleOAuthProvider clientId={googleClientId}>
                  <AdminAuthProvider>
                        <AdminSocketProvider>
                              <AppProvider>
                                    <SocketProvider>
                                          <App />
                                    </SocketProvider>
                              </AppProvider>
                        </AdminSocketProvider>
                  </AdminAuthProvider>
                  <Toaster />
            </GoogleOAuthProvider>
      </StrictMode>,
);
