import { createBrowserRouter, RouterProvider, type RouteObject } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import RoomListPage from "./pages/RoomListPage";
import CreateRoomPage from "./pages/CreateRoomPage";

import SignupPage from "./pages/SignupPage";
import MyPage from "./pages/MyPage";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./libs/queryClient";
import NotFoundPage from "./pages/NotFoundPage";
import ProtectedLayout from "./layouts/ProtectedLayout";
import HomeLayout from "./layouts/HomeLayout";


// 루트 하나만: HomeLayout이 전체 레이아웃을 담당
const routes: RouteObject[] = [
  {
    path: "/",
    element: <HomeLayout />,
    errorElement: <NotFoundPage />,
    children: [
      // 🔓 공개 라우트
      { index: true, element: <RoomListPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignupPage /> },

      // 🔒 보호 라우트
      {
        element: <ProtectedLayout />,
        children: [
          { path: "create", element: <CreateRoomPage /> },    
          { path: "me", element: <MyPage /> },   
        ],
      },
    ],
  },
];

const router = createBrowserRouter(routes);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  )
}
