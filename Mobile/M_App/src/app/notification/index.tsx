import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/authContext'
import { Pressable } from 'react-native'
import MenuMain from '../../component/menuMain';

export default function NotificationScreen() {
    const { logout } = useAuth();
    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>Thông báo</Text>
            </View>
            <Pressable onPress={logout} style={{ padding: 20, backgroundColor: '#FFFEFF', alignItems: 'center' }}>
                <Text style={{ color: '#3E3034', fontSize: 16 }}>Đăng xuất</Text>
            </Pressable>
            <View style={styles.content}>
                <Text style={styles.message}>Màn hình thông báo đang được hoàn thiện.</Text>
            </View>
            <MenuMain activeKey="activity" />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFF9FC',
    },
    header: {
        height: 66,
        paddingHorizontal: 20,
        justifyContent: 'center',
        backgroundColor: '#FFFEFF',
    },
    title: {
        color: '#3E3034',
        fontSize: 22,
        fontWeight: '700',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    message: {
        color: '#806F74',
        fontSize: 15,
        textAlign: 'center',
    },
});