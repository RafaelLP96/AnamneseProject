import 'dotenv/config';
import express        from 'express';
import path           from 'path';
import { fileURLToPath } from 'url';

import rotaAuth        from './routes/auth.js';
import rotaProntuarios from './routes/prontuarios.js';
import { autenticar }  from './routes/middleware/auth.js';

const app = express();

const __nomeArquivo = fileURLToPath(import.meta.url);
const __dirname     = path.dirname(__nomeArquivo);

app.disable('x-powered-by');
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/auth',        rotaAuth);
app.use('/prontuarios', autenticar, rotaProntuarios);

const porta = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';

app.listen(porta, host, () => console.log(`Servidor online em http://${host}:${porta}`));