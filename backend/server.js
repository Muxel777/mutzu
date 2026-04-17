const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const { initDatabase, getAllTasks, getTaskById, createTask, updateTask, deleteTask } = require('./db');

//Middlewares -Decirle que autorice las piliticas del dominio
app.use(cors(
    {
        origin:[
        'http://localhost:3000',
        'http://localhost:5500',
        'https://mutzu-amber.vercel.app',
        /\.railway\.app$/
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

app.get(['/api/tasks', '/api/tasks/'], async (req, res) => {
    try {
    const tasks = await getAllTasks();
    res.json({ data: tasks });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/tasks/:id', async (req, res) => {
    try {
    const task = await getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    res.json({ data: task });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/tasks', async (req, res) => {
    try {
    const { title, description, priority, status } = req.body;
    
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'El título es obligatorio' });
    }
    
    const newTask = await createTask(title, description, priority, status);
    res.status(201).json({ data: newTask });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
    try {
    const { title, description, priority, status } = req.body;
    
    const existingTask = await getTaskById(req.params.id);
    if (!existingTask) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    const updatedTask = await updateTask(req.params.id, title, description, priority, status);
    res.json({ data: updatedTask });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
    try {
    const existingTask = await getTaskById(req.params.id);
    if (!existingTask) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    const result = await deleteTask(req.params.id);
    res.json({ data: result });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

//.get(/tasks/) consultar todas las tareas
//.get(/tasks/:id) consultar una tarea por id
//.post(/tasks/) crear una nueva tarea
//.put(/tasks/:id) actualizar una tarea por id
//.delete(/tasks/:id) eliminar una tarea por id

app.listen(PORT, async () => {
    console.log('Servidor iniciado en el puerto ' + PORT);
    await initDatabase();
});