import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MenuMain from '../../component/menuMain';

export default function ChatScreen() {
	return (
		<SafeAreaView style={styles.safeArea} edges={['top']}>
			<View style={styles.header}>
				<Text style={styles.title}>Trò chuyện</Text>
			</View>
			<View style={styles.content}>
				<Text style={styles.message}>Tính năng trò chuyện đang được hoàn thiện.</Text>
			</View>
			<MenuMain activeKey="chat" />
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