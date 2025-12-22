
export enum Role {
  ADMIN = 'ADMIN',
  PROFESSIONAL = 'PROFESSIONAL',
}

export enum Shift {
  MORNING = 'Manhã (08h-12h)',
  AFTERNOON = 'Tarde (13h-17h)',
  EVENING = 'Noite (18h-22h)',
}

export enum DayOfWeek {
  MONDAY = 'Segunda-feira',
  TUESDAY = 'Terça-feira',
  WEDNESDAY = 'Quarta-feira',
  THURSDAY = 'Quinta-feira',
  FRIDAY = 'Sexta-feira',
  SATURDAY = 'Sábado',
}

export enum EventModality {
  PRESENTIAL = 'PRESENTIAL',
  ONLINE = 'ONLINE',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  address?: string;
  phone?: string;
  specialty?: string; // Only for professionals
  photoUrl?: string; // Base64 string for profile picture
}

export interface Room {
  id: string;
  name: string;
  description: string;
}

export interface Allocation {
  id: string;
  userId: string;
  roomId: string;
  day: DayOfWeek;
  shift: Shift;
}

export interface Loan {
  id: string;
  userId: string;
  itemName: string;
  quantity: number;
  requestDate: string;
  returnDate?: string; // New field for history
  status: 'ACTIVE' | 'RETURNED';
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'PENDING' | 'PAID';
  createdAt: string; // Added for notifications
}

export interface Patient {
  id: string;
  professionalId: string;
  name: string;
  email: string;
  phone: string;
  parentName?: string;
  parentContact?: string;
  // Simplified scheduling for the patient relative to an existing allocation
  allocationId?: string; // The specific slot (Room/Day/Shift) this patient is assigned to
}

export interface InventoryItem {
  id: string;
  name: string;
  totalQuantity: number;
  availableQuantity: number;
}

export interface ClinicEvent {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  modality: EventModality;
  location?: string;
  link?: string;
  speaker: string;
  speakerBio: string;
  summary: string;
  spots?: number; // Optional: If undefined/null, unlimited spots
  requiresRegistration: boolean;
  registrationDeadlineDate?: string; // YYYY-MM-DD
  registrationDeadlineTime?: string; // HH:MM
}

export interface EventRegistration {
  id: string;
  eventId: string;
  participantName: string;
  participantEmail: string;
  registrationDate: string;
  status: 'CONFIRMED' | 'REJECTED';
  attended?: boolean; // Indicates if the participant showed up
}

export interface Document {
  id: string;
  title: string;
  linkUrl: string;
  targetUserId: string | null; // null = All Professionals, string = Specific User ID
  createdAt: string;
}

// --- NOVOS TIPOS FINANCEIROS ---

export type TransactionType = 'INCOME' | 'EXPENSE';

// Categorias padrão para inicialização (Fallback)
export const DEFAULT_INCOME_CATEGORIES = [
  'Consultas', 'Procedimentos', 'Aluguel de Sala', 'Venda de Produtos', 'Outros'
];
export const DEFAULT_EXPENSE_CATEGORIES = [
  'Aluguel do Imóvel', 'Energia Elétrica', 'Água e Esgoto', 'Internet/Telefone', 
  'Limpeza', 'Manutenção Predial', 'Salários/Colaboradores', 'Impostos', 'Marketing', 'Materiais de Escritório', 'Outros'
];

export interface FinancialCategory {
  id: string;
  name: string;
  type: TransactionType;
}

export interface FinancialTransaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string; // Armazena o nome da categoria para simplificação neste modelo NoSQL-like
  date: string; // YYYY-MM-DD
  createdAt: string;
}
