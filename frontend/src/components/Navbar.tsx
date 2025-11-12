import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  return (
    <nav className="flex justify-between p-4 bg-gray-100">
      <Link to="/" className="font-bold">🚕 Campus Taxi</Link>
      <div>
        {user ? (
          <span className="text-gray-700">안녕하세요, {user.name}님</span>
        ) : (
          <Link to="/login" className="text-blue-500">로그인</Link>
        )}
      </div>
    </nav>
  );
}
