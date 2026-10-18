import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const formatBirthDate = (date: Date) =>
    [date.getDate(), date.getMonth() + 1, date.getFullYear()]
        .map((part) => String(part).padStart(2, '0'))
        .join('/');

const getMaximumBirthDate = () => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setFullYear(date.getFullYear() - 18);
    return date;
};

const getMinimumBirthDate = () => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setFullYear(date.getFullYear() - 100);
    return date;
};

const icons = {
    back: { ios: 'arrow.left', android: 'arrow_back', web: 'arrow_back' },
    heart: { ios: 'heart', android: 'favorite', web: 'favorite' },
    sparkle: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
    person: { ios: 'person.fill', android: 'person', web: 'person' },
    mail: { ios: 'envelope', android: 'mail', web: 'mail' },
    calendar: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
    lock: { ios: 'lock.fill', android: 'lock', web: 'lock' },
    hidden: { ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' },
    verified: { ios: 'checkmark.seal.fill', android: 'verified_user', web: 'verified_user' },
    arrow: { ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' },
} as const;

export default function RegisterScreen() {
    const router = useRouter();
    const maximumBirthDate = getMaximumBirthDate();
    const minimumBirthDate = getMinimumBirthDate();
    const [birthDate, setBirthDate] = useState<Date | null>(null);
    const [pickerDate, setPickerDate] = useState(maximumBirthDate);
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);

    const openBirthDatePicker = () => {
        setPickerDate(birthDate ?? maximumBirthDate);
        setDatePickerVisible(true);
    };

    const handleDateValueChange = (_event: DateTimePickerChangeEvent, selectedDate: Date) => {
        if (Platform.OS === 'android') {
            setBirthDate(selectedDate);
            setPickerDate(selectedDate);
            setDatePickerVisible(false);
            return;
        }

        setPickerDate(selectedDate);
    };

    const handleDateDismiss = () => {
        setDatePickerVisible(false);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.header}>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Quay lại đăng nhập"
                        onPress={() => router.replace('/login')}
                        style={styles.backButton}
                    >
                        <SymbolView name={icons.back} size={25} tintColor="#5B434B" />
                    </Pressable>
                    <Text style={styles.headerTitle}>Thông tin cơ bản</Text>
                    <View style={styles.headerSpacer} />
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.screen}>

                        <View style={styles.hero}>
                            <View style={styles.brandMark}>
                                <SymbolView name={icons.heart} size={36} tintColor="#B9254C" />
                                <View style={styles.brandSparkle}>
                                    <SymbolView name={icons.sparkle} size={12} tintColor="#FFE577" />
                                </View>
                            </View>
                            <Text style={styles.title}>
                                Tham gia Amour
                            </Text>
                            <Text style={styles.subtitle}>
                                Bắt đầu hành trình tìm kiếm kết nối ý nghĩa
                            </Text>
                        </View>

                        <View style={styles.formCard}>
                            <View style={styles.field}>
                                <Text style={styles.fieldLabel}>Họ và tên</Text>
                                <View style={styles.inputWrap}>
                                    <SymbolView name={icons.person} size={19} tintColor="#90757E" style={styles.inputSymbol} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Ví dụ: Nguyễn Minh Anh"
                                        placeholderTextColor="#AA969C"
                                        autoCapitalize="words"
                                        returnKeyType="next"
                                    />
                                </View>
                            </View>

                            <View style={styles.field}>
                                <Text style={styles.fieldLabel}>Địa chỉ email</Text>
                                <View style={styles.inputWrap}>
                                    <SymbolView name={icons.mail} size={19} tintColor="#90757E" style={styles.inputSymbol} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="email@vidu.com"
                                        placeholderTextColor="#AA969C"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        returnKeyType="next"
                                    />
                                </View>
                            </View>

                            <View style={styles.field}>
                                <View style={styles.labelRow}>
                                    <Text style={styles.fieldLabel}>Ngày sinh</Text>
                                    <View style={styles.ageBadge}>
                                        <Text style={styles.ageText}>Từ 18 tuổi trở lên</Text>
                                    </View>
                                </View>
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel="Chọn ngày sinh"
                                    onPress={openBirthDatePicker}
                                    style={styles.inputWrap}
                                >
                                    <SymbolView name={icons.calendar} size={19} tintColor="#90757E" style={styles.inputSymbol} />
                                    <Text style={[styles.input, !birthDate && styles.placeholderText]}>
                                        {birthDate ? formatBirthDate(birthDate) : 'Ngày / tháng / năm'}
                                    </Text>
                                </Pressable>

                                {Platform.OS === 'android' && isDatePickerVisible && (
                                    <DateTimePicker
                                        value={pickerDate}
                                        mode="date"
                                        display="default"
                                        themeVariant="light"
                                        textColor="#2B1A20"
                                        minimumDate={minimumBirthDate}
                                        maximumDate={maximumBirthDate}
                                        onValueChange={handleDateValueChange}
                                        onDismiss={handleDateDismiss}
                                    />
                                )}
                            </View>

                            {Platform.OS === 'ios' && (
                                <Modal
                                    transparent
                                    animationType="slide"
                                    visible={isDatePickerVisible}
                                    onRequestClose={() => setDatePickerVisible(false)}
                                >
                                    <View style={styles.modalBackdrop}>
                                        <View style={styles.datePickerCard}>
                                            <View style={styles.datePickerHeader}>
                                                <Pressable onPress={() => setDatePickerVisible(false)}>
                                                    <Text style={styles.datePickerCancel}>Hủy</Text>
                                                </Pressable>
                                                <Text style={styles.datePickerTitle}>Chọn ngày sinh</Text>
                                                <Pressable
                                                    onPress={() => {
                                                        setBirthDate(pickerDate);
                                                        setDatePickerVisible(false);
                                                    }}
                                                >
                                                    <Text style={styles.datePickerConfirm}>Chọn</Text>
                                                </Pressable>
                                            </View>
                                            <DateTimePicker
                                                value={pickerDate}
                                                mode="date"
                                                display="spinner"
                                                themeVariant="light"
                                                textColor="#2B1A20"
                                                minimumDate={minimumBirthDate}
                                                maximumDate={maximumBirthDate}
                                                onValueChange={handleDateValueChange}
                                                onDismiss={handleDateDismiss}
                                            />
                                        </View>
                                    </View>
                                </Modal>
                            )}

                            <View style={styles.field}>
                                <Text style={styles.fieldLabel}>Mật khẩu</Text>
                                <View style={styles.inputWrap}>
                                    <SymbolView name={icons.lock} size={19} tintColor="#90757E" style={styles.inputSymbol} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Tạo mật khẩu (tối thiểu 8 ký tự)"
                                        placeholderTextColor="#AA969C"
                                        secureTextEntry
                                        autoCapitalize="none"
                                        returnKeyType="next"
                                    />
                                    <SymbolView name={icons.hidden} size={20} tintColor="#9B838B" style={styles.trailingSymbol} />
                                </View>
                            </View>

                            <View style={styles.field}>
                                <Text style={styles.fieldLabel}>Xác nhận mật khẩu</Text>
                                <View style={styles.inputWrap}>
                                    <SymbolView name={icons.verified} size={19} tintColor="#90757E" style={styles.inputSymbol} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Nhập lại mật khẩu"
                                        placeholderTextColor="#AA969C"
                                        secureTextEntry
                                        autoCapitalize="none"
                                        returnKeyType="done"
                                    />
                                    <SymbolView name={icons.hidden} size={20} tintColor="#9B838B" style={styles.trailingSymbol} />
                                </View>
                            </View>

                            <View style={styles.termsRow}>
                                <View style={styles.termsIcon}>
                                    <SymbolView name={icons.heart} size={16} tintColor="#FFFFFF" />
                                </View>
                                <Text style={styles.termsText}>
                                    Bằng việc đăng ký, bạn đồng ý với{' '}
                                    <Text style={styles.termsLink}>Điều khoản dịch vụ</Text>
                                    {' và '}
                                    <Text style={styles.termsLink}>Chính sách bảo mật</Text>.
                                </Text>
                            </View>

                            <View style={styles.createButton}>
                                <Text style={styles.createButtonText}>Tạo tài khoản</Text>
                                <SymbolView name={icons.arrow} size={21} tintColor="#FFFFFF" style={styles.createButtonArrow} />
                            </View>

                        </View>

                        <View style={styles.matchBadge}>
                            <Text style={styles.matchEmoji}>🌸🌿✨</Text>
                            <Text style={styles.matchText}>
                                Hơn <Text style={styles.matchCount}>42.000+</Text> cặp đôi đã tìm thấy tình yêu
                            </Text>
                        </View>

                        <Text style={styles.loginText}>
                            Đã có tài khoản? <Text onPress={() => router.replace('/login')} style={styles.loginLink}>Đăng nhập</Text>
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        backgroundColor: '#FFF8FC',
    },
    header: {
        minHeight: 58,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 22,
        backgroundColor: '#FFFAFD',
    },
    backButton: {
        width: 42,
        height: 42,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    headerSpacer: {
        width: 42,
    },
    headerTitle: {
        color: '#17151A',
        fontSize: 19,
        fontWeight: '600',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 18,
    },
    screen: {
        width: '100%',
        maxWidth: 440,
        alignSelf: 'center',
        alignItems: 'center',
    },
    trustRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    trustBadge: {
        minHeight: 30,
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        gap: 6,
    },
    trustIcon: {
        color: '#BE214A',
        fontSize: 16,
    },
    trustText: {
        color: '#634951',
        fontSize: 11,
    },
    encryptedBadge: {
        minHeight: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
        borderRadius: 18,
        backgroundColor: '#FCEAF0',
        gap: 6,
    },
    lockIcon: {
        color: '#BD1744',
        fontSize: 14,
    },
    encryptedText: {
        color: '#B91F49',
        fontSize: 11,
    },
    hero: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 19,
    },
    brandMark: {
        width: 68,
        height: 68,
        borderRadius: 34,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 9,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#FFE0E9',
        shadowColor: '#B9254C',
        shadowOpacity: 0.14,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    brandSparkle: {
        position: 'absolute',
        right: -5,
        bottom: -3,
        width: 21,
        height: 21,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFF8FC',
        backgroundColor: '#B9254C',
    },
    title: {
        color: '#17151A',
        fontSize: 30,
        lineHeight: 37,
        fontWeight: '800',
    },
    titleHeart: {
        fontSize: 26,
    },
    subtitle: {
        color: '#63454E',
        fontSize: 14,
        marginTop: 2,
        textAlign: 'center',
    },
    formCard: {
        width: '100%',
        paddingHorizontal: 16,
        paddingTop: 17,
        paddingBottom: 16,
        borderRadius: 32,
        backgroundColor: '#FFFFFF',
        shadowColor: '#A84263',
        shadowOpacity: 0.06,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 7 },
        elevation: 2,
    },
    field: {
        marginBottom: 13,
    },
    fieldLabel: {
        color: '#211C20',
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 6,
        marginLeft: 8,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginRight: 4,
    },
    ageBadge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 13,
        marginBottom: 6,
        backgroundColor: '#FFF0F3',
    },
    ageText: {
        color: '#B91F49',
        fontSize: 11,
    },
    inputWrap: {
        minHeight: 54,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        backgroundColor: '#F5F2FA',
    },
    inputSymbol: {
        width: 26,
        height: 21,
        marginRight: 0,
    },
    input: {
        flex: 1,
        minWidth: 0,
        color: '#382F34',
        fontSize: 14,
        paddingVertical: 11,
    },
    placeholderText: {
        color: '#AA969C',
    },
    trailingSymbol: {
        width: 20,
        height: 20,
        marginLeft: 8,
    },
    modalBackdrop: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
    },
    datePickerCard: {
        paddingBottom: 20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        backgroundColor: '#FFFFFF',
    },
    datePickerHeader: {
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E9DFE4',
    },
    datePickerTitle: {
        color: '#211C20',
        fontSize: 15,
        fontWeight: '600',
    },
    datePickerCancel: {
        color: '#664B53',
        fontSize: 14,
    },
    datePickerConfirm: {
        color: '#B91F49',
        fontSize: 14,
        fontWeight: '700',
    },
    termsRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 1,
        marginBottom: 20,
        paddingHorizontal: 4,
        gap: 10,
    },
    termsIcon: {
        width: 22,
        height: 22,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 1,
        backgroundColor: '#B9254C',
    },
    termsText: {
        flex: 1,
        color: '#664B53',
        fontSize: 12,
        lineHeight: 20,
    },
    termsLink: {
        color: '#B91F49',
        fontWeight: '600',
    },
    createButton: {
        minHeight: 54,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 28,
        backgroundColor: '#B31D46',
        shadowColor: '#8F1838',
        shadowOpacity: 0.22,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 4,
    },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    createButtonArrow: {
        marginLeft: 10,
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 18,
        marginBottom: 12,
    },
    divider: {
        height: 1,
        flex: 1,
        backgroundColor: '#E9DDE2',
    },
    dividerText: {
        color: '#9E747F',
        fontSize: 11,
    },
    socialRow: {
        flexDirection: 'row',
        gap: 9,
    },
    socialButton: {
        minHeight: 46,
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F5F2FA',
        gap: 9,
    },
    googleMark: {
        color: '#4285F4',
        fontSize: 17,
        fontWeight: '800',
    },
    socialText: {
        color: '#241E22',
        fontSize: 13,
        fontWeight: '500',
    },
    matchBadge: {
        minHeight: 34,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        marginTop: 14,
        borderRadius: 18,
        backgroundColor: '#F3EFF4',
        gap: 8,
    },
    matchEmoji: {
        fontSize: 12,
    },
    matchText: {
        color: '#624D55',
        fontSize: 11,
    },
    matchCount: {
        color: '#271F23',
        fontWeight: '700',
    },
    loginText: {
        color: '#624D55',
        fontSize: 14,
        marginTop: 17,
        marginBottom: 8,
    },
    loginLink: {
        color: '#B91F49',
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
});
