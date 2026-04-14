import { createContext, useContext, useState, useCallback } from "react";
import { loadUser, logoutUser, type User } from "./auth";

interface AuthCtx {
  user: User | null;
  refresh: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  refresh: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => loadUser());

  const refresh = useCallback(() => {
    setUser(loadUser());
  }, []);

  const logout = useCallback(() => {
    logoutUser();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
