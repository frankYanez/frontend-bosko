import axios from "axios";

export const API_URL = 'http://50.16.93.238:3000'

interface RegisterData {
    email: string;
    password: string;
    userName: string;
    fullName: string;
}

export const loginHandler = async (email: string, password: string) => {
    console.log(email,password);
    
    try {
        const response = await axios.post(API_URL + '/auth/login', {
            email,
            password
        });
        console.log(response);
        
        return response;
    } catch (error) {
        console.error('Error en loginHandler:', error);
        throw error;
    }
}

export const registerHandler = async (data: FormData) => {
    
    
    try {
        const response = await axios.post(API_URL + '/auth/register', data, );
        return response;
    } catch (error) {
        console.error('Error en registerHandler:', error);
        throw error;
    }
}