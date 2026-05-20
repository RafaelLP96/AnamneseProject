import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient()
const rota = express.Router()

rota.post("/",async(req,res)=> {
    
    try {
        const user = req.body
        const prontuario = await prisma.prontuario.create({
            data: {
            nome_social: user.nome_social,
            identidade_genero: user.identidade_genero,
            data_consulta: new Date(user.data_consulta),
            data_proxima_consulta: new Date (user.data_proxima_consulta)
            }
        })
        res.status(201).json(prontuario)
    } catch (error) {
        console.log(error)
        res.status(500).json({
            erro: "Erro ao salvar prontuario"
        })
    }
})

export default rota