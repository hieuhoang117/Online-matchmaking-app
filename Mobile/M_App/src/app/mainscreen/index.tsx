import { View, Text, Button, Pressable } from "react-native"
import { useAuth } from '../../context/authContext';
import { useRouter } from 'expo-router';

export default function mainscreen() {
    const { logout } = useAuth();
    const router = useRouter();
    const handlelogout = async () => {
        await logout();
        router.replace("/login");
    }
    return (
        <View>

            <Pressable onPress={handlelogout}
                style={{ margin: 100, alignSelf: "center" }}>
                <Text>dang xuat</Text>
            </Pressable>
        </View>
    )
}