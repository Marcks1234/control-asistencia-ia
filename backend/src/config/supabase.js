import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || (process.env.SUPABASE ? `https://${process.env.SUPABASE}.supabase.co` : '');
const supabaseKey = process.env.SUPABASE_KEY;

// Validación temprana para compañeros de equipo que aún no configuren su .env
if (!supabaseUrl || !supabaseKey) {
  console.warn('\n[SUPABASE CONFIG WARNING] ---------------------------------------------');
  console.warn(' Faltan las variables SUPABASE_URL o SUPABASE_KEY en backend/.env.');
  console.warn(' Por favor copia "backend/.env.example" a "backend/.env" y añade tus credenciales.');
  console.warn('--------------------------------------------------------------------------\n');
}

// Inicialización del cliente de Supabase
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder-key', {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Función para probar la conexión con el proyecto Supabase
 * Útil para endpoints de healthcheck y validación del backend
 */
export async function checkSupabaseConnection() {
  if (!supabaseUrl || !supabaseKey || supabaseKey === 'placeholder-key') {
    return {
      ok: false,
      error: 'Variables SUPABASE_URL o SUPABASE_KEY no configuradas en backend/.env',
    };
  }

  try {
    // Probamos conectividad realizando una consulta de autenticación básica
    const { error } = await supabase.auth.getSession();
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true, message: 'Conexión a Supabase establecida correctamente' };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export default supabase;
