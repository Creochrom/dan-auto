import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(url, key);

const { data, error } = await supabase
  .from('_test_connection')
  .select('*')
  .limit(1);

if (error) {
  console.log('Supabase reached successfully');
  console.log(error.message);
} else {
  console.log('Connected OK:', data);
}