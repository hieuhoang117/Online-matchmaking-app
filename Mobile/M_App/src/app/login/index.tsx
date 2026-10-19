import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useAuth } from '../../context/authContext';
import {
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
	const [showPassword, setShowPassword] = useState(false);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [errorMessage, setErrorMessage] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();
	const { isLoggedIn, isInitializing, login } = useAuth();

	useEffect(() => {
		if (!isInitializing && isLoggedIn) router.replace('/mainscreen');
	}, [isInitializing, isLoggedIn, router]);

	const handleLogin = async (): Promise<void> => {
		const normalizedEmail = email.trim().toLowerCase();
		if (!normalizedEmail || !password) {
			setErrorMessage('Vui lòng nhập email và mật khẩu.');
			return;
		}

		setErrorMessage('');
		setIsLoading(true);
		try {
			await login(normalizedEmail, password);
			router.replace('/mainscreen');
		} catch (error) {
			const message = axios.isAxiosError<{ message?: string }>(error)
				? error.response?.data?.message ?? 'Không thể kết nối tới máy chủ.'
				: 'Đã xảy ra lỗi. Vui lòng thử lại.';
			setErrorMessage(message);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<KeyboardAvoidingView
				style={styles.flex}
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			>
				<ScrollView
					contentContainerStyle={styles.scrollContent}
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
				>
					<View style={styles.screen}>

						<View style={styles.brand}>
							<View style={styles.brandMark}>
								<Text style={styles.brandHeart}>♥</Text>
								<View style={styles.brandSparkle}>
									<Text style={styles.sparkleText}>✦</Text>
								</View>
							</View>
							<Text style={styles.brandName}>Amour <Text style={styles.brandEmoji}>♥</Text></Text>
							<Text style={styles.tagline}>Tìm thấy tình yêu của bạn</Text>
						</View>

						<View style={styles.form}>
							<Text style={styles.fieldLabel}>Địa chỉ email</Text>
							<View style={styles.inputWrap}>
								<Text style={styles.inputIcon}>@</Text>
								<TextInput
									style={styles.input}
									placeholder="hello@amour.com"
									placeholderTextColor="#B9A8B0"
									keyboardType="email-address"
									autoCapitalize="none"
									autoCorrect={false}
									value={email}
									onChangeText={setEmail}
								/>
							</View>

							<View style={styles.passwordHeading}>
								<Text style={styles.fieldLabel}>Mật khẩu</Text>
							</View>
							<View style={styles.inputWrap}>
								<Text style={styles.inputIcon}>▣</Text>
								<TextInput
									style={styles.input}
									placeholder="Nhập mật khẩu"
									placeholderTextColor="#B9A8B0"
									secureTextEntry={!showPassword}
									autoCapitalize="none"
									value={password}
									onChangeText={setPassword}
								/>
								<Pressable
									accessibilityRole="button"
									accessibilityLabel={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
									onPress={() => setShowPassword((current) => !current)}
									style={styles.eyeButton}
								>
									<Text style={styles.eyeIcon}>{showPassword ? '◉' : '◎'}</Text>
								</Pressable>
							</View>

							{errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

							<Pressable accessibilityRole="button" style={styles.forgotButton}>
								<Text style={styles.forgotText}>Quên mật khẩu?</Text>
							</Pressable>

							<Pressable accessibilityRole="button" style={styles.loginButton}
								onPress={handleLogin}
								disabled={isLoading}>
								<Text style={styles.loginButtonText}>{isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}</Text>
								<Text style={styles.loginHeart}>♡</Text>
							</Pressable>

						</View>

						<View style={styles.bottomContent}>
							<View style={styles.matchBadge}>
								<Text style={styles.matchSparkles}>✦ ♥ ✦</Text>
								<Text style={styles.matchText}>Hơn 2,4 triệu người độc thân đang tìm kiếm hôm nay</Text>
							</View>

							<View style={styles.signupRow}>
								<Text style={styles.signupText}>Bạn chưa có tài khoản?</Text>
								<Pressable
									accessibilityRole="button"
									accessibilityLabel="Đăng ký"
									onPress={() => router.replace('/login/register')}
								>
									<Text style={styles.signupLink}>Đăng ký</Text>
								</Pressable>
							</View>


						</View>
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
		backgroundColor: '#FFF7F9',
	},
	scrollContent: {
		flexGrow: 1,
		paddingHorizontal: 22,
		paddingVertical: 8,
	},
	screen: {
		width: '100%',
		maxWidth: 430,
		alignSelf: 'center',
		flexGrow: 1,
	},
	topBar: {
		height: 42,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	backButton: {
		width: 38,
		height: 38,
		justifyContent: 'center',
	},
	backIcon: {
		color: '#332B30',
		fontSize: 34,
		lineHeight: 38,
	},
	topBarTitle: {
		color: '#332B30',
		fontSize: 16,
		fontWeight: '700',
	},
	brand: {
		alignItems: 'center',
		marginTop: 17,
		marginBottom: 25,
	},
	brandMark: {
		width: 66,
		height: 66,
		borderRadius: 33,
		backgroundColor: '#FFFFFF',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 9,
		shadowColor: '#9B2547',
		shadowOpacity: 0.12,
		shadowRadius: 12,
		shadowOffset: { width: 0, height: 5 },
		elevation: 4,
	},
	brandHeart: {
		color: '#B9254C',
		fontSize: 30,
	},
	brandSparkle: {
		position: 'absolute',
		right: -5,
		top: -3,
		width: 22,
		height: 22,
		borderRadius: 11,
		backgroundColor: '#FF6C89',
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 2,
		borderColor: '#FFF7F9',
	},
	sparkleText: {
		color: '#FFFFFF',
		fontSize: 12,
	},
	brandName: {
		color: '#B9254C',
		fontSize: 29,
		lineHeight: 35,
		fontWeight: '800',
	},
	brandEmoji: {
		color: '#F04E70',
		fontSize: 24,
	},
	tagline: {
		color: '#B84563',
		fontSize: 13,
		marginTop: 1,
	},
	form: {
		paddingHorizontal: 1,
	},
	fieldLabel: {
		color: '#5D4B53',
		fontSize: 12,
		fontWeight: '600',
		marginBottom: 7,
		marginLeft: 4,
	},
	errorText: {
		color: '#B9254C',
		fontSize: 12,
		marginTop: 8,
		marginHorizontal: 4,
	},
	inputWrap: {
		minHeight: 48,
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 14,
		borderRadius: 24,
		backgroundColor: '#FFFFFF',
		borderWidth: 1,
		borderColor: '#F4E8ED',
	},
	inputIcon: {
		width: 22,
		color: '#B9254C',
		fontSize: 16,
		fontWeight: '700',
	},
	input: {
		flex: 1,
		color: '#382F34',
		fontSize: 13,
		paddingVertical: 11,
	},
	passwordHeading: {
		marginTop: 14,
	},
	eyeButton: {
		width: 30,
		height: 40,
		alignItems: 'flex-end',
		justifyContent: 'center',
	},
	eyeIcon: {
		color: '#B67D8D',
		fontSize: 17,
	},
	forgotButton: {
		alignSelf: 'flex-end',
		paddingVertical: 11,
		paddingHorizontal: 3,
	},
	forgotText: {
		color: '#B9254C',
		fontSize: 12,
		fontWeight: '600',
	},
	loginButton: {
		minHeight: 48,
		borderRadius: 24,
		backgroundColor: '#B9254C',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 7,
		shadowColor: '#8F1838',
		shadowOpacity: 0.2,
		shadowRadius: 9,
		shadowOffset: { width: 0, height: 5 },
		elevation: 4,
	},
	loginButtonText: {
		color: '#FFFFFF',
		fontSize: 14,
		fontWeight: '700',
	},
	loginHeart: {
		color: '#FFFFFF',
		fontSize: 18,
		lineHeight: 20,
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
		backgroundColor: '#F0E2E7',
	},
	dividerText: {
		color: '#BD8192',
		fontSize: 10,
		fontWeight: '600',
	},
	socialRow: {
		flexDirection: 'row',
		gap: 10,
	},
	socialButton: {
		minHeight: 45,
		flex: 1,
		borderRadius: 23,
		backgroundColor: '#FFFFFF',
		borderWidth: 1,
		borderColor: '#F4E8ED',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
	},
	appleMark: {
		color: '#202027',
		fontSize: 13,
	},
	googleMark: {
		color: '#4285F4',
		fontSize: 15,
		fontWeight: '800',
	},
	socialText: {
		color: '#40353B',
		fontSize: 12,
		fontWeight: '600',
	},
	bottomContent: {
		marginTop: 'auto',
		alignItems: 'center',
		paddingTop: 22,
		paddingBottom: 9,
	},
	matchBadge: {
		minHeight: 28,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 10,
		borderRadius: 16,
		backgroundColor: '#FFE9EF',
		gap: 7,
	},
	matchSparkles: {
		color: '#ED6D81',
		fontSize: 10,
	},
	matchText: {
		color: '#A64B62',
		fontSize: 10,
	},
	signupRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 18,
	},
	signupText: {
		color: '#63545B',
		fontSize: 12,
	},
	signupLink: {
		color: '#B9254C',
		fontWeight: '700',
	},
});
