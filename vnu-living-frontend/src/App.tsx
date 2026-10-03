import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import ExpensesPage from "./pages/ExpensesPage";
import LoginPage from "./pages/LoginPage";
import OnboardingPage from "./pages/OnboardingPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import RoommatesPage from "./pages/RoommatesPage";
import RoomPage from "./pages/RoomPage";
import { authApi } from "./services/api";

function ProtectedRoute() {
  const token = authApi.getToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Layout />;
}

function PublicRoute({ children }: { children: React.ReactElement }) {
  const token = authApi.getToken();
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/roommates" element={<RoommatesPage />} />
        <Route path="/room" element={<RoomPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
      </Route>
    </Routes>
  );
}