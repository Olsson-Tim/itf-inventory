const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize SQLite database
const dbPath = process.env.DB_PATH || path.join(dataDir, 'inventory.db');
console.log('Database path:', dbPath);

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
    // No sample data inserted by default
    console.log('Database initialized without sample data.');
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

// Bulk export devices as CSV
app.get('/api/devices/export', (req, res) => {
    const query = 'SELECT * FROM devices ORDER BY date_added DESC';
    
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Create CSV header
        const headers = ['id', 'name', 'type', 'serial_number', 'manufacturer', 'model', 'status', 'location', 'assigned_to', 'notes', 'date_added', 'date_updated'];
        let csv = headers.join(',') + '\n';
        
        // Add data rows
        rows.forEach(row => {
            const values = headers.map(header => {
                const value = row[header] || '';
                // Escape quotes and wrap in quotes if needed
                if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });
            csv += values.join(',') + '\n';
        });
        
        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="devices.csv"');
        res.send(csv);
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
        "SELECT COUNT(*) as in_use FROM devices WHERE status = 'In Use'"
    ];
    
    const stats = {};
    let completed = 0;
    
    queries.forEach((query, index) => {
        db.get(query, (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            const keys = ['total', 'available', 'in_use'];
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

// Bulk export devices as CSV
app.get('/api/devices/export', (req, res) => {
    const query = 'SELECT * FROM devices ORDER BY date_added DESC';
    
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Create CSV header
        const headers = ['id', 'name', 'type', 'serial_number', 'manufacturer', 'model', 'status', 'location', 'assigned_to', 'notes', 'date_added', 'date_updated'];
        let csv = headers.join(',') + '\n';
        
        // Add data rows
        rows.forEach(row => {
            const values = headers.map(header => {
                const value = row[header] || '';
                // Escape quotes and wrap in quotes if needed
                if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });
            csv += values.join(',') + '\n';
        });
        
        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="devices.csv"');
        res.send(csv);
    });
});

// Bulk import devices from CSV
app.post('/api/devices/import', express.raw({ type: 'text/csv' }), (req, res) => {
    try {
        const csv = req.body.toString();
        const lines = csv.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length < 2) {
            return res.status(400).json({ error: 'CSV file must contain headers and at least one data row' });
        }
        
        // Parse headers
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        // Required fields
        const requiredFields = ['name', 'type', 'status'];
        const missingFields = requiredFields.filter(field => !headers.includes(field));
        
        if (missingFields.length > 0) {
            return res.status(400).json({ error: `Missing required fields in CSV: ${missingFields.join(', ')}` });
        }
        
        // Parse data rows
        const devices = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => {
                // Handle quoted values
                if (v.startsWith('"') && v.endsWith('"')) {
                    return v.slice(1, -1).replace(/""/g, '"');
                }
                return v.trim();
            });
            
            if (values.length !== headers.length) {
                return res.status(400).json({ error: `Row ${i} has incorrect number of columns` });
            }
            
            const device = {};
            headers.forEach((header, index) => {
                device[header] = values[index] || '';
            });
            
            // Validate required fields
            if (!device.name || !device.type || !device.status) {
                return res.status(400).json({ error: `Row ${i} is missing required fields (name, type, status)` });
            }
            
            devices.push(device);
        }
        
        // Insert devices into database
        const insertQuery = `
            INSERT INTO devices (name, type, serial_number, manufacturer, model, status, location, assigned_to, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        let insertedCount = 0;
        let insertErrors = [];
        
        const insertDevice = (device, index) => {
            return new Promise((resolve) => {
                db.run(insertQuery, [
                    device.name,
                    device.type,
                    device.serial_number || null,
                    device.manufacturer || null,
                    device.model || null,
                    device.status,
                    device.location || null,
                    device.assigned_to || null,
                    device.notes || null
                ], (err) => {
                    if (err) {
                        console.error(`Error inserting device at row ${index + 1}:`, err.message);
                        insertErrors.push({ row: index + 1, error: err.message });
                    } else {
                        insertedCount++;
                    }
                    resolve();
                });
            });
        };
        
        // Process all devices
        Promise.all(devices.map(insertDevice)).then(() => {
            res.json({ 
                message: `Successfully imported ${insertedCount} of ${devices.length} devices`, 
                imported: insertedCount, 
                total: devices.length,
                errors: insertErrors
            });
        });
    } catch (error) {
        res.status(500).json({ error: `Error parsing CSV: ${error.message}` });
    }
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