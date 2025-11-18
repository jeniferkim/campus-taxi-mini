import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { postLogin } from "../apis/auth";
import { useAuth } from "../context/AuthContext";
import { FiUser } from "react-icons/fi";

export default function LoginPage() {
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  // ProtectedLayout에서 Navigate 할 때 넣어준 값
  const from = (location.state as { from?: string } | null)?.from || "/";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await postLogin({ email, password });
      // 세션 기반이라면, 서버에서 쿠키(sid)를 내려주고
      // 프론트에서는 user 정보만 상태로 들고 있으면 됨
      setUser(res.data.user);

      alert(`로그인에 성공했어요. 환영합니다, ${res.data.user.name}님!`);
      // 원래 가려던 페이지로 이동 (없으면 "/")
      navigate(from, { replace: true });
    } catch {
      alert("로그인에 실패했습니다. 이메일과 비밀번호를 다시 확인해주세요.");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border-t-4 border-green-600">
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-br from-green-600 to-emerald-600 p-4 rounded-full mb-4">
            <FiUser className="text-white text-4xl" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">로그인</h2>
          <p className="text-gray-600">택시 동승으로 편리한 이동을 시작하세요</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이메일
            </label>
            <input
              placeholder="your@email.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              비밀번호
            </label>
            <input
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
          >
            로그인
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            계정이 없으신가요?{" "}
            <Link
              to="/signup"
              className="text-green-600 font-semibold hover:text-green-700"
            >
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}