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
import MatchingPage from "./phase2/MatchingPage";
import Phase2ExpensesPage from "./phase2/ExpensesPage";
import { mode } from "./phase2/mode";
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
        <Route path="/roommates" element={mode === "baseline" ? <RoommatesPage /> : <MatchingPage />} />
        <Route path="/room" element={<RoomPage />} />
        <Route path="/expenses" element={mode === "baseline" ? <ExpensesPage /> : <Phase2ExpensesPage />} />
      </Route>
    </Routes>
  );
}