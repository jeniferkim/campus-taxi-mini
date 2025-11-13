import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { postLogout } from "../apis/auth";
import { FiHome, FiLogOut, FiUser } from "react-icons/fi";

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
    <nav className="bg-white shadow-md border-b-4 border-green-600">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-green-600 to-emerald-600 p-2 rounded-lg">
              <FiHome className="text-white text-2xl" />
            </div>
            <Link to="/" className="text-2xl font-bold text-green-700">
              🚕 Campus Taxi
            </Link>
          </div>


          <div className="flex items-center space-x-4">
            {/* user 객체가 존재할 때만 “마이페이지”와 “로그아웃” 버튼을 렌더링 */}
            {user ? (
              <>
                <button className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors">
                  <FiUser className="text-lg" />
                  <span className="font-medium">{user.name} 님</span>
                </button>
                {/* 마이페이지 버튼 */}
                <button 
                    onClick={() => nav("/me")}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                >
                  <FiLogOut className="text-lg" />
                  <span className="font-medium">마이페이지</span>
                </button>
                {/* 로그아웃 버튼 */}
                <button 
                    onClick={onLogout}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                >
                  <FiLogOut className="text-lg" />
                  <span className="font-medium">로그아웃</span>
                </button>
              </>
            ) : (
              <>
                <button 
                    onClick={() => nav("/login")}
                    className="px-4 py-2 text-green-700 font-medium hover:text-green-800"
                >
                  로그인
                </button>
                <button 
                    onClick={() => nav("/signup")}
                    className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
                >
                  회원가입
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
