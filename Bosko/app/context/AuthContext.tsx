import { loginHandler } from "@/Functions/Login"
import { createContext, useContext } from "react"

const AuthContext = createContext<any>(null)

export const useAuth = () => {
    return useContext(AuthContext)
}


export const AuthProvider = ({ children }: { children: React.ReactNode }) => {


    const login = async ({ email, password }: { email: string, password: string }) => {
        console.log('name desde login auth', name);

        const response = await loginHandler(email, password)


        const data = response.data
        console.log('Datos desde el provider' + data)

    }

    return (
        <AuthContext.Provider value={{ login }}>
            {children}
        </AuthContext.Provider>
    )
}


export default AuthProvider