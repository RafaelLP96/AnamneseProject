const autenticar = require('./middleware/auth');

app.use('/auth', require('./routes/auth'));

// rotas protegidas
app.use('/prontuarios', autenticar, require('./routes/prontuarios'));