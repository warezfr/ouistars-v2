import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layout/AdminLayout';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';

import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import Quotes from './pages/Quotes';
import Pricing from './pages/Pricing';
import Documents from './pages/Documents';
import Drivers from './pages/Drivers';
import Applications from './pages/Applications';
import Vehicles from './pages/Vehicles';
import Placeholder from './pages/Placeholder';

import CollectionList from './cms/CollectionList';
import CollectionEditor from './cms/CollectionEditor';
import SingletonEditor from './cms/SingletonEditor';

import './admin.css';

/**
 * Back-office Oui Stars — authentifié (Supabase Auth + rôles).
 * Contenu du site piloté par le CMS générique (/admin/content/:collection),
 * modules métier dédiés, et placeholders pour l'architecture cible.
 */
export default function AdminApp() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route index element={<Dashboard />} />

            {/* Modules métier existants */}
            <Route path="bookings" element={<Bookings />} />
            <Route path="quotes" element={<Quotes />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="documents" element={<Documents />} />
            <Route path="drivers" element={<Drivers />} />
            <Route path="applications" element={<Applications />} />
            <Route path="vehicles" element={<Vehicles />} />

            {/* CMS générique */}
            <Route path="content/:collection" element={<CollectionList />} />
            <Route path="content/:collection/:id" element={<CollectionEditor />} />
            <Route path="singleton/:key" element={<SingletonEditor />} />

            {/* Modules planifiés */}
            <Route path="soon/:label" element={<Placeholder />} />

            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Routes>
      </ProtectedRoute>
    </AuthProvider>
  );
}
