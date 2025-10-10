class InventorySystem {
    constructor() {
        this.devices = [];
        this.searchTimeout = null;
        this.currentDevice = null;
        // Delay initialization to ensure DOM is fully loaded
        setTimeout(() => {
            this.initEventListeners();
            this.loadDevices();
            this.loadStats();
            this.initDarkMode();
        }, 100);
    }

    initEventListeners() {
        // Check that all elements exist before attaching listeners
        const form = document.getElementById('device-form');
        const searchInput = document.getElementById('search-input');
        const importBtn = document.getElementById('import-btn');
        const exportBtn = document.getElementById('export-btn');
        const csvFile = document.getElementById('csv-file');
        const editModal = document.getElementById('edit-modal');
        const closeModal = document.getElementById('close-modal');
        const editForm = document.getElementById('edit-device-form');
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        const showAddDeviceBtn = document.getElementById('show-add-device-btn');
        const cancelAddDeviceBtn = document.getElementById('cancel-add-device');
        const addDeviceFormSection = document.getElementById('add-device-form-section');

        // Ensure the add device form is hidden initially
        if (addDeviceFormSection) {
            addDeviceFormSection.classList.add('hidden');
        }

        // Only attach listeners if all elements exist
        if (form && searchInput && importBtn && exportBtn && csvFile && 
            editModal && closeModal && editForm && darkModeToggle && 
            showAddDeviceBtn && cancelAddDeviceBtn && addDeviceFormSection) {
            
            form.addEventListener('submit', (e) => this.handleSubmit(e));
            searchInput.addEventListener('input', (e) => this.handleSearch(e));
            importBtn.addEventListener('click', () => csvFile.click());
            exportBtn.addEventListener('click', () => this.exportDevices());
            csvFile.addEventListener('change', (e) => this.importDevices(e));
            editForm.addEventListener('submit', (e) => this.handleEditSubmit(e));
            closeModal.addEventListener('click', () => this.closeEditModal());
            darkModeToggle.addEventListener('click', () => this.toggleDarkMode());
            showAddDeviceBtn.addEventListener('click', () => {
                showAddDeviceBtn.parentElement.parentElement.parentElement.classList.add('hidden');
                addDeviceFormSection.classList.remove('hidden');
            });
            cancelAddDeviceBtn.addEventListener('click', () => {
                addDeviceFormSection.classList.add('hidden');
                showAddDeviceBtn.parentElement.parentElement.parentElement.classList.remove('hidden');
                this.resetForm();
            });

            // Close modal when clicking outside
            window.addEventListener('click', (e) => {
                if (e.target === editModal) {
                    this.closeEditModal();
                }
            });
        }
    }

    initDarkMode() {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            document.getElementById('dark-mode-toggle').textContent = '☀️';
        }
    }

    toggleDarkMode() {
        const isDarkMode = document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
        document.getElementById('dark-mode-toggle').textContent = isDarkMode ? '☀️' : '🌙';
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const device = {
            name: document.getElementById('device-name').value,
            type: document.getElementById('device-type').value,
            amount: document.getElementById('amount').value,
            status: document.getElementById('status').value,
            location: document.getElementById('location').value,
            assigned_to: document.getElementById('assigned-to').value,
            notes: document.getElementById('notes').value
        };

        try {
            const response = await fetch('/api/devices', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(device)
            });

            if (response.ok) {
                this.loadDevices();
                this.loadStats();
                this.resetForm();
                this.showNotification(`Enheten tillagd!`, 'success');
            } else {
                const error = await response.json();
                this.showNotification(`Fel: ${error.error}`, 'error');
            }
        } catch (error) {
            this.showNotification(`Error: ${error.message}`, 'error');
        }
    }

    handleSearch(e) {
        const query = e.target.value;
        
        // Debounce search requests
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.loadDevices(query);
        }, 300);
    }

    async handleEditSubmit(e) {
        e.preventDefault();
        
        const device = {
            id: document.getElementById('edit-device-id').value,
            name: document.getElementById('edit-device-name').value,
            type: document.getElementById('edit-device-type').value,
            amount: document.getElementById('edit-amount').value,
            status: document.getElementById('edit-status').value,
            location: document.getElementById('edit-location').value,
            assigned_to: document.getElementById('edit-assigned-to').value,
            notes: document.getElementById('edit-notes').value
        };

        try {
            const response = await fetch(`/api/devices/${device.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(device)
            });

            if (response.ok) {
                this.closeEditModal();
                this.loadDevices();
                this.loadStats();
                this.showNotification(`Enheten uppdaterades!`, 'success');
            } else {
                const error = await response.json();
                this.showNotification(`Fel: ${error.error}`, 'error');
            }
        } catch (error) {
            this.showNotification(`Fel: ${error.message}`, 'error');
        }
    }

    openEditModalById(deviceId) {
        const device = this.devices.find(d => d.id === deviceId);
        if (device) {
            this.openEditModal(device);
        }
    }

    openEditModal(device) {
        this.currentDevice = device;
        
        // Fill the form with device data
        document.getElementById('edit-device-id').value = device.id;
        document.getElementById('edit-device-name').value = device.name;
        document.getElementById('edit-device-type').value = device.type;
        document.getElementById('edit-amount').value = device.amount || '';
        document.getElementById('edit-status').value = device.status;
        document.getElementById('edit-location').value = device.location || '';
        document.getElementById('edit-assigned-to').value = device.assigned_to || '';
        document.getElementById('edit-notes').value = device.notes || '';
        
        // Show the modal
        document.getElementById('edit-modal').style.display = 'block';
    }

    closeEditModal() {
        document.getElementById('edit-modal').style.display = 'none';
        this.currentDevice = null;
    }

    exportDevices() {
        window.location.href = '/api/devices/export';
    }

    async importDevices(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            this.showNotification('Välj en CSV-fil', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const content = event.target.result;
                
                const response = await fetch('/api/devices/import', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/csv'
                    },
                    body: content
                });

                if (response.ok) {
                    const result = await response.json();
                    this.loadDevices();
                    this.loadStats();
                    this.showNotification(result.message, 'success');
                } else {
                    const error = await response.json();
                    this.showNotification(`Importen misslyckades: ${error.error}`, 'error');
                }
            } catch (error) {
                this.showNotification(`Fel vid import: ${error.message}`, 'error');
            }
        };

        reader.readAsText(file);
        // Reset file input
        e.target.value = '';
    }

    async deleteDevice(id) {
        if (confirm('Är du säker på att du vill ta bort denna enhet?')) {
            try {
                const response = await fetch(`/api/devices/${id}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    this.loadDevices();
                    this.loadStats();
                    this.showNotification('Enheten har tagits bort!', 'success');
                } else {
                    const error = await response.json();
                    this.showNotification(`Fel: ${error.error}`, 'error');
                }
            } catch (error) {
                this.showNotification(`Fel: ${error.message}`, 'error');
            }
        }
    }

    async loadDevices(searchQuery = '') {
        try {
            let url = '/api/devices';
            if (searchQuery) {
                url += `?search=${encodeURIComponent(searchQuery)}`;
            }

            const response = await fetch(url);
            if (response.ok) {
                this.devices = await response.json();
                this.render();
            } else {
                const error = await response.json();
                this.showNotification(`Fel vid laddning av enheter: ${error.error}`, 'error');
            }
        } catch (error) {
            this.showNotification(`Fel vid laddning av enheter: ${error.message}`, 'error');
            this.devices = [];
            this.render();
        }
    }

    async loadStats() {
        try {
            const response = await fetch('/api/stats');
            if (response.ok) {
                const stats = await response.json();
                this.updateStats(stats);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    render() {
        const inventoryList = document.getElementById('inventory-list');
        
        if (this.devices.length === 0) {
            inventoryList.innerHTML = `
                <div class="empty-state">
                    <h3>Inga enheter hittades</h3>
                    <p>Lägg till din första enhet med formuläret ovan.</p>
                </div>
            `;
            return;
        }

        inventoryList.innerHTML = this.devices.map(device => `
            <div class="device-card">
                <div class="device-header">
                    <div>
                        <div class="device-name">${this.escapeHtml(device.name)}</div>
                        <div class="device-type">${this.translateDeviceType(device.type)}</div>
                    </div>
                    <div class="status-badge status-${this.translateStatusClass(device.status)}">${this.translateStatus(device.status)}</div>
                </div>
                <div class="device-details">
                    ${device.amount ? `<div class="device-detail"><span class="detail-label">Antal:</span> ${this.escapeHtml(device.amount)}</div>` : ''}
                    ${device.location ? `<div class="device-detail"><span class="detail-label">Plats:</span> ${this.escapeHtml(device.location)}</div>` : ''}
                    ${device.assigned_to ? `<div class="device-detail"><span class="detail-label">Tilldelad till:</span> ${this.escapeHtml(device.assigned_to)}</div>` : ''}
                    <div class="device-detail"><span class="detail-label">Tillagd:</span> ${new Date(device.date_added).toLocaleDateString()}</div>
                    ${device.notes ? `<div class="device-detail"><span class="detail-label">Anteckningar:</span> ${this.escapeHtml(device.notes)}</div>` : ''}
                </div>
                <div class="device-actions">
                    <button class="btn-small btn-edit" data-device-id="${device.id}">Redigera enhet</button>
                    <button class="btn-small btn-delete" data-device-id="${device.id}">Ta bort enhet</button>
                </div>
            </div>
        `).join('');
        
        // Attach event listeners to the buttons
        setTimeout(() => {
            const inventoryList = document.getElementById('inventory-list');
            const editButtons = inventoryList.querySelectorAll('.btn-edit');
            const deleteButtons = inventoryList.querySelectorAll('.btn-delete');
            
            editButtons.forEach((button) => {
                button.addEventListener('click', (e) => {
                    const deviceId = parseInt(e.target.getAttribute('data-device-id'));
                    this.openEditModalById(deviceId);
                });
            });
            
            deleteButtons.forEach((button) => {
                button.addEventListener('click', (e) => {
                    const deviceId = parseInt(e.target.getAttribute('data-device-id'));
                    this.deleteDevice(deviceId);
                });
            });
        }, 100);
    }

    updateStats(stats) {
        document.getElementById('total-devices').textContent = stats.total || 0;
        document.getElementById('available-devices').textContent = stats.available || 0;
        document.getElementById('inuse-devices').textContent = stats.in_use || 0;
    }

    resetForm() {
        document.getElementById('device-form').reset();
        // Hide the form and show the button after adding a device
        document.getElementById('add-device-form-section').classList.add('hidden');
        document.getElementById('show-add-device-btn').parentElement.parentElement.parentElement.classList.remove('hidden');
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    translateDeviceType(type) {
        const translations = {
            'labb': 'Labb',
            'del': 'Del',
            'hel': 'Hel'
        };
        return translations[type] || type;
    }

    translateStatus(status) {
        const translations = {
            'Available': 'Tillgänglig',
            'In Use': 'Används'
        };
        return translations[status] || status;
    }

    translateStatusClass(status) {
        const translations = {
            'Available': 'available',
            'In Use': 'in-use'
        };
        return translations[status] || status.toLowerCase().replace(' ', '-');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.className = type === 'success' ? 'notification success' : 'notification error';
        
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}


// Initialize the inventory system
window.inventory = null;
window.addEventListener('load', () => {
    window.inventory = new InventorySystem();
});