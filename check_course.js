
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zvfotmlfwglwysqbximn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2Zm90bWxmd2dsd3lzcWJ4aW1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NzA2MjEsImV4cCI6MjA4MTU0NjYyMX0.vUTtOAi8bXmDv5t-T0v7Nm1GLPdk1yozLZW-YLn8nG8';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    console.log('Checking for course: psicopedagogia');
    const { data, error } = await supabase.from('courses').select('*').eq('slug', 'psicopedagogia');
    
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Data found:', data);
    }
}

check();
