import { Image, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import MenuMain from '../../component/menuMain';

const profileImage = {
    uri: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=85',
};

const icons = {
    heart: { ios: 'heart.fill', android: 'favorite', web: 'favorite' },
    sparkle: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
    filters: { ios: 'slider.horizontal.3', android: 'tune', web: 'tune' },
    location: { ios: 'mappin', android: 'location_on', web: 'location_on' },
    verified: { ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' },
    work: { ios: 'ruler', android: 'architecture', web: 'architecture' },
    education: { ios: 'graduationcap', android: 'school', web: 'school' },
    undo: { ios: 'arrow.uturn.backward', android: 'undo', web: 'undo' },
    close: { ios: 'xmark', android: 'close', web: 'close' },
    star: { ios: 'star', android: 'star', web: 'star' },
    bolt: { ios: 'bolt.fill', android: 'bolt', web: 'bolt' },
    chevron: { ios: 'chevron.up', android: 'expand_less', web: 'expand_less' },
} as const;

export default function MainScreen() {
    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.header}>
                <View style={styles.brand}>
                    <SymbolView name={icons.heart} size={30} tintColor="#F34D73" />
                    <Text style={styles.brandName}>Amour</Text>
                    <View style={styles.brandSparkle}>
                        <SymbolView name={icons.sparkle} size={15} tintColor="#8D3F58" />
                    </View>
                </View>
                <View style={styles.headerActions}>
                    <View style={styles.filterButton}>
                        <SymbolView name={icons.filters} size={25} tintColor="#60474E" />
                    </View>
                    <Image source={profileImage} style={styles.avatar} />
                </View>
            </View>

            <View style={styles.discoveryArea}>
                <ImageBackground
                    source={profileImage}
                    resizeMode="cover"
                    style={styles.profileCard}
                    imageStyle={styles.profileImage}
                >
                    <View style={styles.photoTint} />
                    <View style={styles.profileProgress}>
                        {[0, 1, 2, 3, 4].map((segment) => (
                            <View
                                key={segment}
                                style={[styles.progressSegment, segment === 0 && styles.activeProgressSegment]}
                            />
                        ))}
                    </View>

                    <View style={styles.profileMeta}>
                        <View style={styles.metaPill}>
                            <View style={styles.onlineDot} />
                            <Text style={styles.metaText}>Đang hoạt động</Text>
                        </View>
                        <View style={styles.metaPill}>
                            <SymbolView name={icons.location} size={17} tintColor="#D9345D" />
                            <Text style={styles.metaText}>Cách bạn 5 km</Text>
                        </View>
                    </View>

                    <View style={styles.profileDetails}>
                        <View style={styles.nameRow}>
                            <View style={styles.nameAndBadge}>
                                <Text style={styles.name}>Elena, 24</Text>
                                <View style={styles.verifiedBadge}>
                                    <SymbolView name={icons.verified} size={16} tintColor="#FFFFFF" />
                                </View>
                            </View>
                            <View style={styles.expandButton}>
                                <SymbolView name={icons.chevron} size={23} tintColor="#FFFFFF" />
                            </View>
                        </View>

                        <View style={styles.detailRow}>
                            <SymbolView name={icons.work} size={17} tintColor="#FFFFFF" />
                            <Text style={styles.detailText}>Kiến trúc sư • Studio Forma</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <SymbolView name={icons.education} size={18} tintColor="#E8DDE0" />
                            <Text style={styles.secondaryDetailText}>Đại học Bách khoa • Khóa 2022</Text>
                        </View>

                        <View style={styles.tags}>
                            <Text style={styles.tag}>Mê cà phê ☕</Text>
                            <Text style={styles.tag}>Phòng tranh 🎨</Text>
                            <Text style={styles.tag}>Yêu chó 🐶</Text>
                            <Text style={styles.tag}>Du lịch ngẫu hứng ✈️</Text>
                        </View>
                    </View>
                </ImageBackground>

                <View style={styles.actionRow}>
                    <View style={[styles.actionButton, styles.smallAction]}>
                        <SymbolView name={icons.undo} size={27} tintColor="#F19A19" />
                    </View>
                    <View style={[styles.actionButton, styles.mediumAction]}>
                        <SymbolView name={icons.close} size={34} tintColor="#8F747B" />
                    </View>
                    <View style={[styles.actionButton, styles.smallAction, styles.starAction]}>
                        <SymbolView name={icons.star} size={32} tintColor="#00A7E8" />
                    </View>
                    <View style={[styles.actionButton, styles.likeAction]}>
                        <SymbolView name={icons.heart} size={43} tintColor="#FFFFFF" />
                    </View>
                    <View style={[styles.actionButton, styles.smallAction, styles.boostAction]}>
                        <SymbolView name={icons.bolt} size={28} tintColor="#9B35E8" />
                    </View>
                </View>
            </View>

            <MenuMain activeKey="discover" />
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFEFF',
    },
    brand: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    brandName: {
        color: '#D9365D',
        fontSize: 27,
        fontWeight: '800',
    },
    brandSparkle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFE4EC',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    filterButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F5F0F8',
    },
    avatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        borderWidth: 3,
        borderColor: '#F7B5C5',
    },
    discoveryArea: {
        flex: 1,
        minHeight: 0,
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 8,
    },
    profileCard: {
        flex: 1,
        width: '100%',
        justifyContent: 'space-between',
        borderRadius: 30,
        overflow: 'hidden',
        backgroundColor: '#B9A9A7',
    },
    profileImage: {
        borderRadius: 30,
    },
    photoTint: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'rgba(24, 15, 18, 0.16)',
    },
    profileProgress: {
        flexDirection: 'row',
        gap: 5,
        paddingHorizontal: 16,
        paddingTop: 14,
    },
    progressSegment: {
        flex: 1,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.48)',
    },
    activeProgressSegment: {
        backgroundColor: '#FFFFFF',
    },
    profileMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginTop: 6,
        gap: 8,
    },
    metaPill: {
        minHeight: 34,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        paddingHorizontal: 11,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.93)',
    },
    onlineDot: {
        width: 9,
        height: 9,
        borderRadius: 5,
        backgroundColor: '#14B985',
    },
    metaText: {
        color: '#33262B',
        fontSize: 11,
        fontWeight: '600',
    },
    profileDetails: {
        paddingHorizontal: 18,
        paddingTop: 22,
        paddingBottom: 20,
        backgroundColor: 'rgba(20, 13, 16, 0.48)',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 9,
    },
    nameAndBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
    },
    name: {
        color: '#FFFFFF',
        fontSize: 29,
        fontWeight: '800',
    },
    verifiedBadge: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F54D76',
    },
    expandButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.35)',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
        marginTop: 4,
    },
    detailText: {
        flexShrink: 1,
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
    },
    secondaryDetailText: {
        flexShrink: 1,
        color: '#E9DFE2',
        fontSize: 12,
    },
    tags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 7,
        marginTop: 14,
    },
    tag: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '600',
        paddingHorizontal: 11,
        paddingVertical: 7,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.26)',
    },
    actionRow: {
        height: 104,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 2,
    },
    actionButton: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 50,
        backgroundColor: '#FFFFFF',
        shadowColor: '#B97B91',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.11,
        shadowRadius: 9,
        elevation: 3,
    },
    smallAction: {
        width: 56,
        height: 56,
    },
    mediumAction: {
        width: 68,
        height: 68,
    },
    starAction: {
        backgroundColor: '#F4FBFF',
    },
    likeAction: {
        width: 88,
        height: 88,
        backgroundColor: '#E94368',
        shadowColor: '#E94368',
        shadowOpacity: 0.28,
        shadowRadius: 13,
    },
    boostAction: {
        backgroundColor: '#FFFFFF',
    },
});