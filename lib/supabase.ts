-- 0. Segurança: usar search_path explícito nos blocos onde necessário
SET search_path = public, pg_catalog;

-- 1. Tabela profiles (cria se não existir)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  name TEXT,
  plan TEXT DEFAULT 'free' NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE public.profiles IS 'Armazena informações de perfil para usuários.';

-- 1.1 Adiciona FK em id -> auth.users(id) se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.constraint_schema = kcu.constraint_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = 'profiles'
      AND kcu.column_name = 'id'
  ) THEN
    BEGIN
      ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_user_fk FOREIGN KEY (id)
        REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN undefined_table OR foreign_key_violation THEN
      -- se a tabela auth.users não existir no momento, falha silenciosa para evitar parar a migração.
      RAISE NOTICE 'Não foi possível criar FK profiles->auth.users (tabela auth.users pode não existir ainda).';
    END;
  END IF;
END
$$;

-- 2. Habilita RLS em profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Policies para profiles (cria somente se não existirem)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'profiles_select_own'
      AND schemaname = 'public'
      AND tablename = 'profiles'
  ) THEN
    CREATE POLICY profiles_select_own
      ON public.profiles FOR SELECT
      TO authenticated
      USING ((SELECT auth.uid()) = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'profiles_update_own'
      AND schemaname = 'public'
      AND tablename = 'profiles'
  ) THEN
    CREATE POLICY profiles_update_own
      ON public.profiles FOR UPDATE
      TO authenticated
      USING ((SELECT auth.uid()) = id)
      WITH CHECK ((SELECT auth.uid()) = id);
  END IF;
END
$$;

-- 4. Função para criar perfil automaticamente (create or replace é idempotente)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Evita inserir duplicado caso já exista perfil para o usuário
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    INSERT INTO public.profiles (id, name)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', NULL)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- 5. Trigger on_auth_user_created (cria apenas se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE t.tgname = 'on_auth_user_created' AND n.nspname = 'public'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END
$$;

-- 6. Tabela analyses (cria se não existir)
CREATE TABLE IF NOT EXISTS public.analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE public.analyses IS 'Armazena o histórico de análises de gráficos para cada usuário.';

-- 6.1 Adiciona FK analyses.user_id -> auth.users(id) se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.constraint_schema = kcu.constraint_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = 'analyses'
      AND kcu.column_name = 'user_id'
  ) THEN
    BEGIN
      ALTER TABLE public.analyses
        ADD CONSTRAINT analyses_user_fk FOREIGN KEY (user_id)
        REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN undefined_table OR foreign_key_violation THEN
      RAISE NOTICE 'Não foi possível criar FK analyses->auth.users (tabela auth.users pode não existir ainda).';
    END;
  END IF;
END
$$;

-- 7. Habilita RLS em analyses
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- 8. Policies para analyses (cria somente se não existirem)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'analyses_select_own'
      AND schemaname = 'public'
      AND tablename = 'analyses'
  ) THEN
    CREATE POLICY analyses_select_own
      ON public.analyses FOR SELECT
      TO authenticated
      USING ((SELECT auth.uid()) = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'analyses_insert_own'
      AND schemaname = 'public'
      AND tablename = 'analyses'
  ) THEN
    CREATE POLICY analyses_insert_own
      ON public.analyses FOR INSERT
      TO authenticated
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'analyses_delete_own'
      AND schemaname = 'public'
      AND tablename = 'analyses'
  ) THEN
    CREATE POLICY analyses_delete_own
      ON public.analyses FOR DELETE
      TO authenticated
      USING ((SELECT auth.uid()) = user_id);
  END IF;
END
$$;