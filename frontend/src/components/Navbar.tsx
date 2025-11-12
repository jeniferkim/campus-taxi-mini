import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { postLogout } from "../apis/auth";


export default function Navbar() {
  const { user, isLoading, setUser } = useAuth();
  const nav = useNavigate();

  if (isLoading) return null;

  const onLogout = async () => {
    await postLogout();
    setUser(null);
    nav("/login");
  }

  return (
    <nav className="flex justify-between p-4 bg-gray-100">
      <Link to="/" className="font-bold">🚕 Campus Taxi</Link>
      <button onClick={() => nav("/signup")} className="text-black-600">회원가입</button>
      <div className="flex gap-3 items-center">
        {user ? (
          <>
            <span className="text-gray-700">안녕하세요, {user.name}님</span>
            <button onClick={onLogout} className="text-red-600">로그아웃</button>
          </>
        ) : (
          <Link to="/login" className="text-blue-600">로그인</Link>
        )}
      </div>
    </nav>
  );
}
