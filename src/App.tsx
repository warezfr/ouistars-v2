import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { I18nProvider } from './i18n';
import HomePage from './pages/HomePage';

// Back-office chargé à la demande : le site public n'embarque plus son code.
const AdminApp = lazy(() => import('./admin/AdminApp'));

function AdminFallback() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f4f4f6', color: '#666', fontFamily: 'sans-serif' }}>
      Chargement du back-office…
    </div>
  );
}
import { initLivePricing } from './lib/livePricing';

export default function App() {
  // Synchronise la grille tarifaire avec le back-office (repli statique sinon).
  useEffect(() => { initLivePricing(); }, []);

  return (
    <I18nProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin/*" element={<Suspense fallback={<AdminFallback />}><AdminApp /></Suspense>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  );
}
