# Device Inventory System

A simple and efficient device inventory management system built with Node.js, Express, and SQLite. This system allows you to track and manage your organization's devices with an intuitive web interface.

## Features

- **Device Management**: Add, edit, view, and delete devices
- **Bulk Import/Export**: Import devices from CSV files and export the entire inventory
- **Search Functionality**: Quickly find devices by name, type, serial number, or other attributes
- **Device Status Tracking**: Track device availability with statuses (Available, In Use, Maintenance)
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Mode**: Eye-friendly dark theme option
- **Docker Support**: Easy deployment with Docker and Docker Compose

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd inventory-system
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`

### Using Docker

1. Build and run with Docker Compose:
   ```bash
   docker-compose up -d
   ```

2. Access the application at `http://localhost:3000`

## Usage

### Adding Devices

1. Fill in the device information in the "Add New Device" form
2. Click "Add Device" to save the device to the inventory

### Editing Devices

1. Click the "Edit Device" button on any device card
2. Modify the device information in the modal
3. Click "Update Device" to save changes

### Deleting Devices

1. Click the "Delete Device" button on any device card
2. Confirm the deletion in the dialog

### Bulk Import

1. Click the "Import Devices" button
2. Select a CSV file with device information
3. The system will import all valid devices from the file

### Bulk Export

1. Click the "Export Devices" button
2. The system will download a CSV file with all devices

### Searching

1. Type in the search box to filter devices by any attribute
2. The list will update automatically as you type

### Dark Mode

1. Click the moon/sun icon in the top right corner
2. Toggle between light and dark themes

## CSV Format

When importing devices, use the following CSV format:

```csv
name,type,serial_number,manufacturer,model,status,location,assigned_to,notes
"Device Name",Laptop,SN123456,Manufacturer,Model Name,Available,Location,Assigned Person,Additional notes
```

Required fields:
- `name`
- `type` 
- `status`

See `example_devices.csv` for a complete example.

## API Endpoints

- `GET /api/devices` - Get all devices
- `GET /api/devices/:id` - Get a specific device
- `POST /api/devices` - Create a new device
- `PUT /api/devices/:id` - Update a device
- `DELETE /api/devices/:id` - Delete a device
- `GET /api/devices/export` - Export devices as CSV
- `POST /api/devices/import` - Import devices from CSV
- `GET /api/stats` - Get inventory statistics
- `GET /api/health` - Health check endpoint

## Development

### Running in Development Mode

```bash
npm run dev
```

This will start the server with nodemon for automatic restarts on code changes.

### Project Structure

```
inventory-system/
├── server.js          # Main server file
├── package.json       # Project dependencies
├── Dockerfile         # Docker configuration
├── docker-compose.yml # Docker Compose configuration
├── .dockerignore      # Docker ignore patterns
├── example_devices.csv # Example CSV for import
├── public/            # Frontend files
│   └── index.html     # Main HTML file
└── data/              # SQLite database (created automatically)
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue on the GitHub repository.