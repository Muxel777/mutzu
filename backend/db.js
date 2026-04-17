const mysql = require("mysql2/promise");
require('dotenv').config();

// Pool de conexiones: reutiliza conexiones abiertas en lugar de
// abrir y cerrar una nueva por cada solicitud HTTP.
// Esto mejora el rendimiento y evita agotar el límite de conexiones
// del servidor de base de datos (Railway permite ~10 en el plan gratuito).
const pool = mysql.createPool({
  host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.MYSQLPORT || process.env.DB_PORT || '3306'),
  user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'mutzu_db',
  waitForConnections: true,
  connectionLimit: 10,   // Máximo de conexiones simultáneas al pool
  queueLimit: 0,         // Sin límite de solicitudes en cola
  // SSL es obligatorio para bases de datos en la nube (Railway, PlanetScale, etc.)
  ssl: process.env.MYSQL_SSL === "true" ? { rejectUnauthorized: false } : undefined
});

// Verifica la conexión al arrancar el servidor.
// Si la BD no responde, el proceso termina de inmediato ("fail fast"):
// es mejor un error claro al inicio que un crash misterioso en producción.
async function initDatabase() {
  try {
    await pool.query(`CREATE DATABASE IF NOT EXISTS ${process.env.MYSQLDATABASE || 'mutzu_db'}`);
    await pool.query(`USE ${process.env.MYSQLDATABASE || 'mutzu_db'}`);

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