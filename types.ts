// --- Quiz-related Types ---
export interface HistoryItem {
  question: QuestionData;
  result: ResultData | null;
}

export interface QuestionData {
  id: string;
  subject: Subject;
  mode: QuizMode;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty?: MathsDifficulty;
}

export interface ResultData {
  questionId: string;
  selectedOptionIndex: number;
  isCorrect: boolean;
  correctOptionIndex: number;
  explanation: string;
}

export type Subject = 'English' | 'GK' | 'Maths' | 'Vocab Booster';
export type QuizMode = 'quiz' | 'pyq';
export type Theme = 'slate' | 'rose' | 'sky';
export type Language = 'english' | 'hindi';
export type MathsDifficulty = 'easy' | 'moderate' | 'hard';


// --- App Structure & Auth Types ---

export interface User {
  username: string;
  passwordHash: string;
  subscription?: {
    planId: string;
    expiresAt: number; // timestamp
  };
  isFreeUser?: boolean;
  paymentStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  sessionToken?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  durationDays: number; // e.g., 30 for a month
}

export interface PaymentRequest {
  id: string;
  username: string;
  planId: string;
  planName: string;
  amount: number;
  transactionId: string; // UTR
  screenshot: string; // Base64 image string
  timestamp: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  isSubscribed: boolean;
  currentUser: User | null;
  users: User[];
  paymentRequests: PaymentRequest[];
}

export interface AdminState {
  isAdmin: boolean;
  plans: SubscriptionPlan[];
}

export type AppScreen = 'auth' | 'subscribe' | 'quiz' | 'admin';