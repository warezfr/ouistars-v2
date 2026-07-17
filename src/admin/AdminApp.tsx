import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layout/AdminLayout';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import { mountAdminLTE } from './adminlte';

import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import Quotes from './pages/Quotes';
import Pricing from './pages/Pricing';
import Documents from './pages/Documents';
import Applications from './pages/Applications';
import Users from './pages/Users';
import Clients from './pages/Clients';
import Invoices from './pages/Invoices';
import Placeholder from './pages/Placeholder';

import CollectionList from './cms/CollectionList';
import CollectionEditor from './cms/CollectionEditor';
import SingletonEditor from './cms/SingletonEditor';

import './admin-overrides.css';

/**
 * Back-office Oui Stars — thème AdminLTE 4 (chargé uniquement ici).
 * Authentifié (Supabase Auth + rôles). Contenu du site piloté par le CMS.
 */
export default function AdminApp() {
  useEffect(() => mountAdminLTE(), []);

  return (
    <AuthProvider>
      <ProtectedRoute>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route index element={<Dashboard />} />

            <Route path="bookings" element={<Bookings />} />
            <Route path="quotes" element={<Quotes />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="documents" element={<Documents />} />
            <Route path="applications" element={<Applications />} />
            <Route path="users" element={<Users />} />
            <Route path="clients" element={<Clients />} />
            <Route path="invoices" element={<Invoices />} />

            <Route path="content/:collection" element={<CollectionList />} />
            <Route path="content/:collection/:id" element={<CollectionEditor />} />
            <Route path="singleton/:key" element={<SingletonEditor />} />

            <Route path="soon/:label" element={<Placeholder />} />

            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Routes>
      </ProtectedRoute>
    </AuthProvider>
  );
}
