import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Shell from './components/Shell';
import Login from './pages/Login';
import Overview from './pages/Overview';
import Restaurants from './pages/Restaurants';
import Customers from './pages/Customers';
import Tickets from './pages/Tickets';
import Settings from './pages/Settings';
import AuditLog from './pages/AuditLog';

function Protected({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <Shell>{children}</Shell>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected><Overview /></Protected>} />
      <Route path="/restaurants" element={<Protected><Restaurants /></Protected>} />
      <Route path="/customers" element={<Protected><Customers /></Protected>} />
      <Route path="/tickets" element={<Protected><Tickets /></Protected>} />
      <Route path="/settings" element={<Protected><Settings /></Protected>} />
      <Route path="/audit-log" element={<Protected><AuditLog /></Protected>} />
    </Routes>
  );
}
