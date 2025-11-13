// src/layouts/ProtectedLayout.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useRef } from "react";

const ProtectedLayout = () => {
  const location = useLocation();
  const alertShownRef = useRef(false);

  const { user, isLoading } = useAuth();
  const isLoggedIn = Boolean(user);

  useEffect(() => {
    if (!isLoading && !isLoggedIn && !alertShownRef.current) {
      alert("로그인이 필요한 서비스입니다. 로그인 후 이용해주세요~");
      alertShownRef.current = true;
    }
  }, [isLoading, isLoggedIn]);

  // 사용자 정보 로딩 중이면 아무것도 렌더링하지 않음
  if (isLoading) {
    return null;
  }

  // 로그인 안 되어 있으면 로그인 페이지로 이동
  if (!isLoggedIn) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          // 로그인 성공 후 돌려보낼 경로
          from: location.pathname + location.search,
        }}
      />
    );
  }

  // 보호된 라우트 정상 렌더링
  return <Outlet />;
};

export default ProtectedLayout;