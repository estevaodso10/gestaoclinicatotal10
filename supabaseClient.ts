import { createClient } from '@supabase/supabase-js';

// Função auxiliar para ler variáveis de ambiente em diferentes setups (Vite, CRA, ou Browser puro)
const getEnv = (key: string) => {
    try {
        // Tenta Vite (import.meta.env)
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env) {
             // @ts-ignore
            return import.meta.env[key] || import.meta.env[`VITE_${key}`];
        }
    } catch { /* ignore */ }

    try {
        // Tenta Node/CRA (process.env)
        if (typeof process !== 'undefined' && process.env) {
            return process.env[key];
        }
    } catch { /* ignore */ }

    return undefined;
};

// Credenciais do Projeto Supabase
const supabaseUrl = getEnv('REACT_APP_SUPABASE_URL') || 'https://bsnexijjjrlcdmrudubv.supabase.co';
const supabaseKey = getEnv('REACT_APP_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzbmV4aWpqanJsY2RtcnVkdWJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1OTcyMDYsImV4cCI6MjA4MTE3MzIwNn0.6l28QiCymkxxKUHUerRmB8fxoaQTTufHESfC2XZpgt4';

export const supabase = createClient(supabaseUrl, supabaseKey);