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

DELIMITER ;