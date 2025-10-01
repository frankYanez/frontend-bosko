import { login, register } from "@/services/auth";
import { refreshTokenService, validateTokenService } from "@/services/auth";
import { router } from "expo-router";
import { deleteItemAsync, getItemAsync, setItemAsync } from "expo-secure-store";
import { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";

interface AuthContextType {
  login: (credentials: { email: string; password: string }) => Promise<any>;
  register: (data: FormData) => Promise<any>;
  isLoading: boolean;
  error: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  authLoaded: boolean;
  authState: {
    token: string | null;
    refreshToken: string | null;
    userEmail: string | null;
  };
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [authState, setAuthState] = useState<{
    token: string | null;
    refreshToken: string | null;
    userEmail: string | null;
  }>({
    token: null,
    refreshToken: null,
    userEmail: null,
  });

  const loginFn = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await login({ email, password });

      if (response.accessToken) {
        setAccessToken(response.accessToken);
        setRefreshToken(response.refreshToken);

        await setItemAsync("token", response.accessToken);
        await setItemAsync("refreshToken", response.refreshToken);
        await setItemAsync("userEmail", email);
      }
      return response;
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Error al iniciar sesión";
      setError(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const registerFn = async (data: FormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        name: data.get("name") as string,
        email: data.get("email") as string,
        password: data.get("password") as string,
      };

      const response = await register(payload);

      if (response.accessToken) {
        setAccessToken(response.accessToken);
        setRefreshToken(response.refreshToken);

        await setItemAsync("token", response.accessToken);
        await setItemAsync("refreshToken", response.refreshToken);
        await setItemAsync("userEmail", payload.email);
      }
      return response;
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Error al registrar usuario";
      setError(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await deleteItemAsync("token");
    await deleteItemAsync("refreshToken");
    await deleteItemAsync("userEmail");
    setAuthState({ token: null, refreshToken: null, userEmail: null });
    setAccessToken(null);
    setRefreshToken(null);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedToken = await getItemAsync("token");
        const savedRefreshToken = await getItemAsync("refreshToken");
        const savedUserEmail = await getItemAsync("userEmail");

        if (!savedToken || !savedRefreshToken || !savedUserEmail) {
          router.push("/login");
          await logout();
          return;
        }

        setAuthState({
          token: savedToken,
          refreshToken: savedRefreshToken,
          userEmail: savedUserEmail,
        });

        //NO ESTA ESTE ENDPOINT
        // const validation = await validateTokenService();

        // if (validation === 200) {
        //   setAuthLoaded(true);
        //   return;
        // }

        setAuthLoaded(true);

        const refreshed = await refreshTokenService(savedRefreshToken);

        if (refreshed) {
          await setItemAsync("token", refreshed);
          setAuthState({
            token: refreshed,
            refreshToken: savedRefreshToken,
            userEmail: savedUserEmail,
          });
        } else {
          console.warn("No se pudo refrescar el token.");
          await logout();
        }
      } catch (error) {
        console.error("Error en checkAuth:", error);
        await logout();
      } finally {
        setAuthLoaded(true);
      }
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        login: loginFn,
        register: registerFn,
        isLoading,
        error,
        accessToken,
        refreshToken,
        authLoaded,
        authState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
