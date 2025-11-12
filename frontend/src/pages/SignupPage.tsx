import { useState } from "react";
import { postSignup } from "../apis/auth";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function SignupPage() {
  const { setUser } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await postSignup({ email, password, name });
    setUser({ _id: res.data.userId, email: res.data.email, name: res.data.name });
    alert("회원가입 완료!");
    nav("/");
  };

  return (
    <form onSubmit={onSubmit} className="max-w-sm mx-auto p-4 flex flex-col gap-3">
      <h2 className="text-xl font-bold mb-2">회원가입</h2>
      <input placeholder="이메일" value={email} onChange={e=>setEmail(e.target.value)} className="border p-2 rounded" />
      <input placeholder="이름" value={name} onChange={e=>setName(e.target.value)} className="border p-2 rounded" />
      <input placeholder="비밀번호" type="password" value={password} onChange={e=>setPassword(e.target.value)} className="border p-2 rounded" />
      <button className="bg-blue-600 text-white p-2 rounded">가입하기</button>
    </form>
  );
}
