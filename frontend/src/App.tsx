import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

import { Home } from './pages/Home';
import { TrainBooking } from './pages/TrainBooking';
import { MyBookings } from './pages/MyBookings';
import { StationsPanel } from './pages/admin/StationsPanel';
import { RoutesPanel } from './pages/admin/RoutesPanel';
import { TrainsPanel } from './pages/admin/TrainsPanel';

// Компонент для захисту роутів користувачів
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div style={{ padding: '2rem' }}>Завантаження...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

// Компонент для захисту роутів адміністратора
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  if (isLoading) return <div style={{ padding: '2rem' }}>Завантаження...</div>;
  if (!isAuthenticated || !isAdmin) return <Navigate to="/" replace />;
  return children;
};

// Тимчасовий Layout (Header)
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ backgroundColor: 'white', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link to="/" style={{ fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--color-primary)' }}>
            TicketBooking
          </Link>
          {isAdmin && (
            <nav style={{ display: 'flex', gap: '1rem', borderLeft: '1px solid var(--color-border)', paddingLeft: '2rem' }}>
              <Link to="/admin/stations" style={{ color: 'var(--color-text-main)', fontSize: '0.875rem' }}>Станції</Link>
              <Link to="/admin/routes" style={{ color: 'var(--color-text-main)', fontSize: '0.875rem' }}>Маршрути</Link>
              <Link to="/admin/trains" style={{ color: 'var(--color-text-main)', fontSize: '0.875rem' }}>Потяги</Link>
            </nav>
          )}
        </div>
        <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          {isAuthenticated ? (
            <>
              <Link to="/my-bookings" style={{ color: 'var(--color-text-main)', fontWeight: 500 }}>Мої квитки</Link>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', borderLeft: '1px solid var(--color-border)', paddingLeft: '1.5rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>{user?.name}</span>
                {isAdmin && (
                  <span style={{ backgroundColor: 'var(--color-danger)', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem' }}>Admin</span>
                )}
                <button onClick={logout} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.875rem' }}>Вийти</button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" style={{ color: 'var(--color-text-main)' }}>Увійти</Link>
              <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: '500' }}>Реєстрація</Link>
            </>
          )}
        </nav>
      </header>
      <main style={{ flex: 1, backgroundColor: 'var(--color-background)' }}>
        {children}
      </main>
    </div>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Публічні роути */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Роути з Layout */}
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/trains/:trainId/book" element={<Layout><TrainBooking /></Layout>} />
      
      {/* Захищені роути */}
      <Route path="/my-bookings" element={<ProtectedRoute><Layout><MyBookings /></Layout></ProtectedRoute>} />
      
      {/* Адмін роути */}
      <Route path="/admin/stations" element={<AdminRoute><Layout><StationsPanel /></Layout></AdminRoute>} />
      <Route path="/admin/routes" element={<AdminRoute><Layout><RoutesPanel /></Layout></AdminRoute>} />
      <Route path="/admin/trains" element={<AdminRoute><Layout><TrainsPanel /></Layout></AdminRoute>} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
