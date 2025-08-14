

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."access_type" AS ENUM (
    'entrada',
    'saida'
);


ALTER TYPE "public"."access_type" OWNER TO "postgres";


CREATE TYPE "public"."config_type" AS ENUM (
    'string',
    'number',
    'boolean',
    'json'
);


ALTER TYPE "public"."config_type" OWNER TO "postgres";


CREATE TYPE "public"."notification_type" AS ENUM (
    'entrada_visitante',
    'cadastro_concluido',
    'acesso_expirado'
);


ALTER TYPE "public"."notification_type" OWNER TO "postgres";


CREATE TYPE "public"."user_profile" AS ENUM (
    'morador',
    'admin'
);


ALTER TYPE "public"."user_profile" OWNER TO "postgres";


CREATE TYPE "public"."visitor_status" AS ENUM (
    'aguardando',
    'liberado',
    'expirado',
    'cancelado',
    'ativo'
);


ALTER TYPE "public"."visitor_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."estatisticas_sistema"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_usuarios', (SELECT COUNT(*) FROM usuarios WHERE ativo = true),
        'total_moradores', (SELECT COUNT(*) FROM usuarios WHERE perfil = 'morador' AND ativo = true),
        'total_admins', (SELECT COUNT(*) FROM usuarios WHERE perfil = 'admin' AND ativo = true),
        'visitantes_ativos', (SELECT COUNT(*) FROM visitantes WHERE status IN ('ativo', 'liberado')),
        'visitantes_aguardando', (SELECT COUNT(*) FROM visitantes WHERE status = 'aguardando'),
        'visitantes_expirados', (SELECT COUNT(*) FROM visitantes WHERE status = 'expirado'),
        'acessos_hoje', (SELECT COUNT(*) FROM logs_acesso WHERE DATE(data_hora) = CURRENT_DATE),
        'acessos_semana', (SELECT COUNT(*) FROM logs_acesso WHERE data_hora >= DATE_TRUNC('week', NOW())),
        'links_ativos', (SELECT COUNT(*) FROM links_convite WHERE NOT expirado AND NOT usado),
        'notificacoes_nao_lidas', (SELECT COUNT(*) FROM notificacoes WHERE NOT lida)
    ) INTO result;
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."estatisticas_sistema"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."gerar_token_convite"() RETURNS character varying
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    novo_token VARCHAR(64);
    token_existe BOOLEAN;
BEGIN
    LOOP
        -- Gerar token hexadecimal de 32 bytes (64 caracteres)
        novo_token := encode(gen_random_bytes(32), 'hex');
        
        -- Verificar se já existe
        SELECT EXISTS(SELECT 1 FROM links_convite WHERE token = novo_token) INTO token_existe;
        
        -- Se não existe, retornar o token
        IF NOT token_existe THEN
            RETURN novo_token;
        END IF;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."gerar_token_convite"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."limpar_dados_expirados"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    dias_retencao INTEGER;
    registros_removidos INTEGER := 0;
BEGIN
    -- Buscar configuração de retenção LGPD
    SELECT valor::INTEGER INTO dias_retencao 
    FROM configuracoes 
    WHERE chave = 'lgpd_retencao_dias';
    
    IF dias_retencao IS NULL THEN
        dias_retencao := 365; -- Padrão 1 ano
    END IF;
    
    -- Remover visitantes expirados há mais tempo que o período de retenção
    DELETE FROM visitantes 
    WHERE status = 'expirado' 
    AND validade_fim < NOW() - INTERVAL '1 day' * dias_retencao;
    
    GET DIAGNOSTICS registros_removidos = ROW_COUNT;
    
    -- Remover logs antigos
    DELETE FROM logs_acesso 
    WHERE created_at < NOW() - INTERVAL '1 day' * 90; -- 90 dias de logs
    
    -- Remover notificações antigas
    DELETE FROM notificacoes 
    WHERE created_at < NOW() - INTERVAL '1 day' * 30; -- 30 dias de notificações
    
    -- Remover links de convite expirados antigos
    DELETE FROM links_convite 
    WHERE expires_at < NOW() - INTERVAL '1 day' * 7; -- 7 dias após expiração
    
    RETURN registros_removidos;
END;
$$;


ALTER FUNCTION "public"."limpar_dados_expirados"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verificar_visitantes_expirados"() RETURNS TABLE("id" "uuid", "nome" character varying, "cpf" character varying, "morador_id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT v.id, v.nome, v.cpf, v.morador_id
    FROM visitantes v
    WHERE v.status IN ('ativo', 'liberado')
    AND v.validade_fim < NOW();
END;
$$;


ALTER FUNCTION "public"."verificar_visitantes_expirados"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."configuracoes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "chave" character varying(100) NOT NULL,
    "valor" "text" NOT NULL,
    "tipo" "public"."config_type" DEFAULT 'string'::"public"."config_type",
    "descricao" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."configuracoes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."links_convite" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "token" character varying(64) NOT NULL,
    "morador_id" "uuid" NOT NULL,
    "nome_visitante" character varying(255) NOT NULL,
    "expirado" boolean DEFAULT false,
    "usado" boolean DEFAULT false,
    "validade_dias" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone NOT NULL
);


ALTER TABLE "public"."links_convite" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."logs_acesso" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "visitante_id" "uuid" NOT NULL,
    "morador_id" "uuid" NOT NULL,
    "tipo" "public"."access_type" NOT NULL,
    "data_hora" timestamp with time zone DEFAULT "now"(),
    "local" character varying(100) DEFAULT 'Portaria Principal'::character varying,
    "sucesso" boolean DEFAULT true,
    "observacoes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."logs_acesso" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notificacoes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "usuario_id" "uuid" NOT NULL,
    "titulo" character varying(255) NOT NULL,
    "mensagem" "text" NOT NULL,
    "tipo" "public"."notification_type" NOT NULL,
    "lida" boolean DEFAULT false,
    "dados_extras" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notificacoes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."usuarios" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "email" character varying(255) NOT NULL,
    "senha_hash" character varying(255) NOT NULL,
    "nome" character varying(255) NOT NULL,
    "perfil" "public"."user_profile" DEFAULT 'morador'::"public"."user_profile" NOT NULL,
    "unidade" character varying(50),
    "ativo" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."usuarios" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."visitantes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "nome" character varying(255) NOT NULL,
    "cpf" character varying(14) NOT NULL,
    "selfie_url" "text",
    "documento_url" "text",
    "status" "public"."visitor_status" DEFAULT 'aguardando'::"public"."visitor_status",
    "unidade" character varying(50) NOT NULL,
    "morador_id" "uuid" NOT NULL,
    "link_convite_id" "uuid",
    "validade_inicio" timestamp with time zone NOT NULL,
    "validade_fim" timestamp with time zone NOT NULL,
    "hikvision_user_id" character varying(50),
    "consentimento_lgpd" boolean DEFAULT false,
    "consentimento_data" timestamp with time zone,
    "observacoes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."visitantes" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_relatorio_acessos" AS
 SELECT "la"."id",
    "la"."tipo",
    "la"."data_hora",
    "la"."local",
    "la"."sucesso",
    "la"."observacoes",
    "v"."nome" AS "visitante_nome",
    "v"."cpf" AS "visitante_cpf",
    "v"."unidade",
    "u"."nome" AS "morador_nome",
    "u"."email" AS "morador_email"
   FROM (("public"."logs_acesso" "la"
     JOIN "public"."visitantes" "v" ON (("la"."visitante_id" = "v"."id")))
     JOIN "public"."usuarios" "u" ON (("la"."morador_id" = "u"."id")))
  ORDER BY "la"."data_hora" DESC;


ALTER VIEW "public"."vw_relatorio_acessos" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_visitantes_detalhado" AS
 SELECT "v"."id",
    "v"."nome",
    "v"."cpf",
    "v"."selfie_url",
    "v"."documento_url",
    "v"."status",
    "v"."unidade",
    "v"."validade_inicio",
    "v"."validade_fim",
    "v"."hikvision_user_id",
    "v"."consentimento_lgpd",
    "v"."observacoes",
    "v"."created_at",
    "v"."updated_at",
    "u"."nome" AS "morador_nome",
    "u"."email" AS "morador_email",
        CASE
            WHEN ("v"."validade_fim" < "now"()) THEN true
            ELSE false
        END AS "expirado"
   FROM ("public"."visitantes" "v"
     JOIN "public"."usuarios" "u" ON (("v"."morador_id" = "u"."id")));


ALTER VIEW "public"."vw_visitantes_detalhado" OWNER TO "postgres";


ALTER TABLE ONLY "public"."configuracoes"
    ADD CONSTRAINT "configuracoes_chave_key" UNIQUE ("chave");



ALTER TABLE ONLY "public"."configuracoes"
    ADD CONSTRAINT "configuracoes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."links_convite"
    ADD CONSTRAINT "links_convite_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."links_convite"
    ADD CONSTRAINT "links_convite_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."logs_acesso"
    ADD CONSTRAINT "logs_acesso_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notificacoes"
    ADD CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."usuarios"
    ADD CONSTRAINT "usuarios_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."usuarios"
    ADD CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."visitantes"
    ADD CONSTRAINT "visitantes_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_configuracoes_chave" ON "public"."configuracoes" USING "btree" ("chave");



CREATE INDEX "idx_links_convite_expires" ON "public"."links_convite" USING "btree" ("expires_at");



CREATE INDEX "idx_links_convite_morador" ON "public"."links_convite" USING "btree" ("morador_id");



CREATE INDEX "idx_links_convite_token" ON "public"."links_convite" USING "btree" ("token");



CREATE INDEX "idx_logs_acesso_data" ON "public"."logs_acesso" USING "btree" ("data_hora");



CREATE INDEX "idx_logs_acesso_tipo" ON "public"."logs_acesso" USING "btree" ("tipo");



CREATE INDEX "idx_logs_acesso_visitante" ON "public"."logs_acesso" USING "btree" ("visitante_id");



CREATE INDEX "idx_notificacoes_created" ON "public"."notificacoes" USING "btree" ("created_at");



CREATE INDEX "idx_notificacoes_lida" ON "public"."notificacoes" USING "btree" ("lida");



CREATE INDEX "idx_notificacoes_usuario" ON "public"."notificacoes" USING "btree" ("usuario_id");



CREATE INDEX "idx_usuarios_email" ON "public"."usuarios" USING "btree" ("email");



CREATE INDEX "idx_usuarios_perfil" ON "public"."usuarios" USING "btree" ("perfil");



CREATE INDEX "idx_usuarios_unidade" ON "public"."usuarios" USING "btree" ("unidade");



CREATE INDEX "idx_visitantes_cpf" ON "public"."visitantes" USING "btree" ("cpf");



CREATE INDEX "idx_visitantes_hikvision" ON "public"."visitantes" USING "btree" ("hikvision_user_id");



CREATE INDEX "idx_visitantes_morador" ON "public"."visitantes" USING "btree" ("morador_id");



CREATE INDEX "idx_visitantes_status" ON "public"."visitantes" USING "btree" ("status");



CREATE INDEX "idx_visitantes_unidade" ON "public"."visitantes" USING "btree" ("unidade");



CREATE INDEX "idx_visitantes_validade" ON "public"."visitantes" USING "btree" ("validade_fim");



CREATE OR REPLACE TRIGGER "update_configuracoes_updated_at" BEFORE UPDATE ON "public"."configuracoes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_usuarios_updated_at" BEFORE UPDATE ON "public"."usuarios" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_visitantes_updated_at" BEFORE UPDATE ON "public"."visitantes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."links_convite"
    ADD CONSTRAINT "links_convite_morador_id_fkey" FOREIGN KEY ("morador_id") REFERENCES "public"."usuarios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."logs_acesso"
    ADD CONSTRAINT "logs_acesso_morador_id_fkey" FOREIGN KEY ("morador_id") REFERENCES "public"."usuarios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."logs_acesso"
    ADD CONSTRAINT "logs_acesso_visitante_id_fkey" FOREIGN KEY ("visitante_id") REFERENCES "public"."visitantes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notificacoes"
    ADD CONSTRAINT "notificacoes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."visitantes"
    ADD CONSTRAINT "visitantes_link_convite_id_fkey" FOREIGN KEY ("link_convite_id") REFERENCES "public"."links_convite"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."visitantes"
    ADD CONSTRAINT "visitantes_morador_id_fkey" FOREIGN KEY ("morador_id") REFERENCES "public"."usuarios"("id") ON DELETE CASCADE;



ALTER TABLE "public"."configuracoes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "configuracoes_admin_only" ON "public"."configuracoes" USING ((EXISTS ( SELECT 1
   FROM "public"."usuarios" "u"
  WHERE ((("u"."id")::"text" = ("auth"."uid"())::"text") AND ("u"."perfil" = 'admin'::"public"."user_profile")))));



ALTER TABLE "public"."links_convite" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "links_convite_delete_own" ON "public"."links_convite" FOR DELETE USING (((("morador_id")::"text" = ("auth"."uid"())::"text") OR (EXISTS ( SELECT 1
   FROM "public"."usuarios" "u"
  WHERE ((("u"."id")::"text" = ("auth"."uid"())::"text") AND ("u"."perfil" = 'admin'::"public"."user_profile"))))));



CREATE POLICY "links_convite_insert_own" ON "public"."links_convite" FOR INSERT WITH CHECK ((("morador_id")::"text" = ("auth"."uid"())::"text"));



CREATE POLICY "links_convite_select_own" ON "public"."links_convite" FOR SELECT USING (((("morador_id")::"text" = ("auth"."uid"())::"text") OR (EXISTS ( SELECT 1
   FROM "public"."usuarios" "u"
  WHERE ((("u"."id")::"text" = ("auth"."uid"())::"text") AND ("u"."perfil" = 'admin'::"public"."user_profile"))))));



CREATE POLICY "links_convite_update_own" ON "public"."links_convite" FOR UPDATE USING (((("morador_id")::"text" = ("auth"."uid"())::"text") OR (EXISTS ( SELECT 1
   FROM "public"."usuarios" "u"
  WHERE ((("u"."id")::"text" = ("auth"."uid"())::"text") AND ("u"."perfil" = 'admin'::"public"."user_profile"))))));



ALTER TABLE "public"."logs_acesso" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "logs_acesso_delete_admin" ON "public"."logs_acesso" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."usuarios" "u"
  WHERE ((("u"."id")::"text" = ("auth"."uid"())::"text") AND ("u"."perfil" = 'admin'::"public"."user_profile")))));



CREATE POLICY "logs_acesso_insert_system" ON "public"."logs_acesso" FOR INSERT WITH CHECK (true);



CREATE POLICY "logs_acesso_select_policy" ON "public"."logs_acesso" FOR SELECT USING (((("morador_id")::"text" = ("auth"."uid"())::"text") OR (EXISTS ( SELECT 1
   FROM "public"."usuarios" "u"
  WHERE ((("u"."id")::"text" = ("auth"."uid"())::"text") AND ("u"."perfil" = 'admin'::"public"."user_profile"))))));



ALTER TABLE "public"."notificacoes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notificacoes_delete_own" ON "public"."notificacoes" FOR DELETE USING (((("usuario_id")::"text" = ("auth"."uid"())::"text") OR (EXISTS ( SELECT 1
   FROM "public"."usuarios" "u"
  WHERE ((("u"."id")::"text" = ("auth"."uid"())::"text") AND ("u"."perfil" = 'admin'::"public"."user_profile"))))));



CREATE POLICY "notificacoes_insert_system" ON "public"."notificacoes" FOR INSERT WITH CHECK (true);



CREATE POLICY "notificacoes_select_own" ON "public"."notificacoes" FOR SELECT USING (((("usuario_id")::"text" = ("auth"."uid"())::"text") OR (EXISTS ( SELECT 1
   FROM "public"."usuarios" "u"
  WHERE ((("u"."id")::"text" = ("auth"."uid"())::"text") AND ("u"."perfil" = 'admin'::"public"."user_profile"))))));



CREATE POLICY "notificacoes_update_own" ON "public"."notificacoes" FOR UPDATE USING ((("usuario_id")::"text" = ("auth"."uid"())::"text")) WITH CHECK ((("usuario_id")::"text" = ("auth"."uid"())::"text"));



ALTER TABLE "public"."usuarios" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "usuarios_delete_admin" ON "public"."usuarios" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."usuarios" "u"
  WHERE ((("u"."id")::"text" = ("auth"."uid"())::"text") AND ("u"."perfil" = 'admin'::"public"."user_profile")))));



CREATE POLICY "usuarios_insert_admin" ON "public"."usuarios" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."usuarios" "u"
  WHERE ((("u"."id")::"text" = ("auth"."uid"())::"text") AND ("u"."perfil" = 'admin'::"public"."user_profile")))));



CREATE POLICY "usuarios_select_own" ON "public"."usuarios" FOR SELECT USING (((("auth"."uid"())::"text" = ("id")::"text") OR (EXISTS ( SELECT 1
   FROM "public"."usuarios" "u"
  WHERE ((("u"."id")::"text" = ("auth"."uid"())::"text") AND ("u"."perfil" = 'admin'::"public"."user_profile"))))));



CREATE POLICY "usuarios_update_own" ON "public"."usuarios" FOR UPDATE USING (((("auth"."uid"())::"text" = ("id")::"text") OR (EXISTS ( SELECT 1
   FROM "public"."usuarios" "u"
  WHERE ((("u"."id")::"text" = ("auth"."uid"())::"text") AND ("u"."perfil" = 'admin'::"public"."user_profile"))))));



ALTER TABLE "public"."visitantes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "visitantes_delete_admin" ON "public"."visitantes" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."usuarios" "u"
  WHERE ((("u"."id")::"text" = ("auth"."uid"())::"text") AND ("u"."perfil" = 'admin'::"public"."user_profile")))));



CREATE POLICY "visitantes_insert_policy" ON "public"."visitantes" FOR INSERT WITH CHECK (((("morador_id")::"text" = ("auth"."uid"())::"text") OR (EXISTS ( SELECT 1
   FROM "public"."usuarios" "u"
  WHERE ((("u"."id")::"text" = ("auth"."uid"())::"text") AND ("u"."perfil" = 'admin'::"public"."user_profile"))))));



CREATE POLICY "visitantes_select_policy" ON "public"."visitantes" FOR SELECT USING (((("morador_id")::"text" = ("auth"."uid"())::"text") OR (EXISTS ( SELECT 1
   FROM "public"."usuarios" "u"
  WHERE ((("u"."id")::"text" = ("auth"."uid"())::"text") AND ("u"."perfil" = 'admin'::"public"."user_profile")))) OR (EXISTS ( SELECT 1
   FROM "public"."usuarios" "u"
  WHERE ((("u"."id")::"text" = ("auth"."uid"())::"text") AND (("u"."unidade")::"text" = ("visitantes"."unidade")::"text") AND ("u"."perfil" = 'morador'::"public"."user_profile"))))));



CREATE POLICY "visitantes_update_policy" ON "public"."visitantes" FOR UPDATE USING (((("morador_id")::"text" = ("auth"."uid"())::"text") OR (EXISTS ( SELECT 1
   FROM "public"."usuarios" "u"
  WHERE ((("u"."id")::"text" = ("auth"."uid"())::"text") AND ("u"."perfil" = 'admin'::"public"."user_profile"))))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."estatisticas_sistema"() TO "anon";
GRANT ALL ON FUNCTION "public"."estatisticas_sistema"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."estatisticas_sistema"() TO "service_role";



GRANT ALL ON FUNCTION "public"."gerar_token_convite"() TO "anon";
GRANT ALL ON FUNCTION "public"."gerar_token_convite"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."gerar_token_convite"() TO "service_role";



GRANT ALL ON FUNCTION "public"."limpar_dados_expirados"() TO "anon";
GRANT ALL ON FUNCTION "public"."limpar_dados_expirados"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."limpar_dados_expirados"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."verificar_visitantes_expirados"() TO "anon";
GRANT ALL ON FUNCTION "public"."verificar_visitantes_expirados"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."verificar_visitantes_expirados"() TO "service_role";


















GRANT ALL ON TABLE "public"."configuracoes" TO "anon";
GRANT ALL ON TABLE "public"."configuracoes" TO "authenticated";
GRANT ALL ON TABLE "public"."configuracoes" TO "service_role";



GRANT ALL ON TABLE "public"."links_convite" TO "anon";
GRANT ALL ON TABLE "public"."links_convite" TO "authenticated";
GRANT ALL ON TABLE "public"."links_convite" TO "service_role";



GRANT ALL ON TABLE "public"."logs_acesso" TO "anon";
GRANT ALL ON TABLE "public"."logs_acesso" TO "authenticated";
GRANT ALL ON TABLE "public"."logs_acesso" TO "service_role";



GRANT ALL ON TABLE "public"."notificacoes" TO "anon";
GRANT ALL ON TABLE "public"."notificacoes" TO "authenticated";
GRANT ALL ON TABLE "public"."notificacoes" TO "service_role";



GRANT ALL ON TABLE "public"."usuarios" TO "anon";
GRANT ALL ON TABLE "public"."usuarios" TO "authenticated";
GRANT ALL ON TABLE "public"."usuarios" TO "service_role";



GRANT ALL ON TABLE "public"."visitantes" TO "anon";
GRANT ALL ON TABLE "public"."visitantes" TO "authenticated";
GRANT ALL ON TABLE "public"."visitantes" TO "service_role";



GRANT ALL ON TABLE "public"."vw_relatorio_acessos" TO "anon";
GRANT ALL ON TABLE "public"."vw_relatorio_acessos" TO "authenticated";
GRANT ALL ON TABLE "public"."vw_relatorio_acessos" TO "service_role";



GRANT ALL ON TABLE "public"."vw_visitantes_detalhado" TO "anon";
GRANT ALL ON TABLE "public"."vw_visitantes_detalhado" TO "authenticated";
GRANT ALL ON TABLE "public"."vw_visitantes_detalhado" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
