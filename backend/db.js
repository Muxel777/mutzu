const mysql = require("mysql2/promise");
require('dotenv').config();

// Pool de conexiones: reutiliza conexiones abiertas en lugar de
// abrir y cerrar una nueva por cada solicitud HTTP.
// Esto mejora el rendimiento y evita agotar el límite de conexiones
// del servidor de base de datos (Railway permite ~10 en el plan gratuito).
const pool = mysql.createPool({
  host: process.env.MYSQLHOST || 'mysql.railway.internal',
  port: parseInt(process.env.MYSQLPORT || '3306'),
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || 'aOaesbiWIPdBBXJogelIZHYGNkPuLaav',
  database: process.env.MYSQLDATABASE || 'railway',
  waitForConnections: true,
  connectionLimit: 10,   // Máximo de conexiones simultáneas al pool
  queueLimit: 0,         // Sin límite de solicitudes en cola
  // SSL es obligatorio para bases de datos en la nube (Railway, PlanetScale, etc.)
  ssl: { rejectUnauthorized: false }
});

// Verifica la conexión al arrancar el servidor.
// Si la BD no responde, el proceso termina de inmediato ("fail fast"):
// es mejor un error claro al inicio que un crash misterioso en producción.
async function initDatabase() {
  try {
      const connection = await pool.getConnection();
    console.log('✅ Conectado a MySQL en Railway');
    connection.release();

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('pending', 'in_progress', 'completed') NOT NULL DEFAULT 'pending',
        priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM tasks');
    if (rows[0].count === 0) {
      await pool.query(`
        INSERT INTO tasks (title, description, status, priority) VALUES
  ('Set up project repository',  'Initialize Git repo and push to GitHub',          'completed', 'high'),
  ('Deploy backend to Render',   'Create Render service and configure env vars',     'in_progress', 'high'),
  ('Configure cloud database',   'Set up MySQL instance on Railway or PlanetScale',  'pending',   'high'),
  ('Deploy frontend to Vercel',  'Connect GitHub repo and configure build settings', 'pending',   'medium'),
  ('Write technical documentation', 'Architecture diagram + deployment steps',       'pending',   'low')
  `);
  console.log('Datos de ejemplo insertados');
    }
    
    console.log('Base de datos inicializada correctamente');
  } catch (error) {
    console.error('Error inicializando BD:', error.message);
    console.error('Detalles:', error);
    throw error;
  }
}

async function getAllTasks() {
  const [tasks] = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
  return tasks;
}

async function getTaskById(id) {
  const [tasks] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
  return tasks[0];
}

async function createTask(title, description, priority, status) {
  const [result] = await pool.query(
    'INSERT INTO tasks (title, description, priority, status) VALUES (?, ?, ?, ?)',
    [title, description || '', priority || 'medium', status || 'pending']
  );
  return getTaskById(result.insertId);
}

async function updateTask(id, title, description, priority, status) {
  await pool.query(
    'UPDATE tasks SET title = ?, description = ?, priority = ?, status = ? WHERE id = ?',
    [title, description, priority, status, id]
  );
  return getTaskById(id);
}

async function deleteTask(id) {
  await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
  return { id, deleted: true };
}

module.exports = { 
  pool, 
  initDatabase, 
  getAllTasks, 
  getTaskById, 
  createTask, 
  updateTask, 
  deleteTask 
};