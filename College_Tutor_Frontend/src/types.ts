
export enum Proficiency {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
  EXPERT = 'Expert'
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  proficiency: Proficiency;
  isOffered: boolean; // true if offering, false if wanting
}

export interface User {
  id: string;
  name: string;
  email: string;
  bio: string;
  avatar: string;
  skillsOffered: Skill[];
  skillsWanted: Skill[];
  points: number;
  badges: string[];
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  role: 'user' | 'admin';
  availability: string[]; // ['Mon 10:00-12:00', ...]
  location?: string;
  department?: string;
  year?: number;
  joinedDate: string;
}

export interface MatchResult {
  matchId: string;
  score: number;
  reason: string;
  complementarySkills: string[];
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  isRead: boolean;
  attachment?: {
    name: string;
    type: string;
    data: string; // base64 string
    size?: number;
  };
}

export interface Booking {
  id?: string;
  booking_id?: string | number; // Backend field
  teacherId?: string;
  teacher_id?: string | number; // Backend field
  learnerId?: string;
  learner_id?: string | number; // Backend field
  skillId?: string;
  skill_id?: string; // Backend field
  initiatorId?: string; 
  initiator_id?: string | number; // Backend field
  skillName?: string;
  skill_name?: string; // Backend field
  startTime?: string;
  start_time?: string; // Backend field
  endTime?: string;
  end_time?: string; // Backend field
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled' | 'confirmed';
  notes?: string;
  milestones: Milestone[];
  // Helper fields from DB join
  teacher_name?: string;
  teacher_avatar?: string;
  learner_name?: string;
  learner_avatar?: string;
}

export interface Milestone {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Review {
  id: string;
  bookingId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string;
  timestamp: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}
