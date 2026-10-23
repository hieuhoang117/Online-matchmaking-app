import type { Request, Response } from 'express';
import type { AuthRequest } from '../middlewares/authMiddleware.js';
import {
	getInterestByCategory,
	getUserProfileById,
	updateUserProfile,
	type UpdateUserProfileInput,
} from '../services/profileService.js';

const allowedFields = [
	'displayName',
	'phoneNumber',
	'dateOfBirth',
	'gender',
	'targetGender',
	'bio',
] as const;

const optionalFieldMaxLengths: Partial<Record<keyof UpdateUserProfileInput, number>> = {
	phoneNumber: 20,
	dateOfBirth: 20,
	gender: 20,
	targetGender: 20,
};

export const getMyProfile = async (req: AuthRequest, res: Response) => {
	try {
		const data = await getUserProfileById(req.user!.id);

		if (!data) {
			return res.status(404).json({ message: 'Không tìm thấy người dùng' });
		}

		return res.status(200).json({ data });
	} catch {
		return res.status(500).json({ message: 'Không thể lấy thông tin người dùng' });
	}
};

export const updateMyProfile = async (req: AuthRequest, res: Response) => {
	const body: unknown = req.body;
	if (!body || typeof body !== 'object' || Array.isArray(body)) {
		return res.status(400).json({ message: 'Body phải là một object' });
	}

	const entries = Object.entries(body);
	if (entries.length === 0) {
		return res.status(400).json({ message: 'Cần gửi ít nhất một trường để cập nhật' });
	}

	const data: UpdateUserProfileInput = {};
	for (const [field, value] of entries) {
		if (!allowedFields.includes(field as (typeof allowedFields)[number])) {
			return res.status(400).json({ message: `Trường không được hỗ trợ: ${field}` });
		}

		if (field === 'displayName') {
			if (typeof value !== 'string' || value.trim().length === 0 || value.trim().length > 50) {
				return res.status(400).json({ message: 'Tên hiển thị phải từ 1 đến 50 ký tự' });
			}
			data.displayName = value.trim();
			continue;
		}

		if (value !== null && typeof value !== 'string') {
			return res.status(400).json({ message: `${field} phải là chuỗi hoặc null` });
		}

		const normalizedValue = typeof value === 'string' ? value.trim() || null : null;
		const maxLength = optionalFieldMaxLengths[field as keyof UpdateUserProfileInput];
		if (normalizedValue && maxLength && normalizedValue.length > maxLength) {
			return res.status(400).json({ message: `${field} không được vượt quá ${maxLength} ký tự` });
		}

		switch (field) {
			case 'phoneNumber':
				data.phoneNumber = normalizedValue;
				break;
			case 'dateOfBirth':
				data.dateOfBirth = normalizedValue;
				break;
			case 'gender':
				data.gender = normalizedValue;
				break;
			case 'targetGender':
				data.targetGender = normalizedValue;
				break;
			case 'bio':
				data.bio = normalizedValue;
				break;
		}
	}

	try {
		const dataResult = await updateUserProfile(req.user!.id, data);
		return res.status(200).json({ message: 'Cập nhật hồ sơ thành công', data: dataResult });
	} catch (error) {
		if (typeof error === 'object' && error !== null && 'code' in error) {
			if (error.code === 'P2002') {
				return res.status(409).json({ message: 'Số điện thoại đã được sử dụng' });
			}
			if (error.code === 'P2025') {
				return res.status(404).json({ message: 'Không tìm thấy người dùng' });
			}
		}
		return res.status(500).json({ message: 'Không thể cập nhật hồ sơ' });
	}
};

export const getInterestByCategoryController = async (req: Request, res: Response) => {
	const category = req.query.category;
	if (typeof category !== 'string') {
		return res.status(400).json({ message: 'Category phải là chuỗi' });
	}

	try {
		const interests = await getInterestByCategory(category);
		return res.status(200).json({ data: interests });
	} catch {
		return res.status(500).json({ message: 'Không thể lấy danh sách sở thích' });
	}
};