-- Create the Master Database
CREATE DATABASE IF NOT EXISTS student_results_master;

-- Switch to the Master Database
USE student_results_master;
-- SQL for Unified Database Setup
-- Use the database name configured in server/db.js (e.g., student_results)

-- 1. Students Table (Unified for all batches)
CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(10) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  branch VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL, 
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Admins Table (Unified)
CREATE TABLE IF NOT EXISTS admins (
  id VARCHAR(10) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Subjects Table (Unified, all subjects for all years)
CREATE TABLE IF NOT EXISTS subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  semester INT NOT NULL,
  max_marks INT DEFAULT 100,
  is_lab BOOLEAN DEFAULT FALSE
);

-- 4. Partitioned Marks Tables (Repeat for 28, 27, 26, 25)

-- Marks Table for 2028 Batch (student IDs starting with 28)
CREATE TABLE IF NOT EXISTS marks_28 (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(10) NOT NULL,
  subject_id INT,
  internal_marks INT NOT NULL DEFAULT 0,
  external_marks INT NOT NULL DEFAULT 0,
  semester INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  UNIQUE KEY unique_mark (student_id, subject_id)
);

-- Marks Table for 2027 Batch (student IDs starting with 27)
CREATE TABLE IF NOT EXISTS marks_27 (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(10) NOT NULL,
  subject_id INT,
  internal_marks INT NOT NULL DEFAULT 0,
  external_marks INT NOT NULL DEFAULT 0,
  semester INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  UNIQUE KEY unique_mark (student_id, subject_id)
);

-- Marks Table for 2026 Batch (student IDs starting with 26)
CREATE TABLE IF NOT EXISTS marks_26 (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(10) NOT NULL,
  subject_id INT,
  internal_marks INT NOT NULL DEFAULT 0,
  external_marks INT NOT NULL DEFAULT 0,
  semester INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  UNIQUE KEY unique_mark (student_id, subject_id)
);

-- Marks Table for 2025 Batch (student IDs starting with 25)
CREATE TABLE IF NOT EXISTS marks_25 (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(10) NOT NULL,
  subject_id INT,
  internal_marks INT NOT NULL DEFAULT 0,
  external_marks INT NOT NULL DEFAULT 0,
  semester INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  UNIQUE KEY unique_mark (student_id, subject_id)
);


-- Use the master database
USE student_results_master;

-- Delete existing subjects to allow for clean re-insertion and avoid code conflicts
DELETE FROM subjects;
ALTER TABLE subjects AUTO_INCREMENT = 1;

-- SQL INSERT statements for all subjects from all semesters (1-8)
INSERT INTO subjects (code, name, semester, max_marks, is_lab) VALUES
-- ------------------------------
-- SEMESTER 1 (Max Marks: 100)
-- ------------------------------
('S1CS01', 'C-PROGRAMMING & DATA STRUCTURES', 1, 100, FALSE),
('S1HS02', 'Chemistry', 1, 100, FALSE),
('S1EE03', 'BASIC ELECTRICAL & ELECTRONICS ENGINEERING', 1, 100, FALSE),
('S1MA04', 'LINEAR ALGEBRA AND CALCULUS', 1, 100, FALSE),

-- Labs (Max Marks: 100)
('S1EL05', 'BASIC ELECTRICAL & ELECTRONICS ENGINEERING LAB', 1, 100, TRUE),
('S1CH06', 'Chemistry Lab', 1, 100, TRUE),
('S1IT07', 'IT WORKSHOP', 1, 100, TRUE),
('S1EW08', 'ENGINEERING WORKSHOP', 1, 100, TRUE),
('S1CL09', 'C-PROGRAMMING & DATA STRUCTURES LAB', 1, 100, TRUE),

-- ------------------------------
-- SEMESTER 2 (Max Marks: 100)
-- ------------------------------
('S2ED01', 'ENGINEERING DRAWING', 2, 100, FALSE),
('S2EN02', 'COMMUNICATIVE ENGLISH', 2, 100, FALSE),
('S2AP03', 'APPLIED PHYSICS', 2, 100, FALSE),
('S2PY04', 'PYTHON PROGRAMMING & DATA SCIENCE', 2, 100, FALSE),
('S2PS05', 'PROBABILITY & STATISTICS', 2, 100, FALSE),

-- Labs (Max Marks: 100)
('S2AL06', 'APPLIED PHYSICS LAB', 2, 100, TRUE),
('S2EG07', 'ENGINEERING GRAPHICS LAB', 2, 100, TRUE),
('S2CE08', 'COMMUNICATIVE ENGLISH LAB', 2, 100, TRUE),
('S2PD09', 'PYTHON PROGRAMMING & DATA SCIENCE LAB', 2, 100, TRUE),

-- ------------------------------
-- SEMESTER 3 (Max Marks: 100)
-- ------------------------------
('S3CO01', 'COMPUTER ORGANIZATION', 3, 100, FALSE),
('S3DM02', 'DISCRETE MATHEMATICS & GRAPH THEORY', 3, 100, FALSE),
('S3JV03', 'OBJECT ORIENTED PROGRAMMING THROUGH JAVA', 3, 100, FALSE),
('S3AD04', 'ADVANCED DATA STRUCTURES & ALGORITHMS', 3, 100, FALSE),
('S3DE05', 'DIGITAL ELECTRONICS & MICROPROCESSORS', 3, 100, FALSE),
('S3UV06', 'UNIVERSAL HUMAN VALUES', 3, 100, FALSE),

-- Labs (Max Marks: 100)
('S3JL07', 'OBJECT ORIENTED PROGRAMMING THROUGH JAVA LAB', 3, 100, TRUE),
('S3AL08', 'ADVANCED DATA STRUCTURES & ALGORITHMS LAB', 3, 100, TRUE),
('S3DL09', 'DIGITAL ELECTRONICS & MICROPROCESSORS LAB', 3, 100, TRUE),

-- ------------------------------
-- SEMESTER 4
-- ------------------------------
-- Custom 30 Marks subjects
('S4NN01', 'NSS/NCC/NSO ACTIVITIES', 4, 30, FALSE),
('S4DT02', 'DESIGN THINKING FOR INNOVATION', 4, 30, FALSE),
-- Standard 100 Marks subjects
('S4DB03', 'DATABASE MANAGEMENT SYSTEMS', 4, 100, FALSE),
('S4DS04', 'DETERMINISTIC & STOCHASTIC STATISTICAL METHODS', 4, 100, FALSE),
('S4OS05', 'OPERATING SYSTEMS', 4, 100, FALSE),
('S4SE06', 'SOFTWARE ENGINEERING', 4, 100, FALSE),
('S4ME07', 'MANAGERIAL ECONOMICS & FINANCIAL ANALYSIS', 4, 100, FALSE),
('S4ED08', 'SOC-II: EXPLORATORY DATA ANALYSIS WITH R', 4, 100, FALSE),

-- Labs (Max Marks: 100)
('S4DL09', 'DATABASE MANAGEMENT SYSTEMS LAB', 4, 100, TRUE),
('S4SL10', 'SOFTWARE ENGINEERING LAB', 4, 100, TRUE),
('S4OL11', 'OPERATING SYSTEMS LAB', 4, 100, TRUE),

-- ------------------------------
-- SEMESTER 5
-- ------------------------------
-- Custom 30 Marks subjects
('S5ES01', 'ENVIRONMENTAL SCIENCE', 5, 30, FALSE),
-- Standard 100 Marks subjects
('S5CN02', 'Computer Networks', 5, 100, FALSE),
('S5AI03', 'Artificial Intelligence', 5, 100, FALSE),
('S5SP04', 'SOFTWARE PROJECT MANAGEMENT', 5, 100, FALSE),
('S5FL05', 'FORMAL LANGUAGES AND AUTOMATA THEORY', 5, 100, FALSE),
('S5CF06', 'COMPUTER APPLICATIONS IN FOOD PROCESSING', 5, 100, FALSE),
('S5CS07', 'COMMUNITY SERVICE PROJECT', 5, 100, FALSE),
('S5SW08', 'SOC III-ADVANCED WEB APPLICATION DEVELOPMENT', 5, 100, FALSE),

-- Labs (Max Marks: 100)
('S5CL09', 'COMPUTER NETWORKS LAB', 5, 100, TRUE),
('S5AL10', 'ARTIFICIAL INTELLIGENCE LAB', 5, 100, TRUE),

-- ------------------------------
-- SEMESTER 6
-- ------------------------------
-- Custom 30 Marks subjects
('S6IP01', 'INTELLECTUAL PROPERTY RIGHTS & PATENTS', 6, 30, FALSE),
-- Standard 100 Marks subjects
('S6CD02', 'COMPILER DESIGN', 6, 100, FALSE),
('S6BV03', 'BASIC VLSI DESIGN', 6, 100, FALSE),
('S6IO04', 'Internet of Things', 6, 100, FALSE),
('S6ML05', 'MACHINE LEARNING', 6, 100, FALSE),
('S6ST06', 'SOFTWARE TESTING', 6, 100, FALSE),
('S6SS07', 'SOC-IV:SOFT SKILLS', 6, 100, FALSE),

-- Labs (Max Marks: 100)
('S6IL08', 'INTERNET OF THINGS LAB', 6, 100, TRUE),
('S6CL09', 'COMPILER DESIGN LAB', 6, 100, TRUE),
('S6ML10', 'MACHINE LEARNING LAB', 6, 100, TRUE),

-- ------------------------------
-- SEMESTER 7 (Max Marks: 100)
-- ------------------------------
('S7MS01', 'Management Science', 7, 100, FALSE),
('S7NM02', 'Numerical Methods for Engineers', 7, 100, FALSE),
('S7HS03', 'Health Safety & Environmental Management', 7, 100, FALSE),
('S7CC04', 'Cloud Computing', 7, 100, FALSE),
('S7FS05', 'Full Stack Development', 7, 100, FALSE),
('S7CN06', 'Cryptography & Network Security', 7, 100, FALSE),
('S7EI07', 'Evaluation of Industry Internship', 7, 100, FALSE),
('S7MD08', 'SOC-V Mobile Application Development', 7, 100, FALSE),

-- ------------------------------
-- SEMESTER 8 (Project Max Marks: 200)
-- ------------------------------
('S8IP01', 'Internship & Project', 8, 200, FALSE);
