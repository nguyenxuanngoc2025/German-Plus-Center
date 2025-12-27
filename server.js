
require('dotenv').config();
const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- 1. DATABASE CONNECTION ---
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'german_plus_crm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test Connection
pool.getConnection()
    .then(conn => {
        console.log('✅ Connected to Hostinger MySQL Database!');
        conn.release();
    })
    .catch(err => {
        console.error('❌ DB Connection Error:', err.message);
    });

// --- 2. API ENDPOINTS (DATA LAYER) ---

// Get All Data (Initial Load)
app.get('/api/init', async (req, res) => {
    try {
        const [leads] = await pool.query('SELECT * FROM leads ORDER BY created_at DESC');
        const [students] = await pool.query('SELECT * FROM students');
        const [classes] = await pool.query('SELECT * FROM classes');
        const [finance] = await pool.query('SELECT * FROM finance ORDER BY date DESC');
        const [staff] = await pool.query('SELECT * FROM staff');
        
        // Parse JSON fields
        const parsedClasses = classes.map(c => ({
            ...c,
            offDays: c.off_days ? JSON.parse(c.off_days) : [],
            extraSessions: c.extra_sessions ? JSON.parse(c.extra_sessions) : []
        }));

        const parsedStudents = students.map(s => ({
            ...s,
            scores: s.scores ? JSON.parse(s.scores) : [],
            attendanceHistory: s.attendance_history ? JSON.parse(s.attendance_history) : []
        }));

        res.json({ leads, students: parsedStudents, classes: parsedClasses, finance, staff });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database fetch failed' });
    }
});

// Generic Handler for Updates
app.post('/api/sync', async (req, res) => {
    res.json({ success: true });
});

// --- 3. SERVE REACT FRONTEND ---
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React Routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
