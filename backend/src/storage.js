import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey || supabaseUrl.includes('troque-este-valor')) {
  throw new Error('Configuração do Supabase ausente ou inválida');
}

const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    realtime: {
      transport: ws
    }
  }
);

export default supabase;