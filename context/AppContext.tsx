import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { User, Room, Allocation, Loan, Payment, Patient, InventoryItem, ClinicEvent, Role, EventRegistration, Document, FinancialTransaction, FinancialCategory, DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from '../types';
import { supabase } from '../supabaseClient';
import { createClient } from '@supabase/supabase-js';

interface AppContextType {
  currentUser: User | null;
  isLoading: boolean;
  users: User[];
  rooms: Room[];
  allocations: Allocation[];
  inventory: InventoryItem[];
  loans: Loan[];
  payments: Payment[];
  patients: Patient[];
  events: ClinicEvent[];
  registrations: EventRegistration[];
  documents: Document[];
  financialTransactions: FinancialTransaction[];
  financialCategories: FinancialCategory[];
  
  // Notifications
  unreadDocumentsCount: number;
  markDocumentsAsRead: () => void;
  unreadPaymentsCount: number;
  markPaymentsAsRead: () => void;

  systemName: string;
  systemLogo: string | null;
  updateSystemSettings: (name: string, logo: string | null) => Promise<void>;

  login: (email: string) => Promise<void>; 
  logout: () => void;
  
  // Admin Actions
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (user: User) => Promise<void>; 
  toggleUserStatus: (id: string) => void;
  
  addRoom: (room: Omit<Room, 'id'>) => void;
  updateRoom: (room: Room) => void;
  deleteRoom: (id: string) => void;
  
  addAllocation: (allocation: Omit<Allocation, 'id'>) => Promise<{ success: boolean; message: string }>;
  deleteAllocation: (id: string) => void;
  
  addPayment: (payment: Omit<Payment, 'id' | 'status' | 'createdAt'>) => Promise<void>;
  updatePayment: (payment: Payment) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  confirmPayment: (id: string, date?: string) => Promise<void>;
  
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'availableQuantity'>) => void;
  updateInventoryItem: (id: string, name: string, totalQuantity: number) => void;
  deleteInventoryItem: (id: string) => void;

  addEvent: (event: Omit<ClinicEvent, 'id'>) => void;
  updateEvent: (event: ClinicEvent) => void;
  deleteEvent: (id: string) => void;
  addRegistration: (reg: Omit<EventRegistration, 'id'>) => void;
  updateRegistration: (reg: EventRegistration) => void;

  requestLoan: (userId: string, itemId: string) => Promise<boolean>;
  returnLoan: (loanId: string) => void;
  
  addPatient: (patient: Omit<Patient, 'id'>) => void;
  updatePatient: (patient: Patient) => void;
  deletePatient: (id: string) => void;

  addDocument: (doc: Omit<Document, 'id' | 'createdAt'>) => void;
  updateDocument: (doc: Document) => void;
  deleteDocument: (id: string) => void;

  addFinancialTransaction: (transaction: Omit<FinancialTransaction, 'id' | 'createdAt'>) => void;
  updateFinancialTransaction: (transaction: FinancialTransaction) => void;
  deleteFinancialTransaction: (id: string) => void;

  addFinancialCategory: (category: Omit<FinancialCategory, 'id'>) => void;
  updateFinancialCategory: (category: FinancialCategory, oldName: string) => void;
  deleteFinancialCategory: (id: string, categoryName: string) => void;

  refreshData: () => void; 
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Credenciais hardcoded para criação de cliente temporário (atualizadas)
const SUPABASE_URL = 'https://bsnexijjjrlcdmrudubv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzbmV4aWpqanJsY2RtcnVkdWJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1OTcyMDYsImV4cCI6MjA4MTE3MzIwNn0.6l28QiCymkxxKUHUerRmB8fxoaQTTufHESfC2XZpgt4';

// Helper para gerar UUID compatível com navegadores antigos
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Data States
  const [users, setUsers] = useState<User[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [events, setEvents] = useState<ClinicEvent[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>([]);
  const [financialCategories, setFinancialCategories] = useState<FinancialCategory[]>([]);
  
  const [systemName, setSystemName] = useState('ClinicFlow');
  const [systemLogo, setSystemLogo] = useState<string | null>(null);

  // Notification State
  const [lastDocumentsVisit, setLastDocumentsVisit] = useState<string>(new Date(0).toISOString());
  const [lastPaymentsVisit, setLastPaymentsVisit] = useState<string>(new Date(0).toISOString());

  // --- DATA FETCHING ---
  const fetchData = async () => {
      // Parallel fetching for performance
      const [
          usersRes, roomsRes, allocRes, invRes, loansRes, 
          payRes, patRes, eventsRes, regRes, docRes, settingsRes, finRes, catRes
      ] = await Promise.all([
          supabase.from('users').select('*'),
          supabase.from('rooms').select('*'),
          supabase.from('allocations').select('*'),
          supabase.from('inventory').select('*'),
          supabase.from('loans').select('*'),
          supabase.from('payments').select('*'),
          supabase.from('patients').select('*'),
          supabase.from('events').select('*'),
          supabase.from('registrations').select('*'),
          supabase.from('documents').select('*'),
          supabase.from('system_settings').select('*').single(),
          supabase.from('financial_transactions').select('*'),
          supabase.from('financial_categories').select('*')
      ]);

      if(usersRes.data) setUsers(usersRes.data);
      if(roomsRes.data) setRooms(roomsRes.data);
      if(allocRes.data) setAllocations(allocRes.data);
      if(invRes.data) setInventory(invRes.data);
      if(loansRes.data) setLoans(loansRes.data);
      if(payRes.data) setPayments(payRes.data);
      if(patRes.data) setPatients(patRes.data);
      if(eventsRes.data) setEvents(eventsRes.data);
      if(regRes.data) setRegistrations(regRes.data);
      if(docRes.data) setDocuments(docRes.data);
      if(finRes.data) setFinancialTransactions(finRes.data);
      
      // Categories Logic: If empty, use defaults (and maybe seed DB in future)
      if(catRes.data && catRes.data.length > 0) {
          setFinancialCategories(catRes.data);
      } else {
          // If no categories in DB, simulate defaults in state to not break UI
          const defaultCats: FinancialCategory[] = [
             ...DEFAULT_INCOME_CATEGORIES.map((c, i) => ({ id: `inc-${i}`, name: c, type: 'INCOME' as const })),
             ...DEFAULT_EXPENSE_CATEGORIES.map((c, i) => ({ id: `exp-${i}`, name: c, type: 'EXPENSE' as const }))
          ];
          setFinancialCategories(defaultCats);
      }
      
      // Load System Settings
      if(settingsRes.data) {
          setSystemName(settingsRes.data.system_name || 'ClinicFlow');
          setSystemLogo(settingsRes.data.system_logo || null);
      }
  };

  useEffect(() => {
    const init = async () => {
        try {
            // Check Active Session
            const { data: { session } } = await supabase.auth.getSession();
            let userFound = false;

            if (session?.user?.email) {
                // Fetch user profile from public.users
                const { data } = await supabase.from('users').select('*').eq('email', session.user.email).single();
                if (data) {
                    setCurrentUser(data);
                    userFound = true;
                    // Load notification states
                    const storedDocVisit = localStorage.getItem(`lastDocumentsVisit_${data.id}`);
                    if (storedDocVisit) setLastDocumentsVisit(storedDocVisit);
                    
                    const storedPayVisit = localStorage.getItem(`lastPaymentsVisit_${data.id}`);
                    if (storedPayVisit) setLastPaymentsVisit(storedPayVisit);
                }
            }
            
            // Fetch initial data ONLY if user is authenticated
            if (userFound) {
                await fetchData();
            }
        } catch (error) {
            console.error('Error initializing app:', error);
        } finally {
            setIsLoading(false);
        }
    };
    
    init();

    // Listen for Auth Changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user?.email) {
             const { data } = await supabase.from('users').select('*').eq('email', session.user.email).single();
             if (data) {
                 setCurrentUser(data);
                 const storedDocVisit = localStorage.getItem(`lastDocumentsVisit_${data.id}`);
                 if (storedDocVisit) setLastDocumentsVisit(storedDocVisit);
                 
                 const storedPayVisit = localStorage.getItem(`lastPaymentsVisit_${data.id}`);
                 if (storedPayVisit) setLastPaymentsVisit(storedPayVisit);
             }
             fetchData();
        } else if (event === 'SIGNED_OUT') {
             setCurrentUser(null);
        }
    });

    return () => {
        authListener.subscription.unsubscribe();
    };
  }, []);

  const refreshData = () => fetchData();

  // --- NOTIFICATION LOGIC ---
  const unreadDocumentsCount = useMemo(() => {
      if (!currentUser || currentUser.role !== Role.PROFESSIONAL) return 0;
      
      const count = documents.filter(doc => {
          const isTarget = doc.targetUserId === null || doc.targetUserId === currentUser.id;
          const docDate = new Date(doc.createdAt);
          const visitDate = new Date(lastDocumentsVisit);
          
          const isNew = docDate.getTime() > visitDate.getTime();
          return isTarget && isNew;
      }).length;

      return count;
  }, [documents, currentUser, lastDocumentsVisit]);

  const markDocumentsAsRead = () => {
      if (!currentUser) return;
      const now = new Date().toISOString();
      setLastDocumentsVisit(now);
      localStorage.setItem(`lastDocumentsVisit_${currentUser.id}`, now);
  };

  const unreadPaymentsCount = useMemo(() => {
      if (!currentUser || currentUser.role !== Role.PROFESSIONAL) return 0;
      
      const count = payments.filter(pay => {
          // Check if payment targets this user
          const isTarget = pay.userId === currentUser.id;
          // Check if it's newer than the last visit
          // Fallback to dueDate if createdAt is missing for legacy data, 
          // but for new notifications relies on createdAt
          const payDate = pay.createdAt ? new Date(pay.createdAt) : new Date(0);
          const visitDate = new Date(lastPaymentsVisit);
          
          const isNew = payDate.getTime() > visitDate.getTime();
          return isTarget && isNew;
      }).length;

      return count;
  }, [payments, currentUser, lastPaymentsVisit]);

  const markPaymentsAsRead = () => {
      if (!currentUser) return;
      const now = new Date().toISOString();
      setLastPaymentsVisit(now);
      localStorage.setItem(`lastPaymentsVisit_${currentUser.id}`, now);
  };

  // --- AUTH ACTIONS ---
  const login = async (email: string) => { 
      // Handled by Supabase Auth UI
  };

  const logout = async () => {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error('Erro ao realizar logout:', error);
      } finally {
        setCurrentUser(null);
      }
  };

  // --- CRUD WRAPPERS ---
  
  const updateSystemSettings = async (name: string, logo: string | null) => {
      const payload: any = { id: 1, system_name: name };
      if (logo !== undefined) payload.system_logo = logo;

      const { error } = await supabase.from('system_settings').upsert(payload);
      
      if (error) {
          console.error('Erro ao salvar configurações:', error);
          alert('Erro ao salvar configurações do sistema.');
      } else {
          setSystemName(name);
          if (logo !== undefined) setSystemLogo(logo);
          refreshData();
      }
  };

  // USERS
  const addUser = async (userData: Omit<User, 'id'>) => {
      try {
        const tempClient = createClient(SUPABASE_URL, SUPABASE_KEY);
        const tempPassword = "Mudar123@" + Math.floor(Math.random() * 1000);

        const { data: authData, error: authError } = await tempClient.auth.signUp({
            email: userData.email,
            password: tempPassword,
        });

        if (authError) throw new Error(`Erro na Autenticação: ${authError.message}`);
        if (!authData.user) throw new Error("Usuário criado, mas ID não retornado.");

        const { error: dbError } = await supabase.from('users').insert({ 
            ...userData, 
            id: authData.user.id 
        });
        
        if (dbError) {
            if (dbError.code === '23505') { 
                await supabase.from('users').update(userData).eq('id', authData.user.id);
            } else {
                throw new Error(`Erro no Banco de Dados: ${dbError.message}`);
            }
        }
        
        alert(`Usuário criado com sucesso!\n\nSenha Temporária: ${tempPassword}\n\nPor favor, informe esta senha ao usuário.`);
        refreshData();

      } catch (err: any) {
          console.error('Erro ao adicionar usuário:', err);
          alert(`Falha no cadastro: ${err.message || err}`);
      }
  };

  const updateUser = async (user: User) => {
      const { error } = await supabase.from('users').update(user).eq('id', user.id);
      
      if (error) {
          console.error('Error updating user:', error);
          throw error;
      } else {
          if (currentUser && currentUser.id === user.id) {
              setCurrentUser({ ...currentUser, ...user });
          }
          await refreshData();
      }
  };

  const toggleUserStatus = async (id: string) => {
      const user = users.find(u => u.id === id);
      if(!user) return;
      const { error } = await supabase.from('users').update({ isActive: !user.isActive }).eq('id', id);
      if (error) {
          console.error('Error toggling user status:', error);
          alert(`Erro ao alterar status: ${error.message}`);
      } else {
          refreshData();
      }
  };

  // ROOMS
  const addRoom = async (data: Omit<Room, 'id'>) => {
      const newId = generateUUID();
      const { error } = await supabase.from('rooms').insert({ ...data, id: newId });
      if (error) {
          console.error('Error adding room:', error);
          alert(`Erro ao adicionar sala: ${error.message}`);
      } else {
          refreshData();
      }
  };
  const updateRoom = async (data: Room) => {
      const { error } = await supabase.from('rooms').update(data).eq('id', data.id);
      if (error) {
          console.error('Error updating room:', error);
          alert(`Erro ao atualizar sala: ${error.message}`);
      } else {
          refreshData();
      }
  };
  const deleteRoom = async (id: string) => {
      await supabase.from('allocations').delete().eq('roomId', id);
      const { error } = await supabase.from('rooms').delete().eq('id', id);
      if (error) {
          console.error('Error deleting room:', error);
          alert(`Erro ao excluir sala: ${error.message}`);
      } else {
          refreshData();
      }
  };

  // ALLOCATIONS
  const addAllocation = async (data: Omit<Allocation, 'id'>) => {
      const conflict = allocations.find(a => 
        a.roomId === data.roomId && a.day === data.day && a.shift === data.shift
      );
      if (conflict) return { success: false, message: 'Conflito de horário detectado.' };
      
      const newId = generateUUID();
      const { error } = await supabase.from('allocations').insert({ ...data, id: newId });
      if(error) return { success: false, message: error.message };
      refreshData();
      return { success: true, message: 'Alocado com sucesso' };
  };
  const deleteAllocation = async (id: string) => {
      const { error } = await supabase.from('allocations').delete().eq('id', id);
      if (error) {
        console.error('Error deleting allocation:', error);
        alert(`Erro ao desalocar: ${error.message}`);
      } else {
        refreshData();
      }
  };

  // INVENTORY
  const addInventoryItem = async (data: Omit<InventoryItem, 'id' | 'availableQuantity'>) => {
      const newId = generateUUID();
      const { error } = await supabase.from('inventory').insert({ ...data, id: newId, availableQuantity: data.totalQuantity });
      if (error) {
          console.error('Error adding inventory item:', error);
          alert(`Erro ao adicionar item: ${error.message}`);
      } else {
          refreshData();
      }
  };
  const updateInventoryItem = async (id: string, name: string, totalQuantity: number) => {
      const currentLoansCount = loans.filter(l => l.itemName === name && l.status === 'ACTIVE').reduce((acc, l) => acc + l.quantity, 0);
      const newAvailable = totalQuantity - currentLoansCount;
      
      const { error } = await supabase.from('inventory').update({ 
          name, totalQuantity, availableQuantity: newAvailable >= 0 ? newAvailable : 0 
      }).eq('id', id);

      if (error) {
          console.error('Error updating inventory item:', error);
          alert(`Erro ao atualizar item: ${error.message}`);
      } else {
          refreshData();
      }
  };
  const deleteInventoryItem = async (id: string) => {
      const { error } = await supabase.from('inventory').delete().eq('id', id);
      if (error) {
          console.error('Error deleting inventory item:', error);
          alert(`Erro ao excluir item: ${error.message}`);
      } else {
          refreshData();
      }
  };

  // LOANS
  const requestLoan = async (userId: string, itemId: string) => {
      const item = inventory.find(i => i.id === itemId);
      if(!item || item.availableQuantity <= 0) return false;

      const { error: invError } = await supabase.from('inventory').update({ availableQuantity: item.availableQuantity - 1 }).eq('id', itemId);
      
      if (invError) {
          alert('Erro ao atualizar estoque.');
          return false;
      }
      
      const newId = generateUUID();
      const { error } = await supabase.from('loans').insert({
          id: newId, userId, itemName: item.name, quantity: 1, requestDate: new Date().toISOString(), status: 'ACTIVE'
      });
      
      if (error) {
          alert(`Erro ao criar empréstimo: ${error.message}`);
          refreshData();
          return false;
      }
      
      refreshData();
      return true;
  };

  const returnLoan = async (loanId: string) => {
      const loan = loans.find(l => l.id === loanId);
      if(!loan) return;
      const item = inventory.find(i => i.name === loan.itemName);

      const { error: loanError } = await supabase.from('loans').update({ status: 'RETURNED', returnDate: new Date().toISOString() }).eq('id', loanId);

      if (loanError) {
          alert(`Erro ao devolver: ${loanError.message}`);
          return;
      }

      if(item) {
          await supabase.from('inventory').update({ availableQuantity: item.availableQuantity + loan.quantity }).eq('id', item.id);
      }
      refreshData();
  };

  // PAYMENTS
  const addPayment = async (data: Omit<Payment, 'id' | 'status' | 'createdAt'>) => {
      const newId = generateUUID();
      const { error } = await supabase.from('payments').insert({ 
          ...data, 
          id: newId, 
          status: 'PENDING',
          createdAt: new Date().toISOString()
      });
      if (error) {
          console.error('Error adding payment:', error);
          throw error;
      } else {
          await refreshData();
      }
  };

  const updatePayment = async (data: Payment) => {
      const { error } = await supabase.from('payments').update(data).eq('id', data.id);
      if (error) {
          console.error('Error updating payment:', error);
          throw error;
      } else {
          await refreshData();
      }
  };

  const deletePayment = async (id: string) => {
      const { error } = await supabase.from('payments').delete().eq('id', id);
      if (error) {
          console.error('Error deleting payment:', error);
          throw error;
      } else {
          await refreshData();
      }
  };

  const confirmPayment = async (id: string, date?: string) => {
      const { error } = await supabase.from('payments').update({ 
          status: 'PAID', paidDate: date || new Date().toISOString().split('T')[0] 
      }).eq('id', id);
      
      if (error) {
          console.error('Error confirming payment:', error);
          throw error;
      } else {
          await refreshData();
      }
  };

  // EVENTS & REGISTRATIONS
  const addEvent = async (data: Omit<ClinicEvent, 'id'>) => {
      const newId = generateUUID();
      const { error } = await supabase.from('events').insert({ ...data, id: newId });
      if (error) {
          console.error('Error adding event:', error);
          alert(`Erro ao adicionar evento: ${error.message}`);
      } else {
          refreshData();
      }
  };
  const updateEvent = async (data: ClinicEvent) => {
      const { error } = await supabase.from('events').update(data).eq('id', data.id);
      if (error) {
          console.error('Error updating event:', error);
          alert(`Erro ao atualizar evento: ${error.message}`);
      } else {
          refreshData();
      }
  };
  const deleteEvent = async (id: string) => {
      await supabase.from('registrations').delete().eq('eventId', id);
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) {
          console.error('Error deleting event:', error);
          alert(`Erro ao excluir evento: ${error.message}`);
      } else {
          refreshData();
      }
  };
  const addRegistration = async (data: Omit<EventRegistration, 'id'>) => {
      const newId = generateUUID();
      const { error } = await supabase.from('registrations').insert({ ...data, id: newId });
      if (error) {
          console.error('Error adding registration:', error);
          alert(`Erro ao realizar inscrição: ${error.message}`);
      } else {
          refreshData();
      }
  };
  const updateRegistration = async (data: EventRegistration) => {
      const { error } = await supabase.from('registrations').update(data).eq('id', data.id);
      if (error) {
          console.error('Error updating registration:', error);
          alert(`Erro ao atualizar inscrição: ${error.message}`);
      } else {
          refreshData();
      }
  };

  // PATIENTS
  const addPatient = async (data: Omit<Patient, 'id'>) => {
      const newId = generateUUID();
      const { error } = await supabase.from('patients').insert({ ...data, id: newId });
      if (error) {
          console.error('Error adding patient:', error);
          alert(`Erro ao adicionar paciente: ${error.message}`);
      } else {
          refreshData();
      }
  };
  const updatePatient = async (data: Patient) => {
      const { error } = await supabase.from('patients').update(data).eq('id', data.id);
      if (error) {
          console.error('Error updating patient:', error);
          alert(`Erro ao atualizar paciente: ${error.message}`);
      } else {
          refreshData();
      }
  };
  const deletePatient = async (id: string) => {
      const { error } = await supabase.from('patients').delete().eq('id', id);
      if (error) {
          console.error('Error deleting patient:', error);
          alert(`Erro ao excluir paciente: ${error.message}`);
      } else {
          refreshData();
      }
  };

  // DOCUMENTS
  const addDocument = async (data: Omit<Document, 'id' | 'createdAt'>) => {
      const newId = generateUUID();
      const { error } = await supabase.from('documents').insert({ 
          ...data, 
          id: newId,
          createdAt: new Date().toISOString()
      });
      if (error) {
          console.error('Error adding document:', error);
          alert(`Erro ao adicionar documento: ${error.message}`);
      } else {
          refreshData();
      }
  };

  const updateDocument = async (data: Document) => {
      const { error } = await supabase.from('documents').update(data).eq('id', data.id);
      if (error) {
          console.error('Error updating document:', error);
          alert(`Erro ao atualizar documento: ${error.message}`);
      } else {
          refreshData();
      }
  };

  const deleteDocument = async (id: string) => {
      const { error } = await supabase.from('documents').delete().eq('id', id);
      if (error) {
          console.error('Error deleting document:', error);
          alert(`Erro ao excluir documento: ${error.message}`);
      } else {
          refreshData();
      }
  };

  // FINANCIAL TRANSACTIONS
  const addFinancialTransaction = async (data: Omit<FinancialTransaction, 'id' | 'createdAt'>) => {
      const newId = generateUUID();
      const { error } = await supabase.from('financial_transactions').insert({ 
          ...data, 
          id: newId,
          createdAt: new Date().toISOString()
      });
      if (error) {
          console.error('Error adding transaction:', error);
          alert(`Erro ao adicionar transação: ${error.message}`);
      } else {
          refreshData();
      }
  };

  const updateFinancialTransaction = async (data: FinancialTransaction) => {
      const { error } = await supabase.from('financial_transactions').update(data).eq('id', data.id);
      if (error) {
          console.error('Error updating transaction:', error);
          alert(`Erro ao atualizar transação: ${error.message}`);
      } else {
          refreshData();
      }
  };

  const deleteFinancialTransaction = async (id: string) => {
      const { error } = await supabase.from('financial_transactions').delete().eq('id', id);
      if (error) {
          console.error('Error deleting transaction:', error);
          alert(`Erro ao excluir transação: ${error.message}`);
      } else {
          refreshData();
      }
  };

  // FINANCIAL CATEGORIES
  const addFinancialCategory = async (data: Omit<FinancialCategory, 'id'>) => {
      const newId = generateUUID();
      const { error } = await supabase.from('financial_categories').insert({ ...data, id: newId });
      if (error) {
          console.error('Error adding category:', error);
          alert(`Erro ao adicionar categoria: ${error.message}`);
      } else {
          refreshData();
      }
  };

  const updateFinancialCategory = async (data: FinancialCategory, oldName: string) => {
      // 1. Update Category
      const { error: catError } = await supabase.from('financial_categories').update({ name: data.name, type: data.type }).eq('id', data.id);
      
      if (catError) {
          console.error('Error updating category:', catError);
          alert(`Erro ao atualizar categoria: ${catError.message}`);
          return;
      }

      // 2. Cascade Update Transactions (Only if name changed)
      if (oldName !== data.name) {
          const { error: transError } = await supabase.from('financial_transactions')
              .update({ category: data.name })
              .eq('category', oldName)
              .eq('type', data.type); // Ensure type match just in case
          
          if (transError) {
              console.error('Error updating linked transactions:', transError);
              alert('A categoria foi atualizada, mas houve um erro ao atualizar as transações vinculadas.');
          }
      }

      refreshData();
  };

  const deleteFinancialCategory = async (id: string, categoryName: string) => {
      // 1. Update Transactions to "Pendente"
      const { error: transError } = await supabase.from('financial_transactions')
          .update({ category: 'Pendente' })
          .eq('category', categoryName);

      if (transError) {
          console.error('Error updating linked transactions:', transError);
          alert(`Erro ao desvincular transações: ${transError.message}`);
          return;
      }

      // 2. Delete Category
      const { error: catError } = await supabase.from('financial_categories').delete().eq('id', id);
      
      if (catError) {
          console.error('Error deleting category:', catError);
          alert(`Erro ao excluir categoria: ${catError.message}`);
      } else {
          refreshData();
      }
  };

  return (
    <AppContext.Provider value={{
      currentUser, isLoading, users, rooms, allocations, inventory, loans, payments, patients, events, registrations, documents, financialTransactions, financialCategories,
      unreadDocumentsCount, markDocumentsAsRead, unreadPaymentsCount, markPaymentsAsRead,
      systemName, systemLogo, updateSystemSettings,
      login, logout, addUser, updateUser, toggleUserStatus, addRoom, updateRoom, deleteRoom,
      addAllocation, deleteAllocation, addPayment, updatePayment, deletePayment, confirmPayment, 
      requestLoan, returnLoan, addInventoryItem, updateInventoryItem, deleteInventoryItem,
      addEvent, updateEvent, deleteEvent, addRegistration, updateRegistration,
      addPatient, updatePatient, deletePatient, addDocument, updateDocument, deleteDocument, 
      addFinancialTransaction, updateFinancialTransaction, deleteFinancialTransaction, 
      addFinancialCategory, updateFinancialCategory, deleteFinancialCategory, refreshData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};