import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { api } from './lib/api';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import WarRoomPage from './pages/WarRoomPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AdminPage from './pages/AdminPage';
import RoastFeedPage from './pages/RoastFeedPage';
import BunkerPage from './pages/BunkerPage';
import BunkerJoinPage from './pages/BunkerJoinPage';
import LivePage from './pages/LivePage';
import PostsPage from './pages/PostsPage';
import PollsPage from './pages/PollsPage';
import ProfilePage from './pages/ProfilePage';
import BottomNav from './components/ui/BottomNav';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    hydrate();
  }, []);

  // After hydration (token exists), fetch user profile
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (token && !user) {
      api.auth.me()
        .then((profile) => setAuth(token, profile as any))
        .catch(() => useAuthStore.getState().logout());
    }
  }, [token, user]);

  return (
    <div className="min-h-screen bg-wz-bg">
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/live" element={<ProtectedRoute><LivePage /></ProtectedRoute>} />
        <Route path="/posts" element={<ProtectedRoute><PostsPage /></ProtectedRoute>} />
        <Route path="/polls" element={<ProtectedRoute><PollsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
        <Route path="/roasts" element={<ProtectedRoute><RoastFeedPage /></ProtectedRoute>} />
        <Route path="/war-room/:id" element={<ProtectedRoute><WarRoomPage /></ProtectedRoute>} />
        <Route path="/bunkers/:id" element={<ProtectedRoute><BunkerPage /></ProtectedRoute>} />
        <Route path="/join/:code" element={<ProtectedRoute><BunkerJoinPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Bottom Navigation — auto-hides on immersive pages */}
      {isAuthenticated && <BottomNav />}
    </div>
  );
}
