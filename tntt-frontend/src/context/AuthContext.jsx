import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

function decodeJwt(token) {
  try {
    const base64Payload = token.split('.')[1];
    return JSON.parse(atob(base64Payload));
  } catch {
    return null;
  }
}

function isTokenValid(token) {
  const payload = decodeJwt(token);
  if (!payload || !payload.exp) return false;
  return payload.exp * 1000 > Date.now();
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Khôi phục trạng thái đăng nhập khi F5 trang
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token && isTokenValid(token)) {
      const payload = decodeJwt(token);
      setUser({ username: payload.sub });
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem('accessToken');
    }
  }, []);

  function login(accessToken, userData = null) {
    localStorage.setItem('accessToken', accessToken);
    const userInfo = userData ?? { username: decodeJwt(accessToken)?.sub };
    setUser(userInfo);
    setIsAuthenticated(true);
  }

  function logout() {
    localStorage.removeItem('accessToken');
    setUser(null);
    setIsAuthenticated(false);
  }

  const value = { user, isAuthenticated, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được dùng bên trong AuthProvider');
  }
  return context;
}
