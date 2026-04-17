const express = require('express');
const db = require('./db');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

//Middlewares -Decirle que autorice las piliticas del dominio
app.use(cors(
    {
        origin:[
        'http://localhost:3000',
        'https://mutzu-amber.vercel.app/'
        ],
        credentials:true
    }
));

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hola Mundo');
});

//get: enviar informacion, post: recibir informacion, 
// put: actualizar informacion, delete: eliminar informacion

app.get('/api/tasks/', async (req, res) => {
    try {
        const [tasks] = await db.query ('SELECT * FROM tasks');
        res.json({ data: [] });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/task/:id',(req, res) => {});

app.post('/api/task/:id',(req, res) => {});

app.put('/api/task/:id',(req, res) => {});

app.delete('/api/task/:id',(req, res) => {});


//.get(/tasks/) consultar todas las tareas
//.get(/tasks/:id) consultar una tarea por id
//.post(/tasks/) crear una nueva tarea
//.put(/tasks/:id) actualizar una tarea por id
//.delete(/tasks/:id) eliminar una tarea por id

app.listen(PORT, () => {
    console.log('Servidor iniciado en el puerto ' + PORT);
});