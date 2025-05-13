import axios from "axios";

const API_URL = 'http://192.168.0.156:3000'

interface RegisterData {
    email: string;
    password: string;
    userName: string;
    fullName: string;
}

export const loginHandler = async (email: string, password: string) => {
    try {
        const response = await axios.post(API_URL + '/auth/login', {
            email,
            password
        });
        return response;
    } catch (error) {
        console.error('Error en loginHandler:', error);
        throw error;
    }
}

export const registerHandler = async (data: RegisterData) => {
    try {
        const response = await axios.post(API_URL + '/auth/register', data);
        return response;
    } catch (error) {
        console.error('Error en registerHandler:', error);
        throw error;
    }
}