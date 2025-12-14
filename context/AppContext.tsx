import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Room, Allocation, Loan, Payment, Patient, InventoryItem, ClinicEvent, Role, EventRegistration } from '../types';
import { supabase } from '../supabaseClient';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  rooms: Room[];
  allocations: Allocation[];
  inventory: InventoryItem[];
  loans: Loan[];
  payments: Payment[];
  patients: Patient[];
  events: ClinicEvent[];
  registrations: EventRegistration[];
  
  systemName: string;
  systemLogo: string | null;
  updateSystemSettings: (name: string, logo: string | null) => void;

  login: (email: string) => Promise<void>; // Updated signature is handled inside auth flow actually
  logout: () => void;
  
  // Admin Actions
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (user: User) => void;
  toggleUserStatus: (id: string) => void;
  
  addRoom: (room: Omit<Room, 'id'>) => void;
  updateRoom: (room: Room) => void;
  deleteRoom: (id: string) => void;
  
  addAllocation: (allocation: Omit<Allocation, 'id'>) => Promise<{ success: boolean; message: string }>;
  deleteAllocation: (id: string) => void;
  
  addPayment: (payment: Omit<Payment, 'id'>) => void;
  updatePayment: (payment: Payment) => void;
  deletePayment: (id: string) => void;
  confirmPayment: (id: string, date?: string) => void;
  
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'availableQuantity'>) => void;
  updateInventoryItem: (id: string, name: string, totalQuantity: number) => void;
  deleteInventoryItem: (id: string) => void;

  addEvent: (event: Omit<ClinicEvent, 'id'>) => void;
  updateEvent: (event: ClinicEvent) => void;
  deleteEvent: (id: string) => void;
  addRegistration: (reg: Omit<EventRegistration, 'id'>) => void;
  updateRegistration: (reg: EventRegistration) => void;

  requestLoan: (userId: string, itemId: string) => boolean;
  returnLoan: (loanId: string) => void;
  
  addPatient: (patient: Omit<Patient, 'id'>) => void;
  updatePatient: (patient: Patient) => void;
  deletePatient: (id: string) => void;

  refreshData: () => void; // Helper to force refresh
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
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
  
  const [systemName, setSystemName] = useState('ClinicFlow');
  const [systemLogo, setSystemLogo] = useState<string | null>(null);

  // --- DATA FETCHING ---
  const fetchData = async () => {
      // Parallel fetching for performance
      const [
          usersRes, roomsRes, allocRes, invRes, loansRes, 
          payRes, patRes, eventsRes, regRes
      ] = await Promise.all([
          supabase.from('users').select('*'),
          supabase.from('rooms').select('*'),
          supabase.from('allocations').select('*'),
          supabase.from('inventory').select('*'),
          supabase.from('loans').select('*'),
          supabase.from('payments').select('*'),
          supabase.from('patients').select('*'),
          supabase.from('events').select('*'),
          supabase.from('registrations').select('*')
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
  };

  useEffect(() => {
    fetchData();

    // Check Active Session
    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
            // Fetch user profile from public.users
            const { data } = await supabase.from('users').select('*').eq('email', session.user.email).single();
            if (data) setCurrentUser(data);
        }
    };
    checkSession();

    // Listen for Auth Changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user?.email) {
             const { data } = await supabase.from('users').select('*').eq('email', session.user.email).single();
             if (data) setCurrentUser(data);
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

  // --- AUTH ACTIONS ---
  // Note: The actual login logic is in the Login page using supabase.auth.signInWithPassword
  // This placeholder is kept for compatibility if needed, but not used directly for auth logic anymore
  const login = async (email: string) => { 
      // Handled by Supabase Auth UI
  };

  const logout = async () => {
      await supabase.auth.signOut();
      setCurrentUser(null);
  };

  // --- CRUD WRAPPERS ---
  
  const updateSystemSettings = (name: string, logo: string | null) => {
      setSystemName(name);
      if (logo !== undefined) setSystemLogo(logo);
      // In a real app, you'd save this to a 'settings' table
  };

  // USERS
  const addUser = async (userData: Omit<User, 'id'>) => {
      await supabase.from('users').insert(userData);
      refreshData();
  };
  const updateUser = async (user: User) => {
      await supabase.from('users').update(user).eq('id', user.id);
      refreshData();
  };
  const toggleUserStatus = async (id: string) => {
      const user = users.find(u => u.id === id);
      if(!user) return;
      await supabase.from('users').update({ isActive: !user.isActive }).eq('id', id);
      refreshData();
      // Note: Backend triggers are better for cascading deletes/returns on deactivation
  };

  // ROOMS
  const addRoom = async (data: Omit<Room, 'id'>) => {
      await supabase.from('rooms').insert(data);
      refreshData();
  };
  const updateRoom = async (data: Room) => {
      await supabase.from('rooms').update(data).eq('id', data.id);
      refreshData();
  };
  const deleteRoom = async (id: string) => {
      await supabase.from('rooms').delete().eq('id', id);
      refreshData();
  };

  // ALLOCATIONS
  const addAllocation = async (data: Omit<Allocation, 'id'>) => {
      // Conflict Check
      const conflict = allocations.find(a => 
        a.roomId === data.roomId && a.day === data.day && a.shift === data.shift
      );
      if (conflict) return { success: false, message: 'Conflito de horário detectado.' };

      const { error } = await supabase.from('allocations').insert(data);
      if(error) return { success: false, message: error.message };
      refreshData();
      return { success: true, message: 'Alocado com sucesso' };
  };
  const deleteAllocation = async (id: string) => {
      await supabase.from('allocations').delete().eq('id', id);
      refreshData();
  };

  // INVENTORY
  const addInventoryItem = async (data: Omit<InventoryItem, 'id' | 'availableQuantity'>) => {
      await supabase.from('inventory').insert({ ...data, availableQuantity: data.totalQuantity });
      refreshData();
  };
  const updateInventoryItem = async (id: string, name: string, totalQuantity: number) => {
      // Simple update, logic for availability calculation should ideally be server-side or carefully managed
      // Recalculating availability based on current loans
      const currentLoansCount = loans.filter(l => l.itemName === name && l.status === 'ACTIVE').reduce((acc, l) => acc + l.quantity, 0);
      const newAvailable = totalQuantity - currentLoansCount;
      
      await supabase.from('inventory').update({ 
          name, totalQuantity, availableQuantity: newAvailable >= 0 ? newAvailable : 0 
      }).eq('id', id);
      refreshData();
  };
  const deleteInventoryItem = async (id: string) => {
      await supabase.from('inventory').delete().eq('id', id);
      refreshData();
  };

  // LOANS
  const requestLoan = async (userId: string, itemId: string) => { // Returns promise in real impl, boolean here for compatibility
      const item = inventory.find(i => i.id === itemId);
      if(!item || item.availableQuantity <= 0) return false;

      // 1. Update Inventory
      await supabase.from('inventory').update({ availableQuantity: item.availableQuantity - 1 }).eq('id', itemId);
      
      // 2. Create Loan
      await supabase.from('loans').insert({
          userId, itemName: item.name, quantity: 1, requestDate: new Date().toISOString(), status: 'ACTIVE'
      });
      refreshData();
      return true;
  };

  const returnLoan = async (loanId: string) => {
      const loan = loans.find(l => l.id === loanId);
      if(!loan) return;
      
      const item = inventory.find(i => i.name === loan.itemName);

      // 1. Update Loan
      await supabase.from('loans').update({ status: 'RETURNED', returnDate: new Date().toISOString() }).eq('id', loanId);

      // 2. Return Stock
      if(item) {
          await supabase.from('inventory').update({ availableQuantity: item.availableQuantity + loan.quantity }).eq('id', item.id);
      }
      refreshData();
  };

  // PAYMENTS
  const addPayment = async (data: Omit<Payment, 'id'>) => {
      await supabase.from('payments').insert({ ...data, status: 'PENDING' });
      refreshData();
  };
  const updatePayment = async (data: Payment) => {
      await supabase.from('payments').update(data).eq('id', data.id);
      refreshData();
  };
  const deletePayment = async (id: string) => {
      await supabase.from('payments').delete().eq('id', id);
      refreshData();
  };
  const confirmPayment = async (id: string, date?: string) => {
      await supabase.from('payments').update({ 
          status: 'PAID', paidDate: date || new Date().toISOString().split('T')[0] 
      }).eq('id', id);
      refreshData();
  };

  // EVENTS & REGISTRATIONS
  const addEvent = async (data: Omit<ClinicEvent, 'id'>) => {
      await supabase.from('events').insert(data);
      refreshData();
  };
  const updateEvent = async (data: ClinicEvent) => {
      await supabase.from('events').update(data).eq('id', data.id);
      refreshData();
  };
  const deleteEvent = async (id: string) => {
      await supabase.from('events').delete().eq('id', id);
      refreshData();
  };
  const addRegistration = async (data: Omit<EventRegistration, 'id'>) => {
      await supabase.from('registrations').insert(data);
      refreshData();
  };
  const updateRegistration = async (data: EventRegistration) => {
      await supabase.from('registrations').update(data).eq('id', data.id);
      refreshData();
  };

  // PATIENTS
  const addPatient = async (data: Omit<Patient, 'id'>) => {
      await supabase.from('patients').insert(data);
      refreshData();
  };
  const updatePatient = async (data: Patient) => {
      await supabase.from('patients').update(data).eq('id', data.id);
      refreshData();
  };
  const deletePatient = async (id: string) => {
      await supabase.from('patients').delete().eq('id', id);
      refreshData();
  };

  return (
    <AppContext.Provider value={{
      currentUser, users, rooms, allocations, inventory, loans, payments, patients, events, registrations,
      systemName, systemLogo, updateSystemSettings,
      login, logout, addUser, updateUser, toggleUserStatus, addRoom, updateRoom, deleteRoom,
      addAllocation, deleteAllocation, addPayment, updatePayment, deletePayment, confirmPayment, 
      requestLoan, returnLoan, addInventoryItem, updateInventoryItem, deleteInventoryItem,
      addEvent, updateEvent, deleteEvent, addRegistration, updateRegistration,
      addPatient, updatePatient, deletePatient, refreshData
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