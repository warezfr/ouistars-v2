import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layout/AdminLayout';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import Quotes from './pages/Quotes';
import Pricing from './pages/Pricing';
import Documents from './pages/Documents';
import Drivers from './pages/Drivers';
import Applications from './pages/Applications';
import Vehicles from './pages/Vehicles';
import './admin.css';

/**
 * Back-office Oui Stars.
 * Note: l'authentification (Supabase Auth + rôles) est à brancher — voir docs/BACKOFFICE.md.
 */
export default function AdminApp() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="quotes" element={<Quotes />} />
        <Route path="pricing" element={<Pricing />} />
        <Route path="documents" element={<Documents />} />
        <Route path="drivers" element={<Drivers />} />
        <Route path="applications" element={<Applications />} />
        <Route path="vehicles" element={<Vehicles />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}
