import { View, Text, StyleSheet, FlatList, Dimensions } from 'react-native'
import React from 'react'
import { Image } from 'expo-image'
import Fonts from '@/constants/Fonts'
import Styles from '@/constants/Components'
import Carousel, {
    ICarouselInstance,
    Pagination,
} from "react-native-reanimated-carousel";
import { useSharedValue } from 'react-native-reanimated';
import { PaginationItem } from 'react-native-reanimated-carousel/lib/typescript/components/Pagination/Basic/PaginationItem';
import { useAuth } from '../context/AuthContext';
import { Pressable, TextInput } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import Button from '@mui/material/Button';

const data = [...new Array(6).keys()];
const width = Dimensions.get("window").width;

export default function Index() {
    const ref = React.useRef<ICarouselInstance>(null);
    const progress = useSharedValue<number>(1);
    const { login } = useAuth()

    const onPressPagination = (index: number) => {
        ref.current?.scrollTo({

            count: index - progress.value,
            animated: true,
        });
    };

    return (
        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
            <Carousel
                data={[<LoginView />, <WelcomeView />, <RegisterPage />]}
                loop={false}
                renderItem={({ item }) => item}
                width={width}
                height={width * 1.5}
                ref={ref}
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' }}
                pagingEnabled={true}
                snapEnabled={true}


            />
            <Pagination.Basic
                progress={progress}
                data={data}
                dotStyle={{ backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 50 }}
                containerStyle={{ gap: 5, marginTop: 10 }}
                onPress={onPressPagination}
            />

        </View>
    )
}

const WelcomeView = () => {

    return (
        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
            <Image source={require('../../assets/images/bosko-logo.png')} style={{ width: 100, height: 100 }} />
            <Text style={styles.textPrincipal}>Bosko</Text>
            <Image source={require('../../assets/images/girl-login.svg')} style={{ width: 300, height: 300 }} />
            <View style={styles.container}>

                <Text style={styles.textPrincipal}>Descubre los profesionales locales</Text>
                <Text style={styles.text}>Encuentra los proveedores de varios servicios en tu ciudad y conecta con ellos</Text>
            </View>
        </View>
    )
}

const LoginView = () => {
    const { login } = useAuth()
    const [email, setEmail] = React.useState('')
    const [password, setPassword] = React.useState('')

    const handleLogin = async () => {

        const response = await login({ email, password })

        console.log('response', response);
        const data = response.data
        console.log('data', data);

        if (data) {
            router.push('/(tabs)/two')
        }
    }
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Boska</Text>
            <TextInput placeholder='E-mail' value={email} placeholderTextColor={'gray'} onChangeText={setEmail} style={styles.input} />
            <TextInput placeholder='Password' value={password} placeholderTextColor={'gray'} onChangeText={setPassword} style={styles.input} />
            {/* <Pressable onPress={handleLogin} >
                <Text style={{ fontFamily: Fonts.fonts.thin, fontWeight: "200", fontSize: 18, color: '#000', textAlign: 'center' }}>Login</Text>
            </Pressable> */}
            <Button title='Login' onPress={handleLogin} />

        </View>
    )
}

const RegisterPage = () => {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={styles.text}>Register</Text>
            <Image source={require('../../assets/images/bosko-logo.png')} style={{ width: 100, height: 100 }} />
            <Text style={styles.text}>Bosko</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    text: {
        fontFamily: Fonts.fonts.thin,
        fontWeight: "200",
        fontSize: 18,
        color: '#000',
        textAlign: 'center',
    },
    textPrincipal: {
        fontFamily: Fonts.fonts.medium,
        fontWeight: "500",
        fontSize: 30,
        textAlign: 'center',
    },
    container: {
        width: '90%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        gap: 10,
    },
    input: {
        borderColor: 'gray',
        borderWidth: 2,
        maxWidth: 200,
        width: '100%',
        textAlign: 'center',
        borderRadius: 10,
        padding: 10,
    }
})