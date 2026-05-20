import express        from 'express';
import path           from 'path';
import { fileURLToPath } from 'url';

import rotaAuth        from './routes/auth.js';
import rotaProntuarios from './routes/prontuarios.js';
import { autenticar }  from './routes/middleware/auth.js';

const app = express();

const __nomeArquivo = fileURLToPath(import.meta.url);
const __dirname     = path.dirname(__nomeArquivo);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/auth',        rotaAuth);
app.use('/prontuarios', autenticar, rotaProntuarios);

app.listen(3000, () => console.log('Servidor online na porta 3000'));