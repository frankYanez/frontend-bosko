import { loginHandler, registerHandler } from "@/Functions/Login"
import { createContext, useContext, useState } from "react"

interface AuthContextType {
    login: (credentials: { email: string, password: string }) => Promise<any>;
    register: (data: { email: string, password: string, userName: string, fullName: string }) => Promise<any>;
    isLoading: boolean;
    error: string | null;
    accessToken: string | null;
    refreshToken: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null)

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [accessToken, setAccessToken] = useState<string | null>(null)
    const [refreshToken, setRefreshToken] = useState<string | null>(null)

    const login = async ({ email, password }: { email: string, password: string }) => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await loginHandler(email, password)
            if (response.data?.accessToken) {
                setAccessToken(response.data.accessToken)
                setRefreshToken(response.data.refreshToken)
            }
            return response
        } catch (error: any) {
            const message = error.response?.data?.message || 'Error al iniciar sesión'
            setError(message)
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const register = async (data: { email: string, password: string, userName: string, fullName: string }) => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await registerHandler(data)
            if (response.data?.accessToken) {
                setAccessToken(response.data.accessToken)
                setRefreshToken(response.data.refreshToken)
            }
            return response
        } catch (error: any) {
            const message = error.response?.data?.message || 'Error al registrar usuario'
            setError(message)
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AuthContext.Provider value={{ login, register, isLoading, error, accessToken, refreshToken }}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthProvider