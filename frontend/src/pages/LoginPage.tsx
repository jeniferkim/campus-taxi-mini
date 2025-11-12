import { useState } from "react";
import { postLogin } from "../apis/auth";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await postLogin({ email, password });
      setUser(res.data);
      alert(`로그인 성공: ${res.data.name}`);
    } catch {
      alert("로그인 실패");
    }
  };

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-3 max-w-sm mx-auto mt-16">
      <input
        placeholder="이메일"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 rounded"
      />
      <input
        placeholder="비밀번호"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 rounded"
      />
      <button type="submit" className="bg-blue-500 text-white p-2 rounded">
        로그인
      </button>
    </form>
  );
}
