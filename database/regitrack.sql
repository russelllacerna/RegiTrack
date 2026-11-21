-- RegiTrack database schema and demo data (MySQL / MariaDB, e.g. XAMPP)
-- Import in phpMyAdmin: Import tab -> choose this file -> Go.
-- Tables follow the Chapter 2 data dictionary (Tables 12-18).
-- Demo data is FICTIONAL. Never load real student records into a development database.

DROP DATABASE IF EXISTS regitrack;
CREATE DATABASE regitrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE regitrack;

-- Table 12: accounts of all system users
CREATE TABLE users (
  user_id        INT AUTO_INCREMENT PRIMARY KEY,
  full_name      VARCHAR(150) NOT NULL,
  username       VARCHAR(50)  NOT NULL UNIQUE,
  email          VARCHAR(150) NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  role           ENUM('student','registrar','admin') NOT NULL,
  account_status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  can_approve    TINYINT(1) NOT NULL DEFAULT 0,
  created_at     DATETIME NOT NULL
) ENGINE=InnoDB;

-- Table 13: student-specific details required by the Registrar
CREATE TABLE student_profiles (
  student_profile_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id            INT NOT NULL UNIQUE,
  student_number     VARCHAR(20)  NOT NULL UNIQUE,
  course             VARCHAR(100) NOT NULL,
  years_attended     VARCHAR(20)  NOT NULL,
  program_level      ENUM('Undergraduate','Graduate') NOT NULL DEFAULT 'Undergraduate',
  coordinator        VARCHAR(150) NULL,
  CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

-- Table 14: documents the Registrar's Office issues
CREATE TABLE document_types (
  document_type_id INT AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(100) NOT NULL UNIQUE,
  description      TEXT NULL,
  is_active        TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- Table 15: document requests filed by students
-- student_notes is an addition to the data dictionary (optional notes typed by the student).
CREATE TABLE requests (
  request_id         INT AUTO_INCREMENT PRIMARY KEY,
  reference_number   VARCHAR(20)  NOT NULL UNIQUE,
  student_profile_id INT NOT NULL,
  document_type_id   INT NOT NULL,
  purpose            VARCHAR(255) NOT NULL,
  student_notes      TEXT NULL,
  status             VARCHAR(30)  NOT NULL,
  release_date       DATE NULL,
  remarks            TEXT NULL,
  assigned_staff_id  INT NULL,
  submitted_at       DATETIME NOT NULL,
  updated_at         DATETIME NOT NULL,
  CONSTRAINT fk_request_profile  FOREIGN KEY (student_profile_id) REFERENCES student_profiles(student_profile_id),
  CONSTRAINT fk_request_doctype  FOREIGN KEY (document_type_id)   REFERENCES document_types(document_type_id),
  CONSTRAINT fk_request_staff    FOREIGN KEY (assigned_staff_id)  REFERENCES users(user_id)
) ENGINE=InnoDB;

-- Table 16: uploaded supporting requirements (used in a later sprint, FR3)
CREATE TABLE attachments (
  attachment_id   INT AUTO_INCREMENT PRIMARY KEY,
  request_id      INT NOT NULL,
  attachment_type ENUM('Valid ID','Authorization Letter','Representative ID') NOT NULL,
  file_name       VARCHAR(255) NOT NULL,
  file_path       VARCHAR(255) NOT NULL,
  uploaded_at     DATETIME NOT NULL,
  CONSTRAINT fk_attachment_request FOREIGN KEY (request_id) REFERENCES requests(request_id)
) ENGINE=InnoDB;

-- Table 17: audit trail of status changes (FR11)
CREATE TABLE status_history (
  history_id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  status     VARCHAR(30) NOT NULL,
  remarks    TEXT NULL,
  changed_by INT NOT NULL,
  changed_at DATETIME NOT NULL,
  CONSTRAINT fk_history_request FOREIGN KEY (request_id) REFERENCES requests(request_id),
  CONSTRAINT fk_history_user    FOREIGN KEY (changed_by) REFERENCES users(user_id)
) ENGINE=InnoDB;

-- Table 18: in-system notifications (used in a later sprint, FR6)
CREATE TABLE notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  request_id      INT NULL,
  message         VARCHAR(255) NOT NULL,
  is_read         TINYINT(1) NOT NULL DEFAULT 0,
  created_at      DATETIME NOT NULL,
  CONSTRAINT fk_notif_user    FOREIGN KEY (user_id)    REFERENCES users(user_id),
  CONSTRAINT fk_notif_request FOREIGN KEY (request_id) REFERENCES requests(request_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- Demo data (fictional). Passwords are bcrypt hashes of:
--   admin / admin123, registrar / registrar123, approver / approver123,
--   student / student123, student2 / student123
-- ---------------------------------------------------------------
INSERT INTO users (user_id, full_name, username, email, password_hash, role, account_status, can_approve, created_at) VALUES
(1, 'System Administrator', 'admin',     NULL, '$2y$10$kEgWhX6Ogj.vUm.VuvNiAejCyxJjb7Pj6Pge4zrv70S78dMyGNJE6', 'admin',     'Active', 0, '2026-11-21 08:00:00'),
(2, 'Registrar Staff',      'registrar', NULL, '$2y$10$YaruVvL5YLaYX.JHBgP/PeIdLVj/xtPuPXND7Va7z6GKHcxjiF7fe', 'registrar', 'Active', 0, '2026-11-21 08:00:00'),
(3, 'Authorized Registrar', 'approver',  NULL, '$2y$10$R7/8OrnEmoiLyie8Yud.b./TzTpio/1JeM5MQdv4zGJxYRpvNlVUG', 'registrar', 'Active', 1, '2026-11-21 08:00:00'),
(4, 'Demo Student',         'student',   NULL, '$2y$10$hkc8JoJ01fhIpGSm/zecvO4Bl7RukGudTFkiJinXERoLauT1QfUje', 'student',   'Active', 0, '2026-11-21 08:00:00'),
(5, 'Alex Santos',          'student2',  NULL, '$2y$10$hkc8JoJ01fhIpGSm/zecvO4Bl7RukGudTFkiJinXERoLauT1QfUje', 'student',   'Active', 0, '2026-11-21 08:00:00');

INSERT INTO student_profiles (student_profile_id, user_id, student_number, course, years_attended, program_level, coordinator) VALUES
(1, 4, '2023-00001', 'BS Information Technology', '2023-2026', 'Undergraduate', NULL),
(2, 5, '2022-00114', 'BS Business Administration', '2022-2025', 'Undergraduate', NULL);

INSERT INTO document_types (document_type_id, name, description, is_active) VALUES
(1, 'Transcript of Records (TOR)', NULL, 1),
(2, 'Certified True Copy of Credentials', 'TOR, Diploma, or Certificate of Registration', 1),
(3, 'Certificate of Registration (COR)', NULL, 1),
(4, 'Certificate of Enrollment', NULL, 1),
(5, 'Certificate of Graduation', NULL, 1),
(6, 'Certificate of Units Earned', NULL, 1);

INSERT INTO requests (request_id, reference_number, student_profile_id, document_type_id, purpose, student_notes, status, release_date, remarks, assigned_staff_id, submitted_at, updated_at) VALUES
(1, 'RT-2026-0001', 1, 4, 'School requirement', NULL, 'Submitted',    NULL,         NULL, NULL, '2026-11-18 09:15:00', '2026-11-18 09:15:00'),
(2, 'RT-2026-0002', 2, 1, 'Employment',         NULL, 'Verification', NULL,         NULL, 2,    '2026-11-17 10:30:00', '2026-11-18 14:00:00'),
(3, 'RT-2026-0003', 2, 6, 'Transfer',           NULL, 'Processing',   '2026-11-27', 'Release date set', 2, '2026-11-14 13:00:00', '2026-11-19 11:20:00');

INSERT INTO status_history (request_id, status, remarks, changed_by, changed_at) VALUES
(1, 'Submitted',    'Request submitted', 4, '2026-11-18 09:15:00'),
(2, 'Submitted',    'Request submitted', 5, '2026-11-17 10:30:00'),
(2, 'Verification', NULL,                2, '2026-11-18 14:00:00'),
(3, 'Submitted',    'Request submitted', 5, '2026-11-14 13:00:00'),
(3, 'Verification', NULL,                2, '2026-11-15 09:00:00'),
(3, 'Processing',   'Release date set',  2, '2026-11-19 11:20:00');
