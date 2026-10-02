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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<Layout />}>
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