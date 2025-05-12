import axios from "axios";

const API_URL = 'http://192.168.0.156:3000'


export const loginHandler = async (email: string, password: string) => {
    try {
        const response = await axios.post(API_URL + '/auth/login', {
            email: email,
            password: password
        })


        const data = await response.data;
        console.log('data desde loginHandler', data);

        return data;
    } catch (error) {

        console.log('Error en loginHandler', error);

    }
}