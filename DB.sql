CREATE DATABASE IF NOT EXISTS SkillSwap
    DEFAULT CHARACTER SET = 'utf8mb4';
USE SkillSwap;

create table College(
    college_id INT PRIMARY KEY AUTO_INCREMENT,
    college_name VARCHAR(150) NOT NULL,
    email_domain VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


create table Students(
    student_id SERIAL PRIMARY KEY,
    college_id INT REFERENCES colleges(college_id),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    department VARCHAR(100),
    year INT,
    role VARCHAR(20) DEFAULT 'learner',
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

alter table Students
add constraint college_email_check 
check (email like '%@%.ac.in');

CREATE TABLE specializations (
    specialization_id SERIAL PRIMARY KEY,
    specialization_name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE student_specializations (
    student_id INT REFERENCES students(student_id),
    specialization_id INT REFERENCES specializations(specialization_id),
    proficiency INT CHECK (proficiency BETWEEN 1 AND 5),
    PRIMARY KEY (student_id, specialization_id)
);

CREATE TABLE availability_status (
    student_id INT PRIMARY KEY REFERENCES students(student_id),
    is_available BOOLEAN DEFAULT TRUE,
    last_seen TIMESTAMP,
    status_message VARCHAR(100)
);

CREATE TABLE chat_rooms (
    room_id SERIAL PRIMARY KEY,
    student1_id INT REFERENCES students(student_id),
    student2_id INT REFERENCES students(student_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
    message_id SERIAL PRIMARY KEY,
    room_id INT REFERENCES chat_rooms(room_id),
    sender_id INT REFERENCES students(student_id),
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE video_call_sessions (
    call_id SERIAL PRIMARY KEY,
    room_id INT REFERENCES chat_rooms(room_id),
    caller_id INT REFERENCES students(student_id),
    receiver_id INT REFERENCES students(student_id),
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    status VARCHAR(20)
);

