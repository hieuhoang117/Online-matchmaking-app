import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const menuItems = [
	{
		key: 'discover',
		label: 'Discover',
		icon: { ios: 'flame.fill', android: 'local_fire_department', web: 'local_fire_department' },
		route: '',
		showBadge: false,
	},
	{
		key: 'chat',
		label: 'Chat',
		icon: { ios: 'bubble.left', android: 'chat_bubble', web: 'chat_bubble' },
		route: '',
		showBadge: true,
	},
	{
		key: 'activity',
		label: 'Activity',
		icon: { ios: 'heart', android: 'favorite', web: 'favorite' },
		route: '',
		showBadge: true,
	},
	{
		key: 'profile',
		label: 'Profile',
		icon: { ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' },
		route: '',
		showBadge: false,
	},
] as const;

type MenuKey = (typeof menuItems)[number]['key'];

type MenuMainProps = {
	activeKey: MenuKey;
};

export default function MenuMain({ activeKey }: MenuMainProps) {

	return (
		<View style={styles.menu}>
			{menuItems.map((item) => {
				const isActive = activeKey === item.key;

				return (
					<Pressable
						key={item.key}
						accessibilityRole="button"
						accessibilityLabel={item.label}
						accessibilityState={{ selected: isActive }}
						style={styles.menuItem}
					>
						<View style={styles.iconWrap}>
							<SymbolView
								name={item.icon}
								size={20}
								tintColor={isActive ? '#D9435F' : '#806F74'}
							/>
							{item.showBadge ? <View style={styles.badge} /> : null}
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
