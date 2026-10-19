import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/authContext';
import api from '../service';

const menuItems = [
	{
		key: 'discover',
		label: 'Khám phá',
		icon: { ios: 'flame.fill', android: 'local_fire_department', web: 'local_fire_department' },
		route: '',
		showBadge: false,
	},
	{
		key: 'chat',
		label: 'Trò chuyện',
		icon: { ios: 'bubble.left', android: 'chat_bubble', web: 'chat_bubble' },
		route: '',
		showBadge: true,
	},
	{
		key: 'activity',
		label: 'Thông báo',
		icon: { ios: 'heart', android: 'favorite', web: 'favorite' },
		route: '',
		showBadge: true,
	},
	{
		key: 'profile',
		label: 'Cá nhân',
		icon: { ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' },
		route: '',
		showBadge: false,
	},
] as const;

type MenuKey = (typeof menuItems)[number]['key'];

type MenuMainProps = {
	activeKey: MenuKey;
};

type Notification = {
	isRead: boolean | null;
};

export default function MenuMain({ activeKey }: MenuMainProps) {
	const { accessToken } = useAuth();
	const [unreadCount, setUnreadCount] = useState(0);

	const handleNotific = useCallback(async (token: string): Promise<number> => {
		const response = await api.get<{ data: Notification[] }>('/notifications', {
			headers: { Authorization: `Bearer ${token}` },
		});

		return response.data.data.filter((notification) => notification.isRead !== true).length;
	}, []);

	useEffect(() => {
		if (!accessToken) {
			setUnreadCount(0);
			return;
		}

		let isActive = true;
		void handleNotific(accessToken)
			.then((count) => {
				if (isActive) setUnreadCount(count);
			})
			.catch(() => {
				if (isActive) setUnreadCount(0);
			});

		return () => {
			isActive = false;
		};
	}, [accessToken, handleNotific]);

	return (
		<View style={styles.menu}>
			{menuItems.map((item) => {
				const isActive = activeKey === item.key;

				return (
					<Pressable
						key={item.key}
						accessibilityRole="button"
						accessibilityLabel={item.key === 'activity' && unreadCount > 0
							? `${item.label}, ${unreadCount} thông báo chưa đọc`
							: item.label}
						accessibilityState={{ selected: isActive }}
						style={styles.menuItem}
					>
						<View style={styles.iconWrap}>
							<SymbolView
								name={item.icon}
								size={20}
								tintColor={isActive ? '#D9435F' : '#806F74'}
							/>
							{item.key === 'activity' ? (
								unreadCount > 0 ? (
									<View style={styles.unreadBadge}>
										<Text style={styles.unreadBadgeText}>
											{unreadCount > 99 ? '99+' : unreadCount}
										</Text>
									</View>
								) : null
							) : item.showBadge ? <View style={styles.badge} /> : null}
						</View>
						<Text style={[styles.label, isActive && styles.activeLabel]}>{item.label}</Text>
					</Pressable>
				);
			})}
		</View>
	);
}

const styles = StyleSheet.create({
	menu: {
		minHeight: 68,
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FFFFFF',
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: '#E9E1E3',
		paddingHorizontal: 8,
	},
	menuItem: {
		flex: 1,
		minHeight: 62,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 3,
	},
	iconWrap: {
		width: 28,
		height: 25,
		alignItems: 'center',
		justifyContent: 'center',
	},
	badge: {
		position: 'absolute',
		top: 0,
		right: 0,
		width: 7,
		height: 7,
		borderRadius: 4,
		backgroundColor: '#F35B78',
	},
	unreadBadge: {
		position: 'absolute',
		top: -4,
		right: -9,
		minWidth: 16,
		height: 16,
		paddingHorizontal: 4,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#F35B78',
	},
	unreadBadgeText: {
		color: '#FFFFFF',
		fontSize: 9,
		fontWeight: '700',
		lineHeight: 12,
	},
	label: {
		color: '#806F74',
		fontSize: 11,
		fontWeight: '500',
	},
	activeLabel: {
		color: '#D9435F',
		fontWeight: '700',
	},
});
