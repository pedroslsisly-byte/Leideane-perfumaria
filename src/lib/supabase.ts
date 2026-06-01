import { createClient } from '@supabase/supabase-js';

const clientEnv = (import.meta as any).env || {};
const supabaseUrl = clientEnv.VITE_SUPABASE_URL || '';
const supabaseAnonKey = clientEnv.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// SQL statements to bootstrap the Supabase database
export const SUPABASE_SQL_SETUP = `-- 1. Criar a tabela de Configurações (Settings)
create table if not exists public.lady_settings (
  id text primary key default 'default',
  store_name text not null,
  whatsapp_number text not null,
  custom_greeting text not null,
  cms_password text,
  profile_image_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS (Row Level Security) na tabela de configurações
alter table public.lady_settings enable row level security;

-- Criar políticas públicas de leitura e escrita (Para facilitar no início)
create policy "Acesso de leitura público para configurações" 
on public.lady_settings for select 
using (true);

create policy "Permitir qualquer atualização para configurações" 
on public.lady_settings for all 
using (true)
with check (true);


-- 2. Criar a tabela de Produtos
create table if not exists public.lady_products (
  id text primary key,
  catalog text not null,
  title text not null,
  description text not null,
  badge text not null,
  index_num text not null,
  price text not null,
  notes text not null,
  image_url text not null,
  whatsapp_link text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS na tabela de produtos
alter table public.lady_products enable row level security;

-- Criar políticas de leitura e manipulação pública para produtos
create policy "Acesso de leitura público para produtos" 
on public.lady_products for select 
using (true);

create policy "Permitir qualquer alteração para produtos" 
on public.lady_products for all 
using (true)
with check (true);
`;
