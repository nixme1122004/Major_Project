
import { User, Proficiency, Booking, Message, Review } from '../types';

const USERS_KEY = 'skillswap_users';
const BOOKINGS_KEY = 'skillswap_bookings';
const MESSAGES_KEY = 'skillswap_messages';
const REVIEWS_KEY = 'skillswap_reviews';

const INITIAL_USERS: User[] = [
  {
    id: 'u1',
    name: 'Sarah Chen',
    email: 'sarah@example.com',
    bio: 'Senior Software Engineer specializing in React and Node.js. Love teaching coding and want to learn oil painting.',
    avatar: 'https://picsum.photos/seed/sarah/200',
    skillsOffered: [
      { id: 's1', name: 'React', category: 'Programming', proficiency: Proficiency.EXPERT, isOffered: true },
      { id: 's2', name: 'Node.js', category: 'Programming', proficiency: Proficiency.ADVANCED, isOffered: true }
    ],
    skillsWanted: [
      { id: 's3', name: 'Oil Painting', category: 'Arts', proficiency: Proficiency.BEGINNER, isOffered: false }
    ],
    points: 450,
    badges: ['Mentor', 'Pioneer'],
    rating: 4.9,
    reviewCount: 24,
    isVerified: true,
    role: 'user',
    availability: ['Mon 18:00-20:00', 'Sat 10:00-14:00'],
    joinedDate: '2023-11-01'
  },
  {
    id: 'u2',
    name: 'Marcus Bell',
    email: 'marcus@example.com',
    bio: 'Professional artist with 10 years experience in traditional mediums. Looking to build a personal portfolio website.',
    avatar: 'https://picsum.photos/seed/marcus/200',
    skillsOffered: [
      { id: 's3', name: 'Oil Painting', category: 'Arts', proficiency: Proficiency.EXPERT, isOffered: true },
      { id: 's4', name: 'Sketching', category: 'Arts', proficiency: Proficiency.EXPERT, isOffered: true }
    ],
    skillsWanted: [
      { id: 's1', name: 'Web Development', category: 'Programming', proficiency: Proficiency.BEGINNER, isOffered: false }
    ],
    points: 320,
    badges: ['Artist'],
    rating: 4.7,
    reviewCount: 15,
    isVerified: true,
    role: 'user',
    availability: ['Wed 15:00-17:00', 'Sun 10:00-12:00'],
    joinedDate: '2023-12-15'
  },
  {
    id: 'admin',
    name: 'Admin User',
    email: 'admin@skillswap.com',
    bio: 'System Administrator.',
    avatar: 'https://picsum.photos/seed/admin/200',
    skillsOffered: [],
    skillsWanted: [],
    points: 0,
    badges: [],
    rating: 5.0,
    reviewCount: 0,
    isVerified: true,
    role: 'admin',
    availability: [],
    joinedDate: '2023-01-01'
  }
];

export const StorageService = {
  getUsers: (): User[] => {
    const data = localStorage.getItem(USERS_KEY);
    if (!data) {
      localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(data);
  },
  
  getUserById: (id: string): User | undefined => {
    return StorageService.getUsers().find(u => u.id === id);
  },

  getUserByEmail: (email: string): User | undefined => {
    return StorageService.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  createUser: (name: string, email: string, avatar?: string): User => {
    const users = StorageService.getUsers();
    const newUser: User = {
      id: 'u' + Math.random().toString(36).substr(2, 9),
      name,
      email: email.toLowerCase(),
      bio: 'New explorer ready to share and learn.',
      avatar: avatar || `https://picsum.photos/seed/${email}/200`,
      skillsOffered: [],
      skillsWanted: [],
      points: 100, // Starting bonus
      badges: ['Newcomer'],
      rating: 5.0,
      reviewCount: 0,
      isVerified: false,
      role: 'user',
      availability: [],
      joinedDate: new Date().toISOString()
    };
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return newUser;
  },

  updateUser: (user: User) => {
    const users = StorageService.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      users[idx] = user;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      // Refresh auth state if current user
      const auth = JSON.parse(localStorage.getItem('skillswap_auth') || '{}');
      if (auth.user && auth.user.id === user.id) {
        auth.user = user;
        localStorage.setItem('skillswap_auth', JSON.stringify(auth));
      }
    }
  },

  getBookings: (): Booking[] => {
    const data = localStorage.getItem(BOOKINGS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveBooking: (booking: Booking) => {
    const bookings = StorageService.getBookings();
    bookings.push(booking);
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
  },

  updateBooking: (booking: Booking) => {
    const bookings = StorageService.getBookings();
    const idx = bookings.findIndex(b => b.id === booking.id);
    if (idx !== -1) {
      const oldStatus = bookings[idx].status;
      bookings[idx] = booking;
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));

      // Business Logic: Completion rewards
      if (oldStatus !== 'completed' && booking.status === 'completed') {
        StorageService.handleSessionCompletion(booking);
      }
    }
  },

  handleSessionCompletion: (booking: Booking) => {
    const teacher = StorageService.getUserById(booking.teacherId);
    const learner = StorageService.getUserById(booking.learnerId);

    if (teacher) {
      teacher.points += 50;
      // Badge check: 3 lessons taught = "Master Mentor"
      const lessonsTaught = StorageService.getBookings().filter(b => b.teacherId === teacher.id && b.status === 'completed').length;
      if (lessonsTaught >= 3 && !teacher.badges.includes('Expert')) {
        teacher.badges.push('Expert');
      }
      StorageService.updateUser(teacher);
    }

    if (learner) {
      learner.points += 10; // Smaller reward for learning
      StorageService.updateUser(learner);
    }
  },

  getMessages: (): Message[] => {
    const data = localStorage.getItem(MESSAGES_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveMessage: (msg: Message) => {
    const msgs = StorageService.getMessages();
    msgs.push(msg);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(msgs));
  },

  markAsRead: (senderId: string, receiverId: string) => {
    const msgs = StorageService.getMessages();
    let updated = false;
    const newMsgs = msgs.map(m => {
      if (m.senderId === senderId && m.receiverId === receiverId && !m.isRead) {
        updated = true;
        return { ...m, isRead: true };
      }
      return m;
    });
    if (updated) {
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(newMsgs));
    }
  },

  getUnreadCount: (userId: string): number => {
    return StorageService.getMessages().filter(m => m.receiverId === userId && !m.isRead).length;
  },

  getReviews: (): Review[] => {
    const data = localStorage.getItem(REVIEWS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveReview: (review: Review) => {
    const reviews = StorageService.getReviews();
    reviews.push(review);
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  }
};
