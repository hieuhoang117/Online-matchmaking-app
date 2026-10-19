import axios from 'axios';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
	Alert,
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
import { SymbolView } from 'expo-symbols';
import api from '../../service';

const icons = {
	back: { ios: 'arrow.left', android: 'arrow_back', web: 'arrow_back' },
	mail: { ios: 'envelope', android: 'mail', web: 'mail' },
	lock: { ios: 'lock.fill', android: 'lock', web: 'lock' },
	hidden: { ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' },
	visible: { ios: 'eye', android: 'visibility', web: 'visibility' },
	arrow: { ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' },
} as const;

const getErrorMessage = (error: unknown) =>
	axios.isAxiosError<{ message?: string }>(error)
		? error.response?.data?.message ?? 'Không thể kết nối tới máy chủ.'
		: 'Đã xảy ra lỗi. Vui lòng thử lại.';

export default function ForgotPasswordScreen() {
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [isEmailModalVisible, setEmailModalVisible] = useState(true);
	const [isCheckingEmail, setCheckingEmail] = useState(false);
	const [isSendingOtp, setSendingOtp] = useState(false);
	const [isResettingPassword, setResettingPassword] = useState(false);
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [otp, setOtp] = useState('');
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [emailError, setEmailError] = useState('');
	const [errorMessage, setErrorMessage] = useState('');
	const [noticeMessage, setNoticeMessage] = useState('');

	const handleCheckEmail = async () => {
		const normalizedEmail = email.trim().toLowerCase();
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
			setEmailError('Vui lòng nhập địa chỉ email hợp lệ.');
			return;
		}

		setEmailError('');
		setCheckingEmail(true);
		try {
			const response = await api.post<{ exists: boolean }>('/auth/email-availability', {
				email: normalizedEmail,
			});
			if (!response.data.exists) {
				setEmailError('Email này chưa được đăng ký.');
				return;
			}

			setEmail(normalizedEmail);
			setErrorMessage('');
			setNoticeMessage('');
			setEmailModalVisible(false);
		} catch (error) {
			setEmailError(getErrorMessage(error));
		} finally {
			setCheckingEmail(false);
		}
	};

	const handleSendOtp = async () => {
		setErrorMessage('');
		setNoticeMessage('');
		setSendingOtp(true);
		try {
			await api.post('/auth/password-resets', { email });
			setNoticeMessage(`Mã OTP đã được gửi đến ${email}.`);
		} catch (error) {
			setErrorMessage(getErrorMessage(error));
		} finally {
			setSendingOtp(false);
		}
	};

	const handleResetPassword = async () => {
		if (newPassword.length < 8) {
			setErrorMessage('Mật khẩu mới phải có ít nhất 8 ký tự.');
			return;
		}
		if (newPassword !== confirmPassword) {
			setErrorMessage('Hai mật khẩu không trùng khớp.');
			return;
		}
		if (!/^\d{6}$/.test(otp.trim())) {
			setErrorMessage('Vui lòng nhập mã OTP gồm 6 chữ số.');
			return;
		}

		setErrorMessage('');
		setNoticeMessage('');
		setResettingPassword(true);
		try {
			await api.post('/auth/password-resets/otp-verifications', {
				email,
				otp: otp.trim(),
				newPassword,
			});
			Alert.alert('Đổi mật khẩu thành công', 'Vui lòng đăng nhập bằng mật khẩu mới.', [
				{ text: 'Đăng nhập', onPress: () => router.replace('/login') },
			]);
		} catch (error) {
			setErrorMessage(getErrorMessage(error));
		} finally {
			setResettingPassword(false);
		}
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
						<SymbolView name={icons.back} size={23} tintColor="#5B434B" />
					</Pressable>
					<Text style={styles.headerTitle}>Quên mật khẩu</Text>
					<View style={styles.headerSpacer} />
				</View>

				<ScrollView
					contentContainerStyle={styles.scrollContent}
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
				>
					<View style={styles.form}>
						<View style={styles.heroMark}>
							<SymbolView name={icons.lock} size={30} tintColor="#B9254C" />
						</View>
						<Text style={styles.title}>Tạo mật khẩu mới</Text>
						<Text style={styles.subtitle}>
							Nhập mã OTP được gửi đến email để đặt lại mật khẩu.
						</Text>

						<View style={styles.emailRow}>
							<View style={styles.emailCopy}>
								<Text style={styles.fieldLabel}>Email khôi phục</Text>
								<Text numberOfLines={1} style={styles.emailText}>{email || 'Chưa chọn email'}</Text>
							</View>
							<Pressable
								accessibilityRole="button"
								onPress={() => {
									setEmailError('');
									setEmailModalVisible(true);
								}}
								style={styles.changeEmailButton}
							>
								<Text style={styles.changeEmailText}>Đổi</Text>
							</Pressable>
						</View>

						<View style={styles.field}>
							<Text style={styles.fieldLabel}>Mật khẩu mới</Text>
							<View style={styles.inputWrap}>
								<SymbolView name={icons.lock} size={19} tintColor="#90757E" />
								<TextInput
									style={styles.input}
									placeholder="Tối thiểu 8 ký tự"
									placeholderTextColor="#AA969C"
									secureTextEntry={!showNewPassword}
									autoCapitalize="none"
									value={newPassword}
									onChangeText={setNewPassword}
								/>
								<Pressable
									accessibilityRole="button"
									accessibilityLabel={showNewPassword ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'}
									onPress={() => setShowNewPassword((current) => !current)}
									style={styles.passwordToggle}
								>
									<SymbolView
										name={showNewPassword ? icons.visible : icons.hidden}
										size={20}
										tintColor="#9B838B"
									/>
								</Pressable>
							</View>
						</View>

						<View style={styles.field}>
							<Text style={styles.fieldLabel}>Nhập lại mật khẩu mới</Text>
							<View style={styles.inputWrap}>
								<SymbolView name={icons.lock} size={19} tintColor="#90757E" />
								<TextInput
									style={styles.input}
									placeholder="Nhập lại mật khẩu mới"
									placeholderTextColor="#AA969C"
									secureTextEntry={!showConfirmPassword}
									autoCapitalize="none"
									value={confirmPassword}
									onChangeText={setConfirmPassword}
								/>
								<Pressable
									accessibilityRole="button"
									accessibilityLabel={showConfirmPassword ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'}
									onPress={() => setShowConfirmPassword((current) => !current)}
									style={styles.passwordToggle}
								>
									<SymbolView
										name={showConfirmPassword ? icons.visible : icons.hidden}
										size={20}
										tintColor="#9B838B"
									/>
								</Pressable>
							</View>
						</View>

						<View style={styles.field}>
							<Text style={styles.fieldLabel}>Mã OTP</Text>
							<View style={styles.inputWrap}>
								<Text style={styles.otpSymbol}>#</Text>
								<TextInput
									style={styles.input}
									placeholder="Nhập mã gồm 6 chữ số"
									placeholderTextColor="#AA969C"
									keyboardType="number-pad"
									maxLength={6}
									value={otp}
									onChangeText={setOtp}
								/>
							</View>
							<Pressable
								accessibilityRole="button"
								onPress={handleSendOtp}
								disabled={isSendingOtp || !email}
								style={styles.sendOtpButton}
							>
								<Text style={styles.sendOtpText}>
									{isSendingOtp ? 'Đang gửi OTP...' : 'Gửi mã OTP đến email này'}
								</Text>
							</Pressable>
						</View>

						{errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
						{noticeMessage ? <Text style={styles.noticeText}>{noticeMessage}</Text> : null}

						<Pressable
							accessibilityRole="button"
							onPress={handleResetPassword}
							disabled={isResettingPassword}
							style={styles.submitButton}
						>
							<Text style={styles.submitButtonText}>
								{isResettingPassword ? 'Đang xác nhận...' : 'Xác nhận đổi mật khẩu'}
							</Text>
							<SymbolView name={icons.arrow} size={20} tintColor="#FFFFFF" />
						</Pressable>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>

			<Modal
				transparent
				animationType="fade"
				visible={isEmailModalVisible}
				onRequestClose={() => router.replace('/login')}
			>
				<View style={styles.modalBackdrop}>
					<View style={styles.modalCard}>
						<View style={styles.modalIcon}>
							<SymbolView name={icons.mail} size={25} tintColor="#B9254C" />
						</View>
						<Text style={styles.modalTitle}>Nhập email của bạn</Text>
						<Text style={styles.modalDescription}>
							Chúng tôi sẽ kiểm tra email trước khi gửi mã xác nhận.
						</Text>
						<View style={styles.inputWrap}>
							<SymbolView name={icons.mail} size={19} tintColor="#90757E" />
							<TextInput
								style={styles.input}
								placeholder="email@vidu.com"
								placeholderTextColor="#AA969C"
								keyboardType="email-address"
								autoCapitalize="none"
								autoCorrect={false}
								returnKeyType="go"
								value={email}
								onChangeText={setEmail}
								onSubmitEditing={handleCheckEmail}
							/>
						</View>
						{emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
						<Pressable
							accessibilityRole="button"
							onPress={handleCheckEmail}
							disabled={isCheckingEmail}
							style={styles.submitButton}
						>
							<Text style={styles.submitButtonText}>
								{isCheckingEmail ? 'Đang kiểm tra...' : 'Tiếp tục'}
							</Text>
							<SymbolView name={icons.arrow} size={20} tintColor="#FFFFFF" />
						</Pressable>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	safeArea: { flex: 1, backgroundColor: '#FFF8FC' },
	header: {
		minHeight: 58,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 22,
		backgroundColor: '#FFFAFD',
	},
	backButton: { width: 42, height: 42, justifyContent: 'center' },
	headerTitle: { color: '#2B1A20', fontSize: 16, fontWeight: '700' },
	headerSpacer: { width: 42 },
	scrollContent: { flexGrow: 1, paddingHorizontal: 22, paddingVertical: 26 },
	form: { width: '100%', maxWidth: 430, alignSelf: 'center' },
	heroMark: {
		width: 62,
		height: 62,
		borderRadius: 31,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#FFE9EF',
		alignSelf: 'center',
		marginBottom: 16,
	},
	title: { color: '#2B1A20', fontSize: 24, fontWeight: '800', textAlign: 'center' },
	subtitle: {
		color: '#806B73',
		fontSize: 13,
		lineHeight: 20,
		textAlign: 'center',
		marginTop: 8,
		marginBottom: 25,
	},
	emailRow: {
		minHeight: 65,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 15,
		marginBottom: 22,
		borderRadius: 12,
		backgroundColor: '#FFFFFF',
		borderWidth: 1,
		borderColor: '#F1E3E8',
	},
	emailCopy: { flex: 1, paddingRight: 12 },
	emailText: { color: '#4A3940', fontSize: 13, marginTop: 4 },
	changeEmailButton: { padding: 8 },
	changeEmailText: { color: '#B9254C', fontSize: 13, fontWeight: '700' },
	field: { marginBottom: 17 },
	fieldLabel: { color: '#5D4B53', fontSize: 12, fontWeight: '700', marginBottom: 7 },
	inputWrap: {
		minHeight: 50,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 11,
		paddingHorizontal: 14,
		borderRadius: 12,
		backgroundColor: '#FFFFFF',
		borderWidth: 1,
		borderColor: '#F1E3E8',
	},
	input: { flex: 1, color: '#382F34', fontSize: 14, paddingVertical: 12 },
	passwordToggle: { width: 30, height: 42, alignItems: 'flex-end', justifyContent: 'center' },
	otpSymbol: { width: 19, color: '#90757E', fontSize: 18, fontWeight: '700' },
	sendOtpButton: { alignSelf: 'flex-end', paddingTop: 11, paddingHorizontal: 2 },
	sendOtpText: { color: '#B9254C', fontSize: 12, fontWeight: '700' },
	errorText: { color: '#B9254C', fontSize: 12, lineHeight: 18, marginTop: 8 },
	noticeText: { color: '#39744C', fontSize: 12, lineHeight: 18, marginTop: 8 },
	submitButton: {
		minHeight: 50,
		borderRadius: 12,
		backgroundColor: '#B9254C',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 9,
		marginTop: 8,
	},
	submitButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
	modalBackdrop: {
		flex: 1,
		justifyContent: 'center',
		paddingHorizontal: 22,
		backgroundColor: 'rgba(36, 20, 27, 0.45)',
	},
	modalCard: {
		width: '100%',
		maxWidth: 420,
		alignSelf: 'center',
		padding: 22,
		borderRadius: 16,
		backgroundColor: '#FFFDFE',
	},
	modalIcon: {
		width: 48,
		height: 48,
		borderRadius: 24,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#FFE9EF',
		alignSelf: 'center',
		marginBottom: 13,
	},
	modalTitle: { color: '#2B1A20', fontSize: 19, fontWeight: '800', textAlign: 'center' },
	modalDescription: {
		color: '#806B73',
		fontSize: 12,
		lineHeight: 18,
		textAlign: 'center',
		marginTop: 7,
		marginBottom: 18,
	},
});