-- ==========================================================
-- 1. TẠO CƠ SỞ DỮ LIỆU
-- ==========================================================
CREATE DATABASE IF NOT EXISTS dating_app_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dating_app_db;

-- ==========================================================
-- 2. TẠO CÁC BẢNG (TABLES)
-- ==========================================================

-- Bảng 1: User (Người dùng)
CREATE TABLE users (
    userId VARCHAR(36) PRIMARY KEY,
    phoneNumber VARCHAR(20) UNIQUE,
    email VARCHAR(100) UNIQUE NOT NULL,
    passwordHash VARCHAR(255) NOT NULL,
    dateOfBirth VARCHAR(20),
    gender VARCHAR(20),
    targetGender VARCHAR(20),
    bio TEXT,
    status VARCHAR(50) DEFAULT 'active'
);

-- Bảng 2: ProfilePhoto (Ảnh hồ sơ)
CREATE TABLE profile_photos (
    photoID VARCHAR(36) PRIMARY KEY,
    userId VARCHAR(36) NOT NULL,
    photoURL VARCHAR(255) NOT NULL,
    isAvatar BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE
);

-- Bảng 3: Swipe (Lượt quẹt / Tương tác)
CREATE TABLE swipes (
    swipeID VARCHAR(36) PRIMARY KEY,
    sourceUserId VARCHAR(36) NOT NULL,
    targetUserId VARCHAR(36) NOT NULL,
    actionType VARCHAR(20) NOT NULL, -- 'like', 'pass', 'super_like'
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sourceUserId) REFERENCES users(userId) ON DELETE CASCADE,
    FOREIGN KEY (targetUserId) REFERENCES users(userId) ON DELETE CASCADE
);

-- Bảng 4: Match (Tương hợp)
CREATE TABLE matches (
    matchID VARCHAR(36) PRIMARY KEY,
    user1ID VARCHAR(36) NOT NULL,
    user2ID VARCHAR(36) NOT NULL,
    matchedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user1ID) REFERENCES users(userId) ON DELETE CASCADE,
    FOREIGN KEY (user2ID) REFERENCES users(userId) ON DELETE CASCADE
);

-- Bảng 5: Message (Tin nhắn)
CREATE TABLE messages (
    messssageID VARCHAR(36) PRIMARY KEY,
    matchID VARCHAR(36) NOT NULL,
    senderID VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    sentAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (matchID) REFERENCES matches(matchID) ON DELETE CASCADE,
    FOREIGN KEY (senderID) REFERENCES users(userId) ON DELETE CASCADE
);

-- Bảng 6: Report (Báo cáo vi phạm)
CREATE TABLE reports (
    reportID VARCHAR(36) PRIMARY KEY,
    reporterID VARCHAR(36) NOT NULL,
    reportedUserID VARCHAR(36) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'resolved', 'rejected'
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporterID) REFERENCES users(userId) ON DELETE CASCADE,
    FOREIGN KEY (reportedUserID) REFERENCES users(userId) ON DELETE CASCADE
);

-- Bảng 7: Block (Chặn người dùng)
CREATE TABLE blocks (
    blockID VARCHAR(36) PRIMARY KEY,
    blockerID VARCHAR(36) NOT NULL,
    blockedID VARCHAR(36) NOT NULL,
    createdAt VARCHAR(50),
    FOREIGN KEY (blockerID) REFERENCES users(userId) ON DELETE CASCADE,
    FOREIGN KEY (blockedID) REFERENCES users(userId) ON DELETE CASCADE
);

-- Bảng 8: Interest (Sở thích)
CREATE TABLE interests (
    interestIS VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- Bảng 8.1: User_Interests (Bảng trung gian quan hệ nhiều-nhiều giữa User và Interest)
CREATE TABLE user_interests (
    userId VARCHAR(36) NOT NULL,
    interestIS VARCHAR(36) NOT NULL,
    PRIMARY KEY (userId, interestIS),
    FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE,
    FOREIGN KEY (interestIS) REFERENCES interests(interestIS) ON DELETE CASCADE
);

-- Bảng 9: Admin (Quản trị viên)
CREATE TABLE admins (
    adminID VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    passwordHash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin'
);

-- Bảng 10: Notification (Thông báo)
CREATE TABLE notifications (
    notificationID VARCHAR(36) PRIMARY KEY,
    recipientID VARCHAR(36) NOT NULL,
    title VARCHAR(150) NOT NULL,
    content TEXT NOT NULL,
    attribute VARCHAR(100),
    isRead BOOLEAN DEFAULT FALSE
);


-- ==========================================================
-- 3. TẠO CÁC TRIGGER TỰ ĐỘNG HÓA & RÀNG BUỘC
-- ==========================================================

DELIMITER //

-- Trigger 1: Chặn không cho phép tự quẹt chính mình
CREATE TRIGGER check_swipe_self
BEFORE INSERT ON swipes
FOR EACH ROW
BEGIN
    IF NEW.sourceUserId = NEW.targetUserId THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Người dùng không thể tự quẹt chính mình!';
    END IF;
END//

-- Trigger 2: Chặn không cho phép tự chặn chính mình
CREATE TRIGGER check_block_self
BEFORE INSERT ON blocks
FOR EACH ROW
BEGIN
    IF NEW.blockerID = NEW.blockedID THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lỗi: Người dùng không thể tự chặn chính mình!';
    END IF;
END//

-- Trigger 3: Tự động điền thời gian cho bảng blocks nếu để trống
CREATE TRIGGER before_block_insert
BEFORE INSERT ON blocks
FOR EACH ROW
BEGIN
    IF NEW.createdAt IS NULL OR NEW.createdAt = '' THEN
        SET NEW.createdAt = NOW();
    END IF;
END//

-- Trigger 4: Tự động tạo Match khi cả hai cùng thích nhau (Mutual Like)
CREATE TRIGGER auto_create_match
AFTER INSERT ON swipes
FOR EACH ROW
BEGIN
    DECLARE v_reverse_action VARCHAR(20);
    DECLARE v_user1 VARCHAR(36);
    DECLARE v_user2 VARCHAR(36);

    IF NEW.actionType IN ('like', 'super_like') THEN
        -- Kiểm tra đối phương đã quẹt like/super_like ngược lại chưa
        SELECT actionType INTO v_reverse_action
        FROM swipes
        WHERE sourceUserId = NEW.targetUserId 
          AND targetUserId = NEW.sourceUserId
          AND actionType IN ('like', 'super_like');
          
        IF v_reverse_action IS NOT NULL THEN
            IF NEW.sourceUserId < NEW.targetUserId THEN
                SET v_user1 = NEW.sourceUserId;
                SET v_user2 = NEW.targetUserId;
            ELSE
                SET v_user1 = NEW.targetUserId;
                SET v_user2 = NEW.sourceUserId;
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM matches 
                WHERE (user1ID = v_user1 AND user2ID = v_user2)
            ) THEN
                INSERT INTO matches (matchID, user1ID, user2ID, matchedAt)
                VALUES (UUID(), v_user1, v_user2, NOW());
            END IF;
        END IF;
    END IF;
END//

-- Trigger 5: Tự động dọn dẹp các bản ghi liên quan khi một User bị xóa
CREATE TRIGGER after_user_delete
AFTER DELETE ON users
FOR EACH ROW
BEGIN
    DELETE FROM matches 
    WHERE user1ID = OLD.userId OR user2ID = OLD.userId;
    
    DELETE FROM swipes 
    WHERE sourceUserId = OLD.userId OR targetUserId = OLD.userId;
END//

USE dating_app_db

CREATE TABLE refresh_tokens (
    tokenId     VARCHAR(36) PRIMARY KEY,
    accountId   VARCHAR(36) NOT NULL,
    accountType ENUM('user','admin') NOT NULL,
    tokenHash   CHAR(64)    NOT NULL UNIQUE,
    expiresAt   DATETIME    NOT NULL,
    revokedAt   DATETIME    NULL,
    createdAt   DATETIME    DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_refresh_account (accountId, accountType)
);

ALTER TABLE messages RENAME COLUMN messssageID TO messageID;
CREATE INDEX idx_messages_match_time ON messages (matchID, sentAt);

DELIMITER ;
USE dating_app_db;

-- Tắt kiểm tra khóa ngoại tạm thời để dễ dàng chèn dữ liệu theo thứ tự mong muốn
SET FOREIGN_KEY_CHECKS = 0;

-- ==========================================================
-- 1. DỮ LIỆU BẢNG: users (10 dòng)
-- ==========================================================
TRUNCATE TABLE users;
INSERT INTO users (userId, phoneNumber, email, passwordHash, dateOfBirth, gender, targetGender, bio, status) VALUES
('user-01', '0901234501', 'nguyenvanA@gmail.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '1998-05-12', 'Nam', 'Nữ', 'Yêu thích âm nhạc, bóng đá và du lịch bụi.', 'active'),
('user-02', '0901234502', 'tranthiB@gmail.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '2000-08-20', 'Nữ', 'Nam', 'Thích đọc sách, nấu ăn và xem phim cuối tuần.', 'active'),
('user-03', '0901234503', 'levanC@gmail.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '1995-02-15', 'Nam', 'Nữ', 'Lập trình viên đam mê công nghệ và cà phê.', 'active'),
('user-04', '0901234504', 'phamthiD@gmail.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '1999-11-05', 'Nữ', 'Nam', 'Thích chụp ảnh, nghệ thuật và đi dạo công viên.', 'active'),
('user-05', '0901234505', 'hoangvanE@gmail.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '1997-07-22', 'Nam', 'Nữ', 'Gym, thể thao và những chuyến đi phượt xa.', 'active'),
('user-06', '0901234506', 'vuthiF@gmail.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '2001-03-10', 'Nữ', 'Nam', 'Sinh viên thiết kế đồ họa, thích mèo và vẽ tranh.', 'active'),
('user-07', '0901234507', 'buiG@gmail.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '1996-12-01', 'Nam', 'Nữ', 'Doanh nhân trẻ, thích kinh doanh và đọc sách kinh tế.', 'active'),
('user-08', '0901234508', 'ngocH@gmail.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '1998-09-18', 'Nữ', 'Nam', 'Yêu âm nhạc Hàn Quốc và thích làm bánh ngọt.', 'active'),
('user-09', '0901234509', 'dangvanI@gmail.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '1994-06-30', 'Nam', 'Nữ', 'Thích chơi game, công nghệ AI và khám phá ẩm thực.', 'active'),
('user-10', '0901234510', 'vuhoangK@gmail.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '2000-12-25', 'Nữ', 'Nam', 'Thích du lịch biển và nghe nhạc Jazz.', 'active');

-- ==========================================================
-- 2. DỮ LIỆU BẢNG: profile_photos (10 dòng)
-- ==========================================================
TRUNCATE TABLE profile_photos;
INSERT INTO profile_photos (photoID, userId, photoURL, isAvatar) VALUES
('photo-01', 'user-01', 'https://example.com/photos/user1_avatar.jpg', TRUE),
('photo-02', 'user-02', 'https://example.com/photos/user2_avatar.jpg', TRUE),
('photo-03', 'user-03', 'https://example.com/photos/user3_avatar.jpg', TRUE),
('photo-04', 'user-04', 'https://example.com/photos/user4_avatar.jpg', TRUE),
('photo-05', 'user-05', 'https://example.com/photos/user5_avatar.jpg', TRUE),
('photo-06', 'user-06', 'https://example.com/photos/user6_avatar.jpg', TRUE),
('photo-07', 'user-07', 'https://example.com/photos/user7_avatar.jpg', TRUE),
('photo-08', 'user-08', 'https://example.com/photos/user8_avatar.jpg', TRUE),
('photo-09', 'user-09', 'https://example.com/photos/user9_avatar.jpg', TRUE),
('photo-10', 'user-10', 'https://example.com/photos/user10_avatar.jpg', TRUE);

-- ==========================================================
-- 3. DỮ LIỆU BẢNG: interests (10 dòng)
-- ==========================================================
TRUNCATE TABLE interests;
INSERT INTO interests (interestIS, name) VALUES
('int-01', 'Du lịch'),
('int-02', 'Âm nhạc'),
('int-03', 'Đọc sách'),
('int-04', 'Chơi game'),
('int-05', 'Nấu ăn'),
('int-06', 'Thể thao'),
('int-07', 'Nhiếp ảnh'),
('int-08', 'Phim ảnh'),
('int-09', 'Công nghệ'),
('int-10', 'Cà phê');

-- ==========================================================
-- 4. DỮ LIỆU BẢNG: user_interests (10 dòng)
-- ==========================================================
TRUNCATE TABLE user_interests;
INSERT INTO user_interests (userId, interestIS) VALUES
('user-01', 'int-01'),
('user-01', 'int-02'),
('user-02', 'int-03'),
('user-02', 'int-05'),
('user-03', 'int-04'),
('user-03', 'int-09'),
('user-04', 'int-07'),
('user-05', 'int-06'),
('user-08', 'int-02'),
('user-10', 'int-01');

-- ==========================================================
-- 5. DỮ LIỆU BẢNG: admins (10 dòng)
-- ==========================================================
TRUNCATE TABLE admins;
INSERT INTO admins (adminID, username, passwordHash, role) VALUES
('admin-01', 'admin_root', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'super_admin'),
('admin-02', 'mod_tuan', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'moderator'),
('admin-03', 'mod_lan', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'moderator'),
('admin-04', 'support_hung', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'support'),
('admin-05', 'support_mai', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'support'),
('admin-06', 'mod_nam', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'moderator'),
('admin-07', 'mod_hoa', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'moderator'),
('admin-08', 'admin_duc', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'admin'),
('admin-09', 'support_trang', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'support'),
('admin-10', 'admin_kien', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'admin');

-- ==========================================================
-- 6. DỮ LIỆU BẢNG: swipes (10 dòng)
-- ==========================================================
TRUNCATE TABLE swipes;
INSERT INTO swipes (swipeID, sourceUserId, targetUserId, actionType, createdAt) VALUES
('swipe-01', 'user-01', 'user-02', 'like', NOW()),
('swipe-02', 'user-02', 'user-01', 'like', NOW()), -- Sẽ kích hoạt Trigger tự động tạo Match
('swipe-03', 'user-03', 'user-04', 'super_like', NOW()),
('swipe-04', 'user-04', 'user-03', 'like', NOW()), -- Sẽ kích hoạt Trigger tự động tạo Match
('swipe-05', 'user-05', 'user-06', 'pass', NOW()),
('swipe-06', 'user-01', 'user-04', 'pass', NOW()),
('swipe-07', 'user-02', 'user-03', 'like', NOW()),
('swipe-08', 'user-06', 'user-05', 'like', NOW()),
('swipe-09', 'user-07', 'user-08', 'super_like', NOW()),
('swipe-10', 'user-08', 'user-07', 'like', NOW()); -- Sẽ kích hoạt Trigger tự động tạo Match

-- ==========================================================
-- 7. DỮ LIỆU BẢNG: matches (10 dòng)
-- ==========================================================
TRUNCATE TABLE matches;
INSERT INTO matches (matchID, user1ID, user2ID, matchedAt) VALUES
('match-01', 'user-01', 'user-02', NOW()),
('match-02', 'user-03', 'user-04', NOW()),
('match-03', 'user-07', 'user-08', NOW()),
('match-04', 'user-01', 'user-06', NOW()),
('match-05', 'user-02', 'user-05', NOW()),
('match-06', 'user-03', 'user-07', NOW()),
('match-07', 'user-04', 'user-08', NOW()),
('match-08', 'user-05', 'user-09', NOW()),
('match-09', 'user-06', 'user-10', NOW()),
('match-10', 'user-02', 'user-09', NOW());

-- ==========================================================
-- 8. DỮ LIỆU BẢNG: messages (10 dòng)
-- ==========================================================
TRUNCATE TABLE messages;
INSERT INTO messages (messageID, matchID, senderID, content, sentAt) VALUES
('msg-01', 'match-01', 'user-01', 'Xin chào bạn, rất vui được làm quen!', NOW()),
('msg-02', 'match-01', 'user-02', 'Chào bạn nhé, chúc bạn một ngày tốt lành!', NOW()),
('msg-03', 'match-02', 'user-03', 'Chào bạn, bạn thích xem phim gì thế?', NOW()),
('msg-04', 'match-02', 'user-04', 'Mình thích xem phim hành động và trinh thám.', NOW()),
('msg-05', 'match-03', 'user-07', 'Hello bạn, cuối tuần này có rảnh đi cà phê không?', NOW()),
('msg-06', 'match-03', 'user-08', 'Mình rất sẵn lòng nha!', NOW()),
('msg-07', 'match-04', 'user-01', 'Hôm nay thế nào rồi bạn?', NOW()),
('msg-08', 'match-05', 'user-02', 'Bạn thích tập môn thể thao nào nhất?', NOW()),
('msg-09', 'match-06', 'user-03', 'Dự án dạo này bận không bạn ơi?', NOW()),
('msg-10', 'match-07', 'user-04', 'Cho mình làm quen với nhé.', NOW());

-- ==========================================================
-- 9. DỮ LIỆU BẢNG: reports (10 dòng)
-- ==========================================================
TRUNCATE TABLE reports;
INSERT INTO reports (reportID, reporterID, reportedUserID, reason, status, createdAt) VALUES
('rep-01', 'user-01', 'user-09', 'Tài khoản giả mạo người khác', 'pending', NOW()),
('rep-02', 'user-02', 'user-07', 'Sử dụng ngôn từ xúc phạm trong tin nhắn', 'pending', NOW()),
('rep-03', 'user-03', 'user-05', 'Đăng ảnh không phù hợp tiêu chuẩn cộng đồng', 'resolved', NOW()),
('rep-04', 'user-04', 'user-01', 'Spam tin nhắn quảng cáo', 'rejected', NOW()),
('rep-05', 'user-05', 'user-06', 'Lừa đảo tài chính', 'pending', NOW()),
('rep-06', 'user-06', 'user-02', 'Hành vi quấy rối', 'pending', NOW()),
('rep-07', 'user-07', 'user-03', 'Thông tin hồ sơ sai sự thật', 'resolved', NOW()),
('rep-08', 'user-08', 'user-10', 'Giả mạo người nổi tiếng', 'pending', NOW()),
('rep-09', 'user-09', 'user-04', 'Quấy rối đời tư', 'rejected', NOW()),
('rep-10', 'user-10', 'user-01', 'Tài khoản bot tự động', 'pending', NOW());

-- ==========================================================
-- 10. DỮ LIỆU BẢNG: blocks (10 dòng)
-- ==========================================================
TRUNCATE TABLE blocks;
INSERT INTO blocks (blockID, blockerID, blockedID, createdAt) VALUES
('block-01', 'user-01', 'user-10', NOW()),
('block-02', 'user-02', 'user-09', NOW()),
('block-03', 'user-03', 'user-08', NOW()),
('block-04', 'user-04', 'user-07', NOW()),
('block-05', 'user-05', 'user-06', NOW()),
('block-06', 'user-06', 'user-01', NOW()),
('block-07', 'user-07', 'user-02', NOW()),
('block-08', 'user-08', 'user-03', NOW()),
('block-09', 'user-09', 'user-04', NOW()),
('block-10', 'user-10', 'user-05', NOW());

-- ==========================================================
-- 11. DỮ LIỆU BẢNG: notifications (10 dòng)
-- ==========================================================
TRUNCATE TABLE notifications;
INSERT INTO notifications (notificationID, recipientID, title, content, attribute, isRead) VALUES
('notif-01', 'user-01', 'Có lượt Match mới!', 'Bạn vừa có một lượt tương hợp mới với user-02.', 'match', FALSE),
('notif-02', 'user-02', 'Tin nhắn mới', 'Bạn có tin nhắn từ user-01.', 'message', FALSE),
('notif-03', 'user-03', 'Chào mừng', 'Chào mừng bạn đến với Amour Dating App!', 'system', TRUE),
('notif-04', 'user-04', 'Cảnh báo hệ thống', 'Hồ sơ của bạn đã được cập nhật thành công.', 'system', TRUE),
('notif-05', 'user-05', 'Có lượt Match mới!', 'Bạn vừa có một lượt tương hợp mới với user-06.', 'match', FALSE),
('notif-06', 'user-06', 'Tin nhắn mới', 'Bạn có tin nhắn mới từ đối phương.', 'message', FALSE),
('notif-07', 'user-07', 'Khuyến mãi Premium', 'Nâng cấp tài khoản Premium để xem ai đã thích bạn.', 'promotion', FALSE),
('notif-08', 'user-08', 'Bảo trì hệ thống', 'Hệ thống sẽ bảo trì vào lúc 00:00 đêm nay.', 'system', TRUE),
('notif-09', 'user-09', 'Có lượt Match mới!', 'Bạn vừa có một lượt tương hợp mới.', 'match', FALSE),
('notif-10', 'user-10', 'Tin nhắn mới', 'Bạn nhận được một tin nhắn mới.', 'message', FALSE);

-- ==========================================================
-- 12. DỮ LIỆU BẢNG: refresh_tokens (10 dòng)
-- ==========================================================
TRUNCATE TABLE refresh_tokens;
INSERT INTO refresh_tokens (tokenId, accountId, accountType, tokenHash, expiresAt, revokedAt, createdAt) VALUES
('token-01', 'user-01', 'user', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', DATE_ADD(NOW(), INTERVAL 7 DAY), NULL, NOW()),
('token-02', 'user-02', 'user', '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b', DATE_ADD(NOW(), INTERVAL 7 DAY), NULL, NOW()),
('token-03', 'user-03', 'user', 'd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35', DATE_ADD(NOW(), INTERVAL 7 DAY), NULL, NOW()),
('token-04', 'user-04', 'user', '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce', DATE_ADD(NOW(), INTERVAL 7 DAY), NULL, NOW()),
('token-05', 'user-05', 'user', '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a', DATE_ADD(NOW(), INTERVAL 7 DAY), NULL, NOW()),
('token-06', 'admin-01', 'admin', 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d', DATE_ADD(NOW(), INTERVAL 1 DAY), NULL, NOW()),
('token-07', 'admin-02', 'admin', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', DATE_ADD(NOW(), INTERVAL 1 DAY), NULL, NOW()),
('token-08', 'user-06', 'user', 'e533d525fde4474773c36cbe48d797170a7d976fc881cc143c7b8c8d8b2d42eb', DATE_ADD(NOW(), INTERVAL 7 DAY), NULL, NOW()),
('token-09', 'user-07', 'user', '79054025255fb1a26e4bc422aef54eb40ad2c673995f191a32f6a623910c710b', DATE_ADD(NOW(), INTERVAL 7 DAY), NULL, NOW()),
('token-10', 'admin-03', 'admin', '5811804f58c738e4a9e5264b9b9409b0b467ec74668f44d5cbf2fc321a50a6db', DATE_ADD(NOW(), INTERVAL 1 DAY), NULL, NOW());

-- Bật lại kiểm tra khóa ngoại sau khi đã hoàn tất chèn dữ liệu
SET FOREIGN_KEY_CHECKS = 1;