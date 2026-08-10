const express = require("express");
const bcrypt = require("bcrypt");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(express.json());

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// CADASTRO
app.post("/api/cadastro", async (req, res) => {
    try {
        const { nome, email, senha, tipo } = req.body;

        // Verifica se os campos foram enviados
        if (!nome || !email || !senha || !tipo) {
            return res.status(400).json({
                erro: "Preencha todos os campos."
            });
        }

        const emailNormalizado = email.toLowerCase().trim();

        // Verifica se o email já existe
        const { data: usuarioExistente, error: erroBusca } =
            await supabase
                .from("usuarios")
                .select("id")
                .eq("email", emailNormalizado)
                .maybeSingle();

        if (erroBusca) {
            console.error(erroBusca);

            return res.status(500).json({
                erro: "Erro ao verificar usuário."
            });
        }

        if (usuarioExistente) {
            return res.status(409).json({
                erro: "Este email já está cadastrado."
            });
        }

        // Gera o hash da senha
        const senhaHash = await bcrypt.hash(senha, 12);

        // Salva no banco
        const { data, error } = await supabase
            .from("usuarios")
            .insert({
                nome: nome,
                email: emailNormalizado,
                senha: senhaHash,
                tipo: tipo
            })
            .select("id, nome, email, tipo")
            .single();

        if (error) {
            console.error(error);

            return res.status(500).json({
                erro: "Erro ao cadastrar usuário."
            });
        }

        return res.status(201).json({
            mensagem: "Usuário cadastrado com sucesso.",
            usuario: data
        });

    } catch (erro) {
        console.error(erro);

        return res.status(500).json({
            erro: "Erro interno do servidor."
        });
    }
});