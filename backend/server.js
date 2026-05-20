import express from 'express';
import rotaPublica from './routes/publica.js'
import path from 'path'
import { fileURLToPath } from 'url';

const app = express();

app.use(express.json())

const __nomeArquivo = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__nomeArquivo)

app.use(express.static(path.join(__dirname, 'public')))

app.use('/publica', rotaPublica)

app.listen(3000, () => console.log("Servidor online"))