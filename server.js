// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize SQLite database
const dbPath = process.env.DB_PATH || './inventory.db';
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        initializeDatabase();
    }
});

// Initialize database schema
function initializeDatabase() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS devices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            serial_number TEXT,
            manufacturer TEXT,
            model TEXT,
            status TEXT NOT NULL,
            location TEXT,
            assigned_to TEXT,
            notes TEXT,
            date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
            date_updated DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;
    
    db.run(createTableQuery, (err) => {
        if (err) {
            console.error('Error creating table:', err.message);
        } else {
            console.log('Database table initialized.');
            insertSampleData();
        }
    });
}

// Insert sample data if table is empty
function insertSampleData() {
    db.get("SELECT COUNT(*) as count FROM devices", (err, row) => {
        if (err) {
            console.error('Error checking data:', err.message);
            return;
        }
        
        if (row.count === 0) {
            const sampleDevices = [
                {
                    name: 'MacBook Pro 16"',
                    type: 'Laptop',
                    serial_number: 'MBP2023001',
                    manufacturer: 'Apple',
                    model: 'MacBook Pro',
                    status: 'In Use',
                    location: 'Office 201',
                    assigned_to: 'John Doe',
                    notes: 'Primary work laptop'
                },
                {
                    name: 'Dell Monitor 27"',
                    type: 'Monitor',
                    serial_number: 'DM27001',
                    manufacturer: 'Dell',
                    model: 'UltraSharp 27',
                    status: 'Available',
                    location: 'Storage Room',
                    assigned_to: '',
                    notes: 'Secondary monitor for developers'
                },
                {
                    name: 'HP Printer LaserJet',
                    type: 'Printer',
                    serial_number: 'HP2023LJ001',
                    manufacturer: 'HP',
                    model: 'LaserJet Pro',
                    status: 'Maintenance',
                    location: 'Office Floor 1',
                    assigned_to: '',
                    notes: 'Needs toner replacement'
                }
            ];
            
            const insertQuery = `
                INSERT INTO devices (name, type, serial_number, manufacturer, model, status, location, assigned_to, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            sampleDevices.forEach(device => {
                db.run(insertQuery, [
                    device.name,
                    device.type,
                    device.serial_number,
                    device.manufacturer,
                    device.model,
                    device.status,
                    device.location,
                    device.assigned_to,
                    device.notes
                ], (err) => {
                    if (err) {
                        console.error('Error inserting sample data:', err.message);
                    }
                });
            });
            
            console.log('Sample data inserted.');
        }
    });
}

// API Routes

// Get all devices
app.get('/api/devices', (req, res) => {
    const { search } = req.query;
    let query = 'SELECT * FROM devices ORDER BY date_added DESC';
    let params = [];
    
    if (search) {
        query = `
            SELECT * FROM devices 
            WHERE name LIKE ? OR type LIKE ? OR serial_number LIKE ? 
            OR manufacturer LIKE ? OR model LIKE ? OR location LIKE ? OR assigned_to LIKE ?
            ORDER BY date_added DESC
        `;
        const searchTerm = `%${search}%`;
        params = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];
    }
    
    db.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Get device by ID
app.get('/api/devices/:id', (req, res) => {
    const { id } = req.params;
    
    db.get('SELECT * FROM devices WHERE id = ?', [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (row) {
            res.json(row);
        } else {
            res.status(404).json({ error: 'Device not found' });
        }
    });
});

// Create new device
app.post('/api/devices', (req, res) => {
    const {
        name,
        type,
        serial_number,
        manufacturer,
        model,
        status,
        location,
        assigned_to,
        notes
    } = req.body;
    
    // Validation
    if (!name || !type || !status) {
        return res.status(400).json({ error: 'Name, type, and status are required' });
    }
    
    const query = `
        INSERT INTO devices (name, type, serial_number, manufacturer, model, status, location, assigned_to, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(query, [name, type, serial_number, manufacturer, model, status, location, assigned_to, notes], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Return the created device
        db.get('SELECT * FROM devices WHERE id = ?', [this.lastID], (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.status(201).json(row);
        });
    });
});

// Update device
app.put('/api/devices/:id', (req, res) => {
    const { id } = req.params;
    const {
        name,
        type,
        serial_number,
        manufacturer,
        model,
        status,
        location,
        assigned_to,
        notes
    } = req.body;
    
    // Validation
    if (!name || !type || !status) {
        return res.status(400).json({ error: 'Name, type, and status are required' });
    }
    
    const query = `
        UPDATE devices 
        SET name = ?, type = ?, serial_number = ?, manufacturer = ?, model = ?, 
            status = ?, location = ?, assigned_to = ?, notes = ?, date_updated = CURRENT_TIMESTAMP
        WHERE id = ?
    `;
    
    db.run(query, [name, type, serial_number, manufacturer, model, status, location, assigned_to, notes, id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (this.changes === 0) {
            res.status(404).json({ error: 'Device not found' });
            return;
        }
        
        // Return the updated device
        db.get('SELECT * FROM devices WHERE id = ?', [id], (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(row);
        });
    });
});

// Delete device
app.delete('/api/devices/:id', (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM devices WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (this.changes === 0) {
            res.status(404).json({ error: 'Device not found' });
            return;
        }
        
        res.json({ message: 'Device deleted successfully' });
    });
});

// Get statistics
app.get('/api/stats', (req, res) => {
    const queries = [
        'SELECT COUNT(*) as total FROM devices',
        "SELECT COUNT(*) as available FROM devices WHERE status = 'Available'",
        "SELECT COUNT(*) as in_use FROM devices WHERE status = 'In Use'",
        "SELECT COUNT(*) as maintenance FROM devices WHERE status = 'Maintenance'"
    ];
    
    const stats = {};
    let completed = 0;
    
    queries.forEach((query, index) => {
        db.get(query, (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            const keys = ['total', 'available', 'in_use', 'maintenance'];
            stats[keys[index]] = Object.values(row)[0];
            completed++;
            
            if (completed === queries.length) {
                res.json(stats);
            }
        });
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Handle 404
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});