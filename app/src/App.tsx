import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Onboarding from './pages/Onboarding';
import Embed from './pages/Embed';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/signin" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
      <Route path="/embed" element={<RequireAuth><Embed /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/signin" replace />} />
    </Routes>
  );
}
