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
  };

  return (
    <nav className="flex justify-between items-center p-4 bg-gray-100 border-b">
      <Link to="/" className="font-bold text-lg text-gray-800 hover:text-blue-700">
        🚕 Campus Taxi
      </Link>

      <div className="flex gap-4 items-center text-sm">
        {/* user 객체가 존재할 때만 “마이페이지”와 “로그아웃” 버튼을 렌더링 */}
        {user ? ( 
          <>
            <span className="text-gray-700">{user.name} 님</span>

            {/* 마이페이지 버튼 (로그인 상태에서만 노출) */}
            <button
              onClick={() => nav("/me")}
              className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              마이페이지
            </button>

            <button
              onClick={onLogout}
              className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition"
            >
              로그아웃
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="text-blue-600 hover:underline transition"
            >
              로그인
            </Link>
            <Link
              to="/signup"
              className="text-blue-600 hover:underline transition"
            >
              회원가입
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
