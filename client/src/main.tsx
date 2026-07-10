import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import { googleClientId } from './components/common/constant.ts';
import { AppProvider } from './context/AppContext.tsx';
import { SocketProvider } from './context/SocketContext.tsx';
import { AdminAuthProvider } from './admin/context/AdminAuthContext.tsx';
import { AdminSocketProvider } from './admin/context/AdminSocketContext.tsx';
import { HelmetProvider } from 'react-helmet-async';

window.addEventListener('unhandledrejection', (event) => {
    console.error('[Kravix] Unhandled promise rejection:', event.reason);
});

window.addEventListener('error', (event) => {
    console.error('[Kravix] Global error:', event.message, event.filename, event.lineno);
});

createRoot(document.getElementById('root')!).render(
      <HelmetProvider>
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
      </HelmetProvider>
);
