import { useCallback } from "react";

export default function useToast() {
  // 기본 alert 대체 → 나중에 UI 라이브러리로 교체해도 됨
  const success = useCallback((msg: string) => {
    alert(`✅  ${msg}`);
  }, []);

  const error = useCallback((msg: string) => {
    alert(`❌  ${msg}`);
  }, []);

  const info = useCallback((msg: string) => {
    alert(`ℹ️  ${msg}`);
  }, []);

  return { success, error, info };
}