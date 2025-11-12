import { useCallback } from "react";

export default function useToast() {
  const show = useCallback((msg: string) => {
    // 최소 구현: alert 대체. 나중에 UI 라이브러리로 교체해도 됨
    // eslint-disable-next-line no-alert
    alert(msg);
  }, []);
  return { show };
}