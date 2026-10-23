import prisma from '../config/db.js';

export interface UpdateUserProfileInput {
	displayName?: string;
	phoneNumber?: string | null;
	dateOfBirth?: string | null;
	gender?: string | null;
	targetGender?: string | null;
	bio?: string | null;
}

export const getUserProfileById = async (userId: string) => {
	const user = await prisma.users.findUnique({
		where: { userId },
		select: {
			userId: true,
			username: true,
			displayName: true,
			phoneNumber: true,
			email: true,
			dateOfBirth: true,
			gender: true,
			targetGender: true,
			bio: true,
			status: true,
			profile_photos: {
				select: {
					photoID: true,
					photoURL: true,
					isAvatar: true,
				},
			},
			user_interests: {
				select: {
					interests: {
						select: {
							interestIS: true,
							name: true,
						},
					},
				},
			},
		},
	});

	if (!user) return null;

	return {
		userId: user.userId,
		username: user.username,
		displayName: user.displayName,
		phoneNumber: user.phoneNumber,
		email: user.email,
		dateOfBirth: user.dateOfBirth,
		gender: user.gender,
		targetGender: user.targetGender,
		bio: user.bio,
		status: user.status,
		profilePhotos: user.profile_photos,
		interests: user.user_interests.map(({ interests }) => interests),
	};
};

export const updateUserProfile = async (userId: string, data: UpdateUserProfileInput) => {
	await prisma.users.update({
		where: { userId },
		data,
	});

	return getUserProfileById(userId);
};

export const getInterestByCategory = async (category: string) => {
	const interests = await prisma.interests.findMany({
		where: { category },
	});

	return interests;
};

export const createInterest = async (name: string, category: string) => {
	const interest = await prisma.interests.create({
		data: {
			name,
			category,
		},
	});

	return interest;
};
