import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import MenuMain from '../../component/menuMain';
import { useAuth } from '../../context/authContext';
import api from '../../service';

type ProfilePhoto = {
	photoID: string;
	photoURL: string;
	isAvatar: boolean | null;
};

type ProfileInterest = {
	interestIS: string;
	name: string;
};

type UserProfile = {
	userId: string;
	username: string | null;
	displayName: string | null;
	dateOfBirth: string | null;
	bio: string | null;
	profilePhotos: ProfilePhoto[];
	interests: ProfileInterest[];
};

const icons = {
	heart: { ios: 'heart.fill', android: 'favorite', web: 'favorite' },
	sparkle: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
	filters: { ios: 'slider.horizontal.3', android: 'tune', web: 'tune' },
	camera: { ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' },
	pencil: { ios: 'pencil', android: 'edit', web: 'edit' },
	plus: { ios: 'plus', android: 'add', web: 'add' },
	close: { ios: 'xmark', android: 'close', web: 'close' },
	move: { ios: 'arrow.up.arrow.down', android: 'swap_vert', web: 'swap_vert' },
	star: { ios: 'star.fill', android: 'star', web: 'star' },
} as const;

const getAge = (dateOfBirth: string | null): number | null => {
	if (!dateOfBirth || !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return null;
	const birthDate = new Date(`${dateOfBirth}T00:00:00Z`);
	if (Number.isNaN(birthDate.getTime()) || birthDate.toISOString().slice(0, 10) !== dateOfBirth) return null;

	const today = new Date();
	let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
	if (
		today.getUTCMonth() < birthDate.getUTCMonth() ||
		(today.getUTCMonth() === birthDate.getUTCMonth() && today.getUTCDate() < birthDate.getUTCDate())
	) {
		age--;
	}
	return age;
};

export default function ProfileScreen() {
	const { accessToken } = useAuth();
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let isActive = true;

		if (!accessToken) {
			setProfile(null);
			setError('Vui lòng đăng nhập để xem hồ sơ.');
			setIsLoading(false);
			return () => {
				isActive = false;
			};
		}

		setIsLoading(true);
		setError(null);
		void api.get<{ data: UserProfile }>('/profile/me', {
			headers: { Authorization: `Bearer ${accessToken}` },
		})
			.then((response) => {
				if (isActive) setProfile(response.data.data);
			})
			.catch(() => {
				if (isActive) setError('Không thể tải thông tin hồ sơ. Vui lòng thử lại sau.');
			})
			.finally(() => {
				if (isActive) setIsLoading(false);
			});

		return () => {
			isActive = false;
		};
	}, [accessToken]);

	const photos = profile?.profilePhotos ?? [];
	const interests = profile?.interests ?? [];
	const avatarPhoto = photos.find((photo) => photo.isAvatar) ?? photos[0];
	const displayName = profile?.displayName || profile?.username || 'Người dùng';
	const age = getAge(profile?.dateOfBirth ?? null);

	return (
		<SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
			<View style={styles.header}>
				<View style={styles.brand}>
					<SymbolView name={icons.heart} size={25} tintColor="#F34D73" />
					<Text style={styles.brandName}>Amour</Text>
					<View style={styles.brandSparkle}>
						<SymbolView name={icons.sparkle} size={14} tintColor="#8D3F58" />
					</View>
				</View>
				<View style={styles.headerActions}>
					<Pressable
						accessibilityRole="button"
						accessibilityLabel="Mở cài đặt"
						style={styles.headerSettings}
					>
						<SymbolView name={icons.filters} size={22} tintColor="#60474E" />
					</Pressable>
					{avatarPhoto ? (
						<Image source={{ uri: avatarPhoto.photoURL }} style={styles.headerAvatar} />
					) : (
						<View style={[styles.headerAvatar, styles.avatarPlaceholder]}>
							<SymbolView name={icons.camera} size={18} tintColor="#806F74" />
						</View>
					)}
				</View>
			</View>

			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
			{isLoading ? (
				<View style={styles.profileState}>
					<ActivityIndicator color="#B83257" />
					<Text style={styles.profileStateText}>Đang tải hồ sơ...</Text>
				</View>
			) : error ? (
				<View style={styles.profileState}>
					<Text style={styles.profileStateText}>{error}</Text>
				</View>
			) : profile ? (
			<>
				<View style={styles.profileIntro}>
					<View style={styles.avatarWrap}>
						{avatarPhoto ? (
							<Image source={{ uri: avatarPhoto.photoURL }} style={styles.profileAvatar} />
						) : (
							<View style={[styles.profileAvatar, styles.avatarPlaceholder]}>
								<SymbolView name={icons.camera} size={32} tintColor="#9C9295" />
							</View>
						)}
						<Pressable
							accessibilityRole="button"
							accessibilityLabel="Thêm ảnh"
							style={styles.cameraButton}
						>
							<SymbolView name={icons.camera} size={20} tintColor="#FFFFFF" />
						</Pressable>
					</View>
					<View style={styles.nameRow}>
						<Text style={styles.profileName}>{displayName}{age !== null ? `, ${age}` : ''}</Text>
						<View style={styles.statusDot} />
					</View>
					<Text style={styles.profileDescription}>{profile.bio || 'Chưa cập nhật giới thiệu'}</Text>

					<View style={styles.profileActions}>
						<Pressable style={[styles.actionButton, styles.editButton]}>
							<View style={styles.actionIconBubble}>
								<SymbolView name={icons.pencil} size={20} tintColor="#B83257" />
							</View>
							<Text style={styles.actionLabel}>Chỉnh sửa hồ sơ</Text>
						</Pressable>
						<Pressable style={[styles.actionButton, styles.settingsButton]}>
							<View style={styles.actionIconBubble}>
								<SymbolView name={icons.filters} size={21} tintColor="#60474E" />
							</View>
							<Text style={styles.actionLabel}>Cài đặt</Text>
						</Pressable>
					</View>
				</View>

				<View style={styles.section}>
					<View style={styles.sectionHeading}>
						<View style={styles.sectionTitleGroup}>
							<Text style={styles.sectionTitle}>Ảnh & video</Text>
							<Text style={styles.countPill}>{photos.length}/6</Text>
						</View>
						<Pressable accessibilityRole="button" style={styles.textAction}>
							<SymbolView name={icons.move} size={17} tintColor="#B83257" />
							<Text style={styles.textActionLabel}>Sắp xếp</Text>
						</Pressable>
					</View>
					<View style={styles.photoGrid}>
						{photos.map((photo) => (
							<View key={photo.photoID} style={styles.photoTile}>
								<Image source={{ uri: photo.photoURL }} style={styles.photoImage} />
								{photo.isAvatar ? (
									<View style={styles.mainBadge}>
										<SymbolView name={icons.star} size={12} tintColor="#B83257" />
										<Text style={styles.mainBadgeText}>Chính</Text>
									</View>
								) : (
									<Pressable
										accessibilityRole="button"
										accessibilityLabel="Xóa ảnh"
										style={styles.removePhotoButton}
									>
										<SymbolView name={icons.close} size={16} tintColor="#51464A" />
									</Pressable>
								)}
							</View>
						))}
						{Array.from({ length: Math.max(0, 6 - photos.length) }, (_, index) => (
							<Pressable
								key={`add-${index}`}
								accessibilityRole="button"
								accessibilityLabel="Thêm ảnh"
								style={styles.addPhotoTile}
							>
								<View style={styles.addPhotoIcon}>
									<SymbolView name={icons.plus} size={22} tintColor="#806F74" />
								</View>
								<Text style={styles.addPhotoLabel}>Thêm ảnh</Text>
							</Pressable>
						))}
					</View>
				</View>

				<View style={styles.section}>
					<View style={styles.sectionHeading}>
						<View style={styles.sectionTitleGroup}>
							<Text style={styles.sectionTitle}>Sở thích</Text>
										<Text style={styles.countPill}>{interests.length}</Text>
						</View>
						<Pressable accessibilityRole="button" style={styles.textAction}>
							<SymbolView name={icons.pencil} size={16} tintColor="#B83257" />
							<Text style={styles.textActionLabel}>Chỉnh sửa</Text>
						</Pressable>
					</View>
					<View style={styles.interestList}>
								{interests.map((interest) => (
									<View key={interest.interestIS} style={styles.interestChip}>
										<Text style={styles.interestText}>{interest.name}</Text>
							</View>
						))}
						<Pressable accessibilityRole="button" style={styles.addInterestButton}>
							<SymbolView name={icons.plus} size={17} tintColor="#B83257" />
							<Text style={styles.addInterestText}>Thêm sở thích</Text>
						</Pressable>
					</View>
				</View>
			</>
			) : null}
			</ScrollView>

			<MenuMain activeKey="profile" />
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#FCF8FD',
	},
	header: {
		height: 66,
		paddingHorizontal: 20,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: '#FFFEFF',
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: '#F0E8EC',
	},
	brand: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 7,
	},
	brandName: {
		color: '#D9365D',
		fontSize: 25,
		fontWeight: '800',
	},
	brandSparkle: {
		width: 27,
		height: 27,
		borderRadius: 14,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#FFE4EC',
	},
	headerActions: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	headerSettings: {
		width: 44,
		height: 44,
		borderRadius: 22,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#F5F0F8',
	},
	headerAvatar: {
		width: 42,
		height: 42,
		borderRadius: 21,
		borderWidth: 2,
		borderColor: '#F7B5C5',
	},
	avatarPlaceholder: {
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#E8DDE1',
	},
	scrollView: {
		flex: 1,
	},
	profileState: {
		flex: 1,
		minHeight: 240,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 12,
		paddingHorizontal: 24,
	},
	profileStateText: {
		color: '#806F74',
		fontSize: 14,
		textAlign: 'center',
	},
	content: {
		paddingHorizontal: 18,
		paddingTop: 16,
		paddingBottom: 24,
	},
	profileIntro: {
		alignItems: 'center',
	},
	avatarWrap: {
		width: 136,
		height: 136,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 12,
	},
	profileAvatar: {
		width: 128,
		height: 128,
		borderRadius: 64,
		borderWidth: 5,
		borderColor: '#FFFFFF',
		backgroundColor: '#E8DDE1',
	},
	cameraButton: {
		position: 'absolute',
		right: 0,
		bottom: 3,
		width: 43,
		height: 43,
		borderRadius: 22,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#B83257',
		borderWidth: 3,
		borderColor: '#FCF8FD',
	},
	nameRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	profileName: {
		color: '#29242A',
		fontSize: 25,
		fontWeight: '800',
	},
	statusDot: {
		width: 20,
		height: 20,
		borderRadius: 10,
		backgroundColor: '#F9D3DC',
	},
	profileDescription: {
		marginTop: 2,
		color: '#766A70',
		fontSize: 14,
		textAlign: 'center',
	},
	profileActions: {
		width: '100%',
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 12,
		marginTop: 18,
	},
	actionButton: {
		width: '48%',
		maxWidth: 178,
		minHeight: 94,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 5,
		borderRadius: 32,
	},
	editButton: {
		backgroundColor: '#F8E0E7',
	},
	settingsButton: {
		backgroundColor: '#FFFFFF',
	},
	actionIconBubble: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'rgba(255,255,255,0.82)',
	},
	actionLabel: {
		color: '#382D32',
		fontSize: 13,
		fontWeight: '600',
	},
	section: {
		marginTop: 24,
	},
	sectionHeading: {
		minHeight: 28,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 12,
	},
	sectionTitleGroup: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	sectionTitle: {
		color: '#29242A',
		fontSize: 20,
		fontWeight: '700',
	},
	countPill: {
		overflow: 'hidden',
		paddingHorizontal: 9,
		paddingVertical: 3,
		borderRadius: 14,
		backgroundColor: '#F1EAF1',
		color: '#746970',
		fontSize: 12,
		fontWeight: '600',
	},
	textAction: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		paddingVertical: 4,
	},
	textActionLabel: {
		color: '#B83257',
		fontSize: 13,
		fontWeight: '700',
	},
	photoGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		rowGap: 12,
	},
	photoTile: {
		position: 'relative',
		width: '31.7%',
		aspectRatio: 0.75,
		overflow: 'hidden',
		borderRadius: 28,
		backgroundColor: '#D0CECF',
	},
	photoImage: {
		width: '100%',
		height: '100%',
	},
	mainBadge: {
		position: 'absolute',
		left: 7,
		top: 8,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 3,
		paddingHorizontal: 8,
		paddingVertical: 5,
		borderRadius: 14,
		backgroundColor: 'rgba(255,255,255,0.94)',
	},
	mainBadgeText: {
		color: '#B83257',
		fontSize: 10,
		fontWeight: '700',
	},
	removePhotoButton: {
		position: 'absolute',
		right: 7,
		top: 7,
		width: 29,
		height: 29,
		borderRadius: 15,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'rgba(255,255,255,0.94)',
	},
	orderBadge: {
		position: 'absolute',
		right: 7,
		bottom: 7,
		width: 26,
		height: 26,
		borderRadius: 13,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#B83257',
	},
	orderText: {
		color: '#FFFFFF',
		fontSize: 12,
		fontWeight: '700',
	},
	addPhotoTile: {
		width: '31.7%',
		aspectRatio: 0.75,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		borderRadius: 28,
		backgroundColor: '#FFFFFF',
	},
	addPhotoIcon: {
		width: 42,
		height: 42,
		borderRadius: 21,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#F5F0F8',
	},
	addPhotoLabel: {
		color: '#65585E',
		fontSize: 12,
		fontWeight: '600',
	},
	interestList: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	interestChip: {
		minHeight: 37,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingHorizontal: 12,
		borderRadius: 20,
		backgroundColor: '#F7E1E7',
	},
	interestText: {
		color: '#42363B',
		fontSize: 12,
	},
	addInterestButton: {
		minHeight: 37,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		paddingHorizontal: 12,
		borderRadius: 20,
		backgroundColor: '#FFFFFF',
	},
	addInterestText: {
		color: '#B83257',
		fontSize: 12,
		fontWeight: '700',
	},
	modalBackdrop: {
		flex: 1,
		justifyContent: 'flex-end',
		backgroundColor: 'rgba(32, 22, 27, 0.34)',
	},
	sheet: {
		paddingHorizontal: 22,
		paddingTop: 12,
		paddingBottom: 30,
		borderTopLeftRadius: 26,
		borderTopRightRadius: 26,
		backgroundColor: '#FFFEFF',
	},
	sheetHandle: {
		alignSelf: 'center',
		width: 40,
		height: 4,
		marginBottom: 18,
		borderRadius: 2,
		backgroundColor: '#E2D9DD',
	},
	sheetHeading: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 18,
	},
	sheetTitle: {
		color: '#29242A',
		fontSize: 20,
		fontWeight: '700',
	},
	sheetBody: {
		gap: 10,
	},
	fieldLabel: {
		marginTop: 4,
		color: '#60474E',
		fontSize: 13,
		fontWeight: '600',
	},
	textInput: {
		minHeight: 48,
		paddingHorizontal: 13,
		borderWidth: 1,
		borderColor: '#E9DFE4',
		borderRadius: 12,
		color: '#29242A',
		backgroundColor: '#FCF8FD',
	},
	saveButton: {
		minHeight: 48,
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 8,
		borderRadius: 14,
		backgroundColor: '#B83257',
	},
	saveButtonText: {
		color: '#FFFFFF',
		fontSize: 14,
		fontWeight: '700',
	},
	settingRow: {
		minHeight: 64,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: '#E9DFE4',
	},
	settingCopy: {
		flex: 1,
		paddingRight: 12,
	},
	settingTitle: {
		color: '#342A2F',
		fontSize: 14,
		fontWeight: '600',
	},
	settingDescription: {
		marginTop: 3,
		color: '#806F74',
		fontSize: 12,
	},
});
