import express from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient()
const rota = express.Router()
rota.post("/",async(req,res)=> {
    const user = req.body
    await prisma.user.create({
       data :{
        nome_social: user.nome_social,
        identidade_genero: user.identidade_genero,
        data_consulta: user.data_consulta,
        data_proxima_consulta: user.data_proxima_consulta,
        profissional:user.profissional
       }

    })
    res.status(201).json(user)
})

export default rota