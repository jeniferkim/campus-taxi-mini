import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import RoomListPage from "./pages/RoomListPage";
import CreateRoomPage from "./pages/CreateRoomPage";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<RoomListPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/create" element={<ProtectedRoute><CreateRoomPage /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
