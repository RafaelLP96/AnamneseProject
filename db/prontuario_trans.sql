
-- PRONTUÁRIO ELETRÔNICO DE ENFERMAGEM — PESSOAS TRANS
-- Abordagem: tabela única com coluna JSONB


CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- TABELA PRINCIPAL

CREATE TABLE prontuarios (

    id                  UUID            DEFAULT gen_random_uuid() PRIMARY KEY,
    nome_social         TEXT            NOT NULL,
    identidade_genero   TEXT,
    data_consulta       DATE            NOT NULL,
    data_proxima_consulta DATE,
    profissional        TEXT            NOT NULL,
    criado_em           TIMESTAMPTZ     DEFAULT now(),
    atualizado_em       TIMESTAMPTZ     DEFAULT now(),

    -- Dados clínicos completos do formulário
    dados               JSONB           NOT NULL DEFAULT '{}'
);

-- Índices

CREATE INDEX idx_prontuarios_nome_social
    ON prontuarios (nome_social);


CREATE INDEX idx_prontuarios_data_consulta
    ON prontuarios (data_consulta);


CREATE INDEX idx_prontuarios_profissional
    ON prontuarios (profissional);


CREATE INDEX idx_prontuarios_dados_gin
    ON prontuarios USING GIN (dados);


CREATE OR REPLACE FUNCTION fn_atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prontuarios_atualizado_em
    BEFORE UPDATE ON prontuarios
    FOR EACH ROW
    EXECUTE FUNCTION fn_atualizar_timestamp();

