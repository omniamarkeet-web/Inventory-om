// Main Application Logic
class InventoryApp {
    constructor() {
        this.data = {
            inventory: [],
            sales: [],
            customers: [],
            suppliers: []
        };
        this.initEventListeners();
    }

    initEventListeners() {
        // Login button
        document.getElementById('loginBtn').addEventListener('click', () => {
            sheetsAPI.signIn().then(() => {
                document.getElementById('loginBtn').style.display = 'none';
                document.getElementById('mainContent').style.display = 'flex';
                this.loadAllData();
            });
        });

        // Navigation
        document.querySelectorAll('.sidebar a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.getAttribute('data-page');
                this.switchPage(page);
            });
        });

        // Add buttons
        document.getElementById('addItemBtn')?.addEventListener('click', () => this.addItem());
        document.getElementById('addSaleBtn')?.addEventListener('click', () => this.addSale());
        document.getElementById('addCustomerBtn')?.addEventListener('click', () => this.addCustomer());
        document.getElementById('addSupplierBtn')?.addEventListener('click', () => this.addSupplier());
        document.getElementById('printInvoiceBtn')?.addEventListener('click', () => this.printInvoice());
    }

    switchPage(page) {
        document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
        document.getElementById(page).style.display = 'block';
        
        if (page === 'reports') {
            this.updateReports();
        }
    }

    async loadAllData() {
        try {
            this.data.inventory = await sheetsAPI.readSheet(SHEETS.INVENTORY);
            this.data.sales = await sheetsAPI.readSheet(SHEETS.SALES);
            this.data.customers = await sheetsAPI.readSheet(SHEETS.CUSTOMERS);
            this.data.suppliers = await sheetsAPI.readSheet(SHEETS.SUPPLIERS);
            
            this.displayInventory();
            this.displaySales();
            this.displayCustomers();
            this.displaySuppliers();
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    displayInventory() {
        const tbody = document.getElementById('inventoryBody');
        tbody.innerHTML = '';
        
        this.data.inventory.slice(1).forEach((item, index) => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${item[0] || ''}</td>
                <td>${item[1] || ''}</td>
                <td>${item[2] || ''}</td>
                <td>${item[3] || ''}</td>
                <td>
                    <button class="btn-small" onclick="app.editItem(${index})">تعديل</button>
                    <button class="btn-small btn-danger" onclick="app.deleteItem(${index})">حذف</button>
                </td>
            `;
        });
    }

    displaySales() {
        const tbody = document.getElementById('salesBody');
        tbody.innerHTML = '';
        
        this.data.sales.slice(1).forEach((sale) => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${sale[0] || ''}</td>
                <td>${sale[1] || ''}</td>
                <td>${sale[2] || ''}</td>
                <td>${sale[3] || ''}</td>
                <td>${sale[4] || ''}</td>
                <td>${sale[5] || ''}</td>
            `;
        });
    }

    displayCustomers() {
        const tbody = document.getElementById('customersBody');
        tbody.innerHTML = '';
        
        this.data.customers.slice(1).forEach((customer, index) => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${customer[0] || ''}</td>
                <td>${customer[1] || ''}</td>
                <td>${customer[2] || ''}</td>
                <td>${customer[3] || ''}</td>
                <td>
                    <button class="btn-small" onclick="app.editCustomer(${index})">تعديل</button>
                    <button class="btn-small btn-danger" onclick="app.deleteCustomer(${index})">حذف</button>
                </td>
            `;
        });
    }

    displaySuppliers() {
        const tbody = document.getElementById('suppliersBody');
        tbody.innerHTML = '';
        
        this.data.suppliers.slice(1).forEach((supplier, index) => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${supplier[0] || ''}</td>
                <td>${supplier[1] || ''}</td>
                <td>${supplier[2] || ''}</td>
                <td>${supplier[3] || ''}</td>
                <td>
                    <button class="btn-small" onclick="app.editSupplier(${index})">تعديل</button>
                    <button class="btn-small btn-danger" onclick="app.deleteSupplier(${index})">حذف</button>
                </td>
            `;
        });
    }

    addItem() {
        const name = prompt('اسم المنتج:');
        const quantity = prompt('الكمية:');
        const price = prompt('السعر:');
        
        if (name && quantity && price) {
            const newItem = [this.generateID(), name, quantity, price];
            sheetsAPI.appendSheet(SHEETS.INVENTORY, newItem).then(() => {
                this.loadAllData();
            });
        }
    }

    addSale() {
        // Implementation for adding sale
        alert('إضافة مبيعة جديدة');
    }

    addCustomer() {
        const name = prompt('اسم العميل:');
        const phone = prompt('الهاتف:');
        const email = prompt('البريد الإلكتروني:');
        const address = prompt('العنوان:');
        
        if (name && phone) {
            const newCustomer = [name, phone, email || '', address || ''];
            sheetsAPI.appendSheet(SHEETS.CUSTOMERS, newCustomer).then(() => {
                this.loadAllData();
            });
        }
    }

    addSupplier() {
        const name = prompt('اسم المورد:');
        const phone = prompt('الهاتف:');
        const email = prompt('البريد الإلكتروني:');
        
        if (name && phone) {
            const newSupplier = [name, phone, email || '', ''];
            sheetsAPI.appendSheet(SHEETS.SUPPLIERS, newSupplier).then(() => {
                this.loadAllData();
            });
        }
    }

    editItem(index) {
        alert('تعديل المنتج');
    }

    deleteItem(index) {
        if (confirm('هل تريد حذف هذا المنتج؟')) {
            alert('حذف المنتج');
        }
    }

    editCustomer(index) {
        alert('تعديل العميل');
    }

    deleteCustomer(index) {
        if (confirm('هل تريد حذف هذا العميل؟')) {
            alert('حذف العميل');
        }
    }

    editSupplier(index) {
        alert('تعديل المورد');
    }

    deleteSupplier(index) {
        if (confirm('هل تريد حذف هذا المورد؟')) {
            alert('حذف المورد');
        }
    }

    updateReports() {
        const totalInventory = this.data.inventory.slice(1).length;
        const totalCustomers = this.data.customers.slice(1).length;
        const totalSuppliers = this.data.suppliers.slice(1).length;
        
        document.getElementById('totalInventory').textContent = totalInventory;
        document.getElementById('totalCustomers').textContent = totalCustomers;
        document.getElementById('totalSuppliers').textContent = totalSuppliers;
    }

    printInvoice() {
        alert('طباعة الفاتورة');
    }

    generateID() {
        return 'ID-' + Date.now();
    }
}

const app = new InventoryApp();