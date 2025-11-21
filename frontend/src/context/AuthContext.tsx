import { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  type ReactNode 
} from "react";
import { getMyInfo } from "../apis/auth";
import type { User } from "../types/auth";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 앱 처음 시작할 때 로그인 상태 확인
  useEffect(() => {
    const fetchMyInfo = async () => {
      try {
        const res = await getMyInfo();
        setUser(res.data.user);
        // user state 모양은 항상 { _id: string; email: string; name: string }
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMyInfo();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
