// Main Application Logic
class InventoryApp {
    constructor() {
        this.data = {
            inventory: [],
            sales: [],
            customers: [],
            suppliers: []
        };
        this.editingIndex = null;
        this.deleteCallback = null;
        this.initEventListeners();
        this.setupModals();
    }

    initEventListeners() {
        // Login button
        document.getElementById('loginBtn').addEventListener('click', () => {
            sheetsAPI.signIn().then(() => {
                document.getElementById('loginBtn').style.display = 'none';
                document.getElementById('logoutBtn').style.display = 'inline-block';
                document.getElementById('mainContent').style.display = 'flex';
                this.loadAllData();
            });
        });

        // Logout button
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            sheetsAPI.signOut().then(() => {
                document.getElementById('loginBtn').style.display = 'inline-block';
                document.getElementById('logoutBtn').style.display = 'none';
                document.getElementById('mainContent').style.display = 'none';
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
        document.getElementById('addItemBtn')?.addEventListener('click', () => this.openItemModal());
        document.getElementById('addSaleBtn')?.addEventListener('click', () => this.openSaleModal());
        document.getElementById('addCustomerBtn')?.addEventListener('click', () => this.openCustomerModal());
        document.getElementById('addSupplierBtn')?.addEventListener('click', () => this.openSupplierModal());

        // Sale product selection
        document.getElementById('saleProduct')?.addEventListener('change', (e) => {
            this.updateSalePrice(e.target.value);
        });

        // Sale quantity change
        document.getElementById('saleQuantity')?.addEventListener('input', () => {
            this.calculateSaleTotal();
        });

        // Set today's date in sale form
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('saleDate').value = today;
    }

    setupModals() {
        // Item modal
        this.setupModal('itemModal', 'itemForm', () => this.saveItem());
        document.getElementById('cancelItemBtn')?.addEventListener('click', () => this.closeModal('itemModal'));

        // Sale modal
        this.setupModal('saleModal', 'saleForm', () => this.saveSale());
        document.getElementById('cancelSaleBtn')?.addEventListener('click', () => this.closeModal('saleModal'));

        // Customer modal
        this.setupModal('customerModal', 'customerForm', () => this.saveCustomer());
        document.getElementById('cancelCustomerBtn')?.addEventListener('click', () => this.closeModal('customerModal'));

        // Supplier modal
        this.setupModal('supplierModal', 'supplierForm', () => this.saveSupplier());
        document.getElementById('cancelSupplierBtn')?.addEventListener('click', () => this.closeModal('supplierModal'));

        // Confirm modal
        document.getElementById('confirmDeleteBtn')?.addEventListener('click', () => {
            if (this.deleteCallback) {
                this.deleteCallback();
            }
            this.closeModal('confirmModal');
        });
        document.getElementById('cancelDeleteBtn')?.addEventListener('click', () => this.closeModal('confirmModal'));
    }

    setupModal(modalId, formId, submitCallback) {
        const modal = document.getElementById(modalId);
        const form = document.getElementById(formId);
        const closeBtn = modal.querySelector('.close');

        closeBtn?.addEventListener('click', () => this.closeModal(modalId));

        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            submitCallback();
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modalId);
            }
        });
    }

    openModal(modalId) {
        document.getElementById(modalId).classList.add('show');
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('show');
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
            this.populateProductSelect();
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
                <td>${item[4] || ''}</td>
                <td>
                    <button class="btn-small" onclick="app.openItemModal(${index})">تعديل</button>
                    <button class="btn-small btn-danger" onclick="app.confirmDelete(${index}, 'inventory')">حذف</button>
                </td>
            `;
        });
    }

    displaySales() {
        const tbody = document.getElementById('salesBody');
        tbody.innerHTML = '';
        
        this.data.sales.slice(1).forEach((sale, index) => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${sale[0] || ''}</td>
                <td>${sale[1] || ''}</td>
                <td>${sale[2] || ''}</td>
                <td>${sale[3] || ''}</td>
                <td>${sale[4] || ''}</td>
                <td>${sale[5] || ''}</td>
                <td>${sale[6] || ''}</td>
                <td>
                    <button class="btn-small" onclick="app.openSaleModal(${index})">تعديل</button>
                    <button class="btn-small btn-danger" onclick="app.confirmDelete(${index}, 'sales')">حذف</button>
                </td>
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
                    <button class="btn-small" onclick="app.openCustomerModal(${index})">تعديل</button>
                    <button class="btn-small btn-danger" onclick="app.confirmDelete(${index}, 'customers')">حذف</button>
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
                    <button class="btn-small" onclick="app.openSupplierModal(${index})">تعديل</button>
                    <button class="btn-small btn-danger" onclick="app.confirmDelete(${index}, 'suppliers')">حذف</button>
                </td>
            `;
        });
    }

    // نماذج المنتجات
    openItemModal(index = null) {
        document.getElementById('itemIndex').value = index !== null ? index : '';
        if (index !== null) {
            const item = this.data.inventory[index + 1];
            document.getElementById('itemModalTitle').textContent = 'تعديل المنتج';
            document.getElementById('itemName').value = item[1] || '';
            document.getElementById('itemQuantity').value = item[2] || '';
            document.getElementById('itemPrice').value = item[3] || '';
            document.getElementById('itemCategory').value = item[4] || '';
        } else {
            document.getElementById('itemModalTitle').textContent = 'إضافة منتج جديد';
            document.getElementById('itemForm').reset();
        }
        this.openModal('itemModal');
    }

    saveItem() {
        const index = document.getElementById('itemIndex').value;
        const name = document.getElementById('itemName').value;
        const quantity = document.getElementById('itemQuantity').value;
        const price = document.getElementById('itemPrice').value;
        const category = document.getElementById('itemCategory').value;

        if (name && quantity !== '' && price !== '') {
            if (index === '') {
                // إضافة جديد
                const newItem = [this.generateID(), name, quantity, price, category];
                sheetsAPI.appendSheet(SHEETS.INVENTORY, newItem).then(() => {
                    this.loadAllData();
                    this.closeModal('itemModal');
                });
            } else {
                // تعديل
                const item = this.data.inventory[parseInt(index) + 1];
                item[1] = name;
                item[2] = quantity;
                item[3] = price;
                item[4] = category;
                sheetsAPI.writeSheet(SHEETS.INVENTORY, this.data.inventory).then(() => {
                    this.loadAllData();
                    this.closeModal('itemModal');
                });
            }
        }
    }

    // نماذج المبيعات
    openSaleModal(index = null) {
        document.getElementById('saleIndex').value = index !== null ? index : '';
        this.populateProductSelect();
        if (index !== null) {
            const sale = this.data.sales[index + 1];
            document.getElementById('saleModalTitle').textContent = 'تعديل المبيعة';
            document.getElementById('saleCustomer').value = sale[1] || '';
            document.getElementById('saleProduct').value = sale[2] || '';
            document.getElementById('saleQuantity').value = sale[3] || '';
            document.getElementById('saleUnitPrice').value = sale[4] || '';
            document.getElementById('saleDate').value = sale[6] || '';
            this.calculateSaleTotal();
        } else {
            document.getElementById('saleModalTitle').textContent = 'مبيعة جديدة';
            document.getElementById('saleForm').reset();
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('saleDate').value = today;
        }
        this.openModal('saleModal');
    }

    populateProductSelect() {
        const select = document.getElementById('saleProduct');
        const currentValue = select.value;
        select.innerHTML = '<option value="">اختر منتج</option>';
        
        this.data.inventory.slice(1).forEach((item, index) => {
            const option = document.createElement('option');
            option.value = item[1]; // اسم المنتج
            option.textContent = `${item[1]} - ${item[3]} ريال`;
            select.appendChild(option);
        });
        
        if (currentValue) {
            select.value = currentValue;
        }
    }

    updateSalePrice(productName) {
        const item = this.data.inventory.slice(1).find(i => i[1] === productName);
        if (item) {
            document.getElementById('saleUnitPrice').value = item[3];
            this.calculateSaleTotal();
        }
    }

    calculateSaleTotal() {
        const quantity = parseFloat(document.getElementById('saleQuantity').value) || 0;
        const price = parseFloat(document.getElementById('saleUnitPrice').value) || 0;
        const total = (quantity * price).toFixed(2);
        document.getElementById('saleTotal').value = total;
    }

    saveSale() {
        const index = document.getElementById('saleIndex').value;
        const customer = document.getElementById('saleCustomer').value;
        const product = document.getElementById('saleProduct').value;
        const quantity = document.getElementById('saleQuantity').value;
        const unitPrice = document.getElementById('saleUnitPrice').value;
        const total = document.getElementById('saleTotal').value;
        const date = document.getElementById('saleDate').value;

        if (customer && product && quantity !== '' && total !== '') {
            if (index === '') {
                // إضافة جديد
                const newSale = [this.generateID(), customer, product, quantity, unitPrice, total, date];
                sheetsAPI.appendSheet(SHEETS.SALES, newSale).then(() => {
                    this.deductFromInventory(product, quantity);
                });
            } else {
                // تعديل
                const sale = this.data.sales[parseInt(index) + 1];
                sale[1] = customer;
                sale[2] = product;
                sale[3] = quantity;
                sale[4] = unitPrice;
                sale[5] = total;
                sale[6] = date;
                sheetsAPI.writeSheet(SHEETS.SALES, this.data.sales).then(() => {
                    this.loadAllData();
                    this.closeModal('saleModal');
                });
            }
        }
    }

    deductFromInventory(productName, quantity) {
        const itemIndex = this.data.inventory.findIndex(i => i[1] === productName);
        if (itemIndex > 0) {
            const currentQty = parseInt(this.data.inventory[itemIndex][2]);
            this.data.inventory[itemIndex][2] = currentQty - parseInt(quantity);
            sheetsAPI.writeSheet(SHEETS.INVENTORY, this.data.inventory).then(() => {
                sheetsAPI.appendSheet(SHEETS.SALES, [
                    this.generateID(),
                    document.getElementById('saleCustomer').value,
                    productName,
                    quantity,
                    document.getElementById('saleUnitPrice').value,
                    document.getElementById('saleTotal').value,
                    document.getElementById('saleDate').value
                ]).then(() => {
                    this.loadAllData();
                    this.closeModal('saleModal');
                });
            });
        }
    }

    // نماذج العملاء
    openCustomerModal(index = null) {
        document.getElementById('customerIndex').value = index !== null ? index : '';
        if (index !== null) {
            const customer = this.data.customers[index + 1];
            document.getElementById('customerModalTitle').textContent = 'تعديل العميل';
            document.getElementById('customerName').value = customer[0] || '';
            document.getElementById('customerPhone').value = customer[1] || '';
            document.getElementById('customerEmail').value = customer[2] || '';
            document.getElementById('customerAddress').value = customer[3] || '';
        } else {
            document.getElementById('customerModalTitle').textContent = 'إضافة عميل جديد';
            document.getElementById('customerForm').reset();
        }
        this.openModal('customerModal');
    }

    saveCustomer() {
        const index = document.getElementById('customerIndex').value;
        const name = document.getElementById('customerName').value;
        const phone = document.getElementById('customerPhone').value;
        const email = document.getElementById('customerEmail').value;
        const address = document.getElementById('customerAddress').value;

        if (name && phone) {
            if (index === '') {
                // إضافة جديد
                const newCustomer = [name, phone, email, address];
                sheetsAPI.appendSheet(SHEETS.CUSTOMERS, newCustomer).then(() => {
                    this.loadAllData();
                    this.closeModal('customerModal');
                });
            } else {
                // تعديل
                const customer = this.data.customers[parseInt(index) + 1];
                customer[0] = name;
                customer[1] = phone;
                customer[2] = email;
                customer[3] = address;
                sheetsAPI.writeSheet(SHEETS.CUSTOMERS, this.data.customers).then(() => {
                    this.loadAllData();
                    this.closeModal('customerModal');
                });
            }
        }
    }

    // نماذج الموردين
    openSupplierModal(index = null) {
        document.getElementById('supplierIndex').value = index !== null ? index : '';
        if (index !== null) {
            const supplier = this.data.suppliers[index + 1];
            document.getElementById('supplierModalTitle').textContent = 'تعديل المورد';
            document.getElementById('supplierName').value = supplier[0] || '';
            document.getElementById('supplierPhone').value = supplier[1] || '';
            document.getElementById('supplierEmail').value = supplier[2] || '';
            document.getElementById('supplierProducts').value = supplier[3] || '';
        } else {
            document.getElementById('supplierModalTitle').textContent = 'إضافة مورد جديد';
            document.getElementById('supplierForm').reset();
        }
        this.openModal('supplierModal');
    }

    saveSupplier() {
        const index = document.getElementById('supplierIndex').value;
        const name = document.getElementById('supplierName').value;
        const phone = document.getElementById('supplierPhone').value;
        const email = document.getElementById('supplierEmail').value;
        const products = document.getElementById('supplierProducts').value;

        if (name && phone) {
            if (index === '') {
                // إضافة جديد
                const newSupplier = [name, phone, email, products];
                sheetsAPI.appendSheet(SHEETS.SUPPLIERS, newSupplier).then(() => {
                    this.loadAllData();
                    this.closeModal('supplierModal');
                });
            } else {
                // تعديل
                const supplier = this.data.suppliers[parseInt(index) + 1];
                supplier[0] = name;
                supplier[1] = phone;
                supplier[2] = email;
                supplier[3] = products;
                sheetsAPI.writeSheet(SHEETS.SUPPLIERS, this.data.suppliers).then(() => {
                    this.loadAllData();
                    this.closeModal('supplierModal');
                });
            }
        }
    }

    confirmDelete(index, type) {
        document.getElementById('confirmMessage').textContent = `هل أنت متأكد من حذف هذا العنصر؟`;
        this.deleteCallback = () => {
            this.deleteItem(index, type);
        };
        this.openModal('confirmModal');
    }

    deleteItem(index, type) {
        const data = this.data[type];
        if (data && data[index + 1]) {
            data.splice(index + 1, 1);
            const sheetName = SHEETS[type.toUpperCase()];
            sheetsAPI.writeSheet(sheetName, data).then(() => {
                this.loadAllData();
            });
        }
    }

    updateReports() {
        const totalInventory = this.data.inventory.slice(1).reduce((sum, item) => sum + parseInt(item[2] || 0), 0);
        const totalSales = this.data.sales.slice(1).reduce((sum, sale) => sum + parseFloat(sale[5] || 0), 0);
        const totalCustomers = this.data.customers.slice(1).length;
        const totalSuppliers = this.data.suppliers.slice(1).length;
        
        document.getElementById('totalInventory').textContent = totalInventory;
        document.getElementById('totalSales').textContent = totalSales.toFixed(2) + ' ريال';
        document.getElementById('totalCustomers').textContent = totalCustomers;
        document.getElementById('totalSuppliers').textContent = totalSuppliers;
    }

    generateID() {
        return 'ID-' + Date.now();
    }
}

const app = new InventoryApp();
