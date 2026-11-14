import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ChatsPage from "./pages/ChatsPage.jsx";
import ConversationView from "./pages/ConversationView.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import PeoplePage from "./pages/PeoplePage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import UserProfilePage from "./pages/UserProfilePage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Everything inside here requires a logged-in user. */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/chats" replace />} />
          <Route path="/chats" element={<ChatsPage />}>
            <Route path=":conversationId" element={<ConversationView />} />
          </Route>
          <Route path="/people" element={<PeoplePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/users/:userId" element={<UserProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
