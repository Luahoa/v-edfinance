import { Role, type User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

/**
 * Mock users with various roles for testing.
 * Passwords are pre-hashed with bcrypt.
 * Password for all users: "Test@1234"
 */
export const mockUsers: Omit<User, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'user-student-001',
    email: 'student1@example.com',
    passwordHash: bcrypt.hashSync('Test@1234', 10),
    name: {
      vi: 'Nguyễn Văn An',
      en: 'An Nguyen',
      zh: '阮文安',
    },
    role: Role.STUDENT,
    points: 150,
    preferredLocale: 'vi',
    metadata: {
      onboardingCompleted: true,
      notificationsEnabled: true,
    },
  },
  {
    id: 'user-student-002',
    email: 'student2@example.com',
    passwordHash: bcrypt.hashSync('Test@1234', 10),
    name: {
      vi: 'Trần Thị Bình',
      en: 'Binh Tran',
      zh: '陈氏平',
    },
    role: Role.STUDENT,
    points: 320,
    preferredLocale: 'en',
    metadata: {
      onboardingCompleted: true,
      notificationsEnabled: false,
    },
  },
  {
    id: 'user-student-003',
    email: 'student3@example.com',
    passwordHash: bcrypt.hashSync('Test@1234', 10),
    name: {
      vi: 'Lê Minh Châu',
      en: 'Chau Le',
      zh: '黎明珠',
    },
    role: Role.STUDENT,
    points: 89,
    preferredLocale: 'zh',
    metadata: {
      onboardingCompleted: false,
      notificationsEnabled: true,
    },
  },
  {
    id: 'user-student-004',
    email: 'student4@example.com',
    passwordHash: bcrypt.hashSync('Test@1234', 10),
    name: {
      vi: 'Phạm Quốc Dũng',
      en: 'Dung Pham',
      zh: '范国勇',
    },
    role: Role.STUDENT,
    points: 560,
    preferredLocale: 'vi',
    metadata: {
      onboardingCompleted: true,
      notificationsEnabled: true,
    },
  },
  {
    id: 'user-student-005',
    email: 'student5@example.com',
    passwordHash: bcrypt.hashSync('Test@1234', 10),
    name: {
      vi: 'Hoàng Thị Lan',
      en: 'Lan Hoang',
      zh: '黄氏兰',
    },
    role: Role.STUDENT,
    points: 0,
    preferredLocale: 'en',
    metadata: {
      onboardingCompleted: false,
      notificationsEnabled: false,
    },
  },
  {
    id: 'user-teacher-001',
    email: 'teacher1@example.com',
    passwordHash: bcrypt.hashSync('Test@1234', 10),
    name: {
      vi: 'Giáo Viên Hùng',
      en: 'Hung Teacher',
      zh: '教师雄',
    },
    role: Role.TEACHER,
    points: 1200,
    preferredLocale: 'vi',
    metadata: {
      yearsOfExperience: 5,
      specialization: 'Personal Finance',
    },
  },
  {
    id: 'user-teacher-002',
    email: 'teacher2@example.com',
    passwordHash: bcrypt.hashSync('Test@1234', 10),
    name: {
      vi: 'Giáo Viên Mai',
      en: 'Mai Teacher',
      zh: '教师梅',
    },
    role: Role.TEACHER,
    points: 980,
    preferredLocale: 'en',
    metadata: {
      yearsOfExperience: 3,
      specialization: 'Investment Strategies',
    },
  },
  {
    id: 'user-admin-001',
    email: 'admin1@example.com',
    passwordHash: bcrypt.hashSync('Test@1234', 10),
    name: {
      vi: 'Quản Trị Viên Phong',
      en: 'Phong Admin',
      zh: '管理员丰',
    },
    role: Role.ADMIN,
    points: 5000,
    preferredLocale: 'vi',
    metadata: {
      department: 'System Administration',
      accessLevel: 'full',
    },
  },
  {
    id: 'user-admin-002',
    email: 'admin2@example.com',
    passwordHash: bcrypt.hashSync('Test@1234', 10),
    name: {
      vi: 'Quản Trị Viên Thảo',
      en: 'Thao Admin',
      zh: '管理员草',
    },
    role: Role.ADMIN,
    points: 4200,
    preferredLocale: 'en',
    metadata: {
      department: 'Content Management',
      accessLevel: 'content-only',
    },
  },
  {
    id: 'user-student-006',
    email: 'newbie@example.com',
    passwordHash: bcrypt.hashSync('Test@1234', 10),
    name: {
      vi: 'Người Dùng Mới',
      en: 'New User',
      zh: '新用户',
    },
    role: Role.STUDENT,
    points: 0,
    preferredLocale: 'vi',
    metadata: {
      onboardingCompleted: false,
      signupSource: 'organic',
    },
  },
];

/**
 * Get mock users by role.
 */
export function getUsersByRole(
  role: Role,
): Omit<User, 'createdAt' | 'updatedAt'>[] {
  return mockUsers.filter((user) => user.role === role);
}

/**
 * Get a mock user by ID.
 */
export function getUserById(
  id: string,
): Omit<User, 'createdAt' | 'updatedAt'> | undefined {
  return mockUsers.find((user) => user.id === id);
}

/**
 * Get a mock user by email.
 */
export function getUserByEmail(
  email: string,
): Omit<User, 'createdAt' | 'updatedAt'> | undefined {
  return mockUsers.find((user) => user.email === email);
}
