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
        'https://mutzu-amber.vercel.app',
        
        ],
        credentials:true
    }
));

app.use(express.json());

testConnection();

app.get('/', (req, res) => {
    res.send('Hola Mundo');
});

//get: enviar informacion, post: recibir informacion, 
// put: actualizar informacion, delete: eliminar informacion

app.get(['/api/tasks', '/api/tasks/'], async (req, res) => {
    try {
        const tasks = await pool.query ('SELECT * FROM tasks ORDER BY created_at DESC');
        res.json({ data: tasks });
    } catch (error) {
        console.error('Error al obtener tareas:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [tasks] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
        
        if (tasks.length === 0) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }
        
        res.json({ data: tasks[0] });
    } catch (error) {
        console.error('Error al obtener tarea:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/tasks/:id', async (req, res) => {
    try {
        const { title, description, priority, status } = req.body;
        
        // Validación
        if (!title || title.trim() === '') {
            return res.status(400).json({ error: 'El título es obligatorio' });
        }
        
        const query = `
            INSERT INTO tasks (title, description, priority, status) 
            VALUES (?, ?, ?, ?)
        `;
        const values = [title, description || '', priority || 'medium', status || 'pending'];
        
        const [result] = await pool.query(query, values);
        
        // Obtener la tarea recién creada
        const [newTask] = await pool.query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
        
        res.status(201).json({ data: newTask[0] });
    } catch (error) {
        console.error('Error al crear tarea:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.put('/api/tasks/:id',(req, res) => {
    try {
        const { id } = req.params;
        const { title, description, priority, status } = req.body;
        
        // Verificar si la tarea existe
        const [existingTask] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
        if (existingTask.length === 0) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }
        
        const query = `
            UPDATE tasks 
            SET title = ?, description = ?, priority = ?, status = ?
            WHERE id = ?
        `;
        const values = [title, description, priority, status, id];
        
        await pool.query(query, values);
        
        // Obtener la tarea actualizada
        const [updatedTask] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
        
        res.json({ data: updatedTask[0] });
    } catch (error) {
        console.error('Error al actualizar tarea:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.delete('/api/tasks/:id',(req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar si la tarea existe
        const [existingTask] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
        if (existingTask.length === 0) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }
        
        await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
        
        res.json({ data: { id: parseInt(id), deleted: true } });
    } catch (error) {
        console.error('Error al eliminar tarea:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({ error: `Ruta no encontrada: ${req.originalUrl}` });
});
//.get(/tasks/) consultar todas las tareas
//.get(/tasks/:id) consultar una tarea por id
//.post(/tasks/) crear una nueva tarea
//.put(/tasks/:id) actualizar una tarea por id
//.delete(/tasks/:id) eliminar una tarea por id

app.listen(PORT, () => {
    console.log('Servidor iniciado en el puerto ' + PORT);
});