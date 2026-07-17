import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { I18nProvider } from './i18n';
import HomePage from './pages/HomePage';
import AdminApp from './admin/AdminApp';
import { initLivePricing } from './lib/livePricing';

export default function App() {
  // Synchronise la grille tarifaire avec le back-office (repli statique sinon).
  useEffect(() => { initLivePricing(); }, []);

  return (
    <I18nProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin/*" element={<AdminApp />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  );
}
