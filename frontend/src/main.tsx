// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./libs/queryClient";
import "./index.css";

async function enableMocking() {
  // env 로 토글할 수 있도록 플래그 하나 두자
  if (
    import.meta.env.MODE !== "development" || // 개발 모드가 아니면
    import.meta.env.VITE_USE_MSW !== "true"   // 또는 플래그가 false면
  ) {
    return;
  }

  const { worker } = await import("./mocks/browser");

  // onUnhandledRequest: 'bypass' → 정의 안 된 API는 그냥 실제 서버로 보냄
  await worker.start({
    onUnhandledRequest: "bypass",
  });
}

enableMocking().then(() => {
  ReactDOM.createRoot(
    document.getElementById("root") as HTMLElement
  ).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </React.StrictMode>
  );
});
