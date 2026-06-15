// نظام POS متقدم مع باركود
let products = [], customers = [], suppliers = [], salesInvoices = [], purchaseInvoices = [], transactions = [], cart = [];
let exchangeRate = 13000, taxRate = 15;
let html5QrCode = null;
let isScannerActive = false;

function loadFromLocal() {
    products = JSON.parse(localStorage.getItem("pos_products") || "[]");
    customers = JSON.parse(localStorage.getItem("pos_customers") || "[]");
    suppliers = JSON.parse(localStorage.getItem("pos_suppliers") || "[]");
    salesInvoices = JSON.parse(localStorage.getItem("pos_salesInvoices") || "[]");
    purchaseInvoices = JSON.parse(localStorage.getItem("pos_purchaseInvoices") || "[]");
    transactions = JSON.parse(localStorage.getItem("pos_transactions") || "[]");
    exchangeRate = parseFloat(localStorage.getItem("pos_exchangeRate") || "13000");
    taxRate = parseFloat(localStorage.getItem("pos_taxRate") || "15");
    
    let exchangeInput = document.getElementById("exchangeRate");
    let taxInput = document.getElementById("taxRate");
    let taxDisplay = document.getElementById("taxRateDisplay");
    
    if(exchangeInput) exchangeInput.value = exchangeRate;
    if(taxInput) taxInput.value = taxRate;
    if(taxDisplay) taxDisplay.innerText = taxRate;
    
    if(products.length === 0) {
        products = [
            { id: "1", name: "كوكا كولا", price: 2500, barcode: "12345" },
            { id: "2", name: "شيبس", price: 1500, barcode: "67890" },
            { id: "3", name: "شوكولاتة", price: 3000, barcode: "11111" },
            { id: "4", name: "عصير برتقال", price: 4000, barcode: "22222" }
        ];
    }
    if(customers.length === 0) {
        customers = [{ id: "c1", name: "عميل تجريبي", phone: "0500000000", balanceUSD: 0 }];
    }
    if(suppliers.length === 0) {
        suppliers = [{ id: "s1", name: "مورد تجريبي", phone: "0555555555", currency: "SYP", balance: 0 }];
    }
    saveToLocal();
}

function saveToLocal() {
    localStorage.setItem("pos_products", JSON.stringify(products));
    localStorage.setItem("pos_customers", JSON.stringify(customers));
    localStorage.setItem("pos_suppliers", JSON.stringify(suppliers));
    localStorage.setItem("pos_salesInvoices", JSON.stringify(salesInvoices));
    localStorage.setItem("pos_purchaseInvoices", JSON.stringify(purchaseInvoices));
    localStorage.setItem("pos_transactions", JSON.stringify(transactions));
    localStorage.setItem("pos_exchangeRate", exchangeRate);
    localStorage.setItem("pos_taxRate", taxRate);
}

loadFromLocal();

function getCartBaseSYP() {
    return cart.reduce((s,i) => s + (i.price * i.quantity), 0);
}

function updateCartUI() {
    let subtotalSYP = getCartBaseSYP();
    let taxSYP = subtotalSYP * (taxRate/100);
    document.getElementById("subtotal").innerText = subtotalSYP.toFixed(2);
    document.getElementById("taxAmount").innerText = taxSYP.toFixed(2);
    document.getElementById("totalPrice").innerText = (subtotalSYP + taxSYP).toFixed(2);
}

function renderCart() {
    let container = document.getElementById("cartItems");
    if(!container) return;
    if(!cart.length) {
        container.innerHTML="<p style='text-align:center; color:#999;'>السلة فارغة</p>";
        updateCartUI();
        return;
    }
    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div style="flex:1;">${item.name}<br><small>${item.price} ل.س</small></div>
            <div style="display:flex; gap:4px; align-items:center;">
                <button class="qty-minus" data-id="${item.id}" style="padding:3px 8px;">-</button>
                <span style="min-width:20px; text-align:center;">${item.quantity}</span>
                <button class="qty-plus" data-id="${item.id}" style="padding:3px 8px;">+</button>
                <button class="remove-item" data-id="${item.id}" style="padding:3px 8px;">✖</button>
            </div>
        </div>
    `).join('');
    
    document.querySelectorAll(".qty-minus").forEach(btn=>{
        btn.onclick=()=>changeQty(btn.dataset.id,-1);
    });
    document.querySelectorAll(".qty-plus").forEach(btn=>{
        btn.onclick=()=>changeQty(btn.dataset.id,1);
    });
    document.querySelectorAll(".remove-item").forEach(btn=>{
        btn.onclick=()=>{
            cart=cart.filter(i=>i.id!==btn.dataset.id);
            renderCart();
        };
    });
    updateCartUI();
}

function changeQty(id,delta) {
    let item=cart.find(i=>i.id===id);
    if(item) {
        item.quantity+=delta;
        if(item.quantity<=0) cart=cart.filter(i=>i.id!==id);
        renderCart();
    }
}

function addToCart(product) {
    let existing=cart.find(i=>i.id===product.id);
    if(existing) existing.quantity++;
    else cart.push({...product,quantity:1});
    renderCart();
}

function finalizeSale(itemsArray, discountPercent, saleType, currency, customerId) {
    if(!itemsArray.length) {
        alert("لا توجد منتجات");
        return false;
    }
    let baseSYP = itemsArray.reduce((s,i)=> s + (i.price * i.quantity), 0);
    let discountedSYP = baseSYP * (1 - discountPercent/100);
    let amountInCurr = (currency === 'USD') ? discountedSYP / exchangeRate : discountedSYP;
    let taxValue = amountInCurr * (taxRate/100);
    let grandTotal = amountInCurr + taxValue;
    
    let invoice = {
        id: Date.now(),
        date: new Date().toLocaleString('ar-SA'),
        customerId: customerId || null,
        saleType: saleType,
        items: itemsArray.map(i=>({id:i.id, name:i.name, price:i.price, quantity:i.quantity})),
        subtotal: amountInCurr,
        tax: taxValue,
        grandTotal: grandTotal,
        currency: currency,
        taxRate: taxRate,
        discountPercent: discountPercent
    };
    salesInvoices.unshift(invoice);
    saveToLocal();
    renderSalesInvoices();
    renderStats();
    alert(`✅ تم البيع: ${grandTotal.toFixed(2)} ${currency}`);
    return true;
}

function renderCustomers() {
    let container=document.getElementById("customersList");
    if(!container) return;
    container.innerHTML=customers.length === 0 ? "<p>لا توجد عملاء</p>" : customers.map(c=>`<div class="customer-card">👤 ${c.name}<br>📱 ${c.phone}<br>رصيد: ${c.balanceUSD} USD</div>`).join('');
}

function renderSuppliers() {
    let container=document.getElementById("suppliersList");
    if(!container) return;
    container.innerHTML=suppliers.length === 0 ? "<p>لا توجد موردين</p>" : suppliers.map(s=>`<div class="supplier-card">🏢 ${s.name}<br>📱 ${s.phone}<br>رصيد: ${s.balance} ${s.currency}</div>`).join('');
}

function renderSalesInvoices() {
    let container=document.getElementById("salesInvoicesList");
    if(!container) return;
    container.innerHTML=salesInvoices.length === 0 ? "<p>لا توجد فواتير بيع</p>" : salesInvoices.map(inv=>`<div class="invoice-item">📄 #${inv.id}<br>${inv.grandTotal.toFixed(2)} ${inv.currency}<br>📅 ${inv.date}</div>`).join('');
}

function renderPurchaseInvoices() {
    let container=document.getElementById("purchaseInvoicesList");
    if(!container) return;
    container.innerHTML=purchaseInvoices.length === 0 ? "<p>لا توجد فواتير شراء</p>" : purchaseInvoices.map(inv=>`<div class="invoice-item">📋 فاتورة شراء #${inv.id}<br>${inv.amount} ${inv.currency}<br>📅 ${inv.date}</div>`).join('');
}

function renderStats() {
    let container=document.getElementById("statsContent");
    if(!container) return;
    let salesSYP=salesInvoices.filter(i=>i.currency==='SYP').reduce((s,i)=>s+i.grandTotal,0);
    let salesUSD=salesInvoices.filter(i=>i.currency==='USD').reduce((s,i)=>s+i.grandTotal,0);
    container.innerHTML=`
        <div style="background:#f8fafc; padding:12px; border-radius:12px; margin-bottom:12px;">
            💰 مبيعات ليرة: <strong>${salesSYP.toFixed(2)} ل.س</strong>
        </div>
        <div style="background:#f8fafc; padding:12px; border-radius:12px; margin-bottom:12px;">
            💵 مبيعات دولار: <strong>${salesUSD.toFixed(2)} USD</strong>
        </div>
        <div style="background:#f8fafc; padding:12px; border-radius:12px; margin-bottom:12px;">
            📊 سعر الصرف: <strong>${exchangeRate} ل.س</strong>
        </div>
        <div style="background:#f8fafc; padding:12px; border-radius:12px;">
            📈 إجمالي الفواتير: <strong>${salesInvoices.length}</strong>
        </div>
    `;
}

function renderProductsGrid() {
    let container=document.getElementById("productsList");
    if(!container) return;
    container.innerHTML=products.length === 0 ? "<p>لا توجد منتجات</p>" : products.map(p=>`<div class="product-card" data-id="${p.id}"><strong>${p.name}</strong><br>💵 ${p.price} ل.س<br><small>🔖 ${p.barcode||'--'}</small></div>`).join('');
    document.querySelectorAll(".product-card").forEach(card=>{
        card.onclick=()=>{
            let p=products.find(pr=>pr.id===card.dataset.id);
            if(p) addToCart(p);
        };
    });
}

function renderManageProducts() {
    let container=document.getElementById("manageProductsList");
    if(!container) return;
    container.innerHTML=products.length === 0 ? "<p>لا توجد منتجات</p>" : products.map(p=>`<div class="product-card"><strong>${p.name}</strong><br>${p.price} ل.س<br><button onclick="deleteProduct('${p.id}')" style="background:#ff6b6b; color:white;">🗑️ حذف</button></div>`).join('');
}

function deleteProduct(id) {
    if(confirm("هل تريد حذف هذا المنتج؟")) {
        products=products.filter(p=>p.id!==id);
        saveToLocal();
        renderManageProducts();
        renderProductsGrid();
        alert("✅ تم الحذف");
    }
}

async function startScanner() {
    if (isScannerActive) {
        alert("⚠️ الماسح الضوئي يعمل بالفعل");
        return;
    }
    
    const existing = document.querySelector('.scanner-container');
    if(existing) existing.remove();
    
    const container = document.createElement('div');
    container.className = 'scanner-container';
    container.innerHTML = `
        <div id="scanner-video" style="width:90%; max-width:500px;"></div>
        <div id="scanner-message" style="color:white; margin-top:12px; text-align:center; font-size:16px;"></div>
        <div style="margin-top:20px;">
            <button class="close-scanner">❌ إغلاق</button>
            <button class="retry-scanner" style="background:#f97316;">🔄 إعادة المحاولة</button>
        </div>
    `;
    document.body.appendChild(container);
    
    const msgDiv = container.querySelector('#scanner-message');
    msgDiv.innerText = "⏳ جارٍ تهيئة الكاميرا...";
    
    try {
        if (typeof Html5Qrcode === 'undefined') {
            throw new Error("مكتبة المسح لم تحمل بشكل صحيح");
        }
        
        html5QrCode = new Html5Qrcode("scanner-video");
        const devices = await Html5Qrcode.getCameras();
        let cameraId = null;
        if (devices && devices.length) {
            cameraId = devices[0].id;
        }
        
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        await html5QrCode.start(
            cameraId ? { deviceId: { exact: cameraId } } : { facingMode: "environment" },
            config,
            (decodedText) => {
                let product = products.find(p => p.barcode === decodedText);
                if(product) {
                    addToCart(product);
                    msgDiv.innerText = `✅ تم إضافة: ${product.name}`;
                    setTimeout(() => stopScanner(), 1500);
                } else {
                    msgDiv.innerText = `❌ باركود غير موجود: ${decodedText}`;
                }
            },
            (errorMessage) => {}
        );
        
        isScannerActive = true;
        msgDiv.innerText = "📷 الكاميرا جاهزة - وجه الباركود نحو الكاميرا";
    } catch (err) {
        console.error(err);
        msgDiv.innerHTML = `<span style="color:#ffaaaa;">⚠️ خطأ: ${err.message}</span>`;
        isScannerActive = false;
    }
    
    container.querySelector('.close-scanner').onclick = () => stopScanner();
    container.querySelector('.retry-scanner').onclick = () => { stopScanner(); setTimeout(() => startScanner(), 100); };
}

function stopScanner() {
    if (html5QrCode && isScannerActive) {
        html5QrCode.stop().then(() => {
            isScannerActive = false;
            const container = document.querySelector('.scanner-container');
            if(container) container.remove();
            html5QrCode = null;
        }).catch(e => console.warn);
    } else {
        const container = document.querySelector('.scanner-container');
        if(container) container.remove();
        isScannerActive = false;
    }
}

function manualBarcodeEntry() {
    let code = prompt("📱 أدخل الباركود يدوياً:");
    if(code && code.trim() !== "") {
        let product = products.find(p => p.barcode === code.trim());
        if(product) {
            addToCart(product);
            alert(`✅ تم إضافة: ${product.name}`);
        } else {
            alert(`❌ الباركود غير موجود: "${code}"`);
        }
    }
}

function showCheckoutModal() {
    if(!cart.length) {
        alert("❌ السلة فارغة");
        return;
    }
    let method = confirm("🛒 طريقة الدفع:\n✅ موافق = أجل (دولار USD)\n❌ إلغاء = نقدي (ليرة SYP)");
    let saleType = method ? 'credit' : 'cash';
    let currency = saleType === 'credit' ? 'USD' : 'SYP';
    let custId = null;
    
    if(saleType === 'credit') {
        let names = customers.map(c=>`${c.name} (${c.id})`).join('\n');
        custId = prompt(`👤 اختر عميل:\n${names}\n\nأدخل معرف العميل:`, customers[0]?.id);
        let cust = customers.find(c=>c.id===custId);
        if(!cust) {
            alert("❌ عميل غير موجود");
            return;
        }
    }
    
    let success = finalizeSale(cart, 0, saleType, currency, custId);
    if(success) {
        cart = [];
        renderCart();
    }
}

function saveSettings() {
    exchangeRate=parseFloat(document.getElementById("exchangeRate").value);
    taxRate=parseFloat(document.getElementById("taxRate").value);
    saveToLocal();
    updateCartUI();
    renderStats();
    document.getElementById("taxRateDisplay").innerText=taxRate;
    alert("✅ تم حفظ الإعدادات");
}

function updateSupplierSelect() {
    let supSel = document.getElementById('supplierSelect');
    if(supSel) supSel.innerHTML = '<option value="">اختر ا��مورد</option>' + suppliers.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');
}

window.onload = () => {
    document.getElementById('saveSettingsBtn').onclick = saveSettings;
    document.getElementById('clearCartBtn').onclick = () => { cart=[]; renderCart(); };
    document.getElementById('checkoutBtn').onclick = showCheckoutModal;
    document.getElementById('quickSaleHeaderBtn').onclick = () => alert("⚡ البيع السريع:\n1. أضف المنتجات من القائمة\n2. انقر إتمام البيع\n3. اختر طريقة الدفع");
    document.getElementById('scanBarcodeBtn').onclick = () => startScanner();
    document.getElementById('manualBarcodeBtn').onclick = () => manualBarcodeEntry();
    
    document.getElementById('addProductBtn').onclick = () => {
        let n=document.getElementById('prodName').value.trim();
        let p=parseFloat(document.getElementById('prodPrice').value);
        let b=document.getElementById('prodBarcode').value.trim();
        if(!n||isNaN(p)) {
            alert('❌ يرجى ملء جميع الحقول المطلوبة');
            return;
        }
        products.push({id:Date.now().toString(),name:n,price:p,barcode:b});
        saveToLocal();
        renderProductsGrid();
        renderManageProducts();
        document.getElementById('prodName').value='';
        document.getElementById('prodPrice').value='';
        document.getElementById('prodBarcode').value='';
        alert('✅ تم إضافة المنتج');
    };
    
    document.getElementById('addCustomerBtn').onclick = () => {
        let n=document.getElementById('customerName').value.trim();
        let ph=document.getElementById('customerPhone').value.trim();
        let bal=parseFloat(document.getElementById('customerBalance').value)||0;
        if(!n) {
            alert('❌ أدخل اسم العميل');
            return;
        }
        customers.push({id:Date.now().toString(),name:n,phone:ph,balanceUSD:bal});
        saveToLocal();
        renderCustomers();
        updateSupplierSelect();
        document.getElementById('customerName').value='';
        document.getElementById('customerPhone').value='';
        document.getElementById('customerBalance').value='';
        alert('✅ تم إضافة العميل');
    };
    
    document.getElementById('addSupplierBtn').onclick = () => {
        let n=document.getElementById('supplierName').value.trim();
        let ph=document.getElementById('supplierPhone').value.trim();
        let cur=document.getElementById('supplierCurrency').value;
        let bal=parseFloat(document.getElementById('supplierBalance').value)||0;
        if(!n) {
            alert('❌ أدخل اسم المورد');
            return;
        }
        suppliers.push({id:Date.now().toString(),name:n,phone:ph,currency:cur,balance:bal});
        saveToLocal();
        renderSuppliers();
        updateSupplierSelect();
        document.getElementById('supplierName').value='';
        document.getElementById('supplierPhone').value='';
        document.getElementById('supplierBalance').value='';
        alert('✅ تم إضافة المورد');
    };
    
    document.getElementById('addPurchaseInvoiceBtn').onclick = () => {
        let sid=document.getElementById('supplierSelect').value;
        let amt=parseFloat(document.getElementById('purchaseAmount').value);
        if(!sid||isNaN(amt)||amt<=0) {
            alert('❌ يرجى اختيار مورد وإدخال مبلغ صحيح');
            return;
        }
        let sup=suppliers.find(s=>s.id===sid);
        if(!sup) return;
        purchaseInvoices.push({id:Date.now(),date:new Date().toLocaleString('ar-SA'),supplierId:sid,amount:amt,currency:sup.currency});
        saveToLocal();
        renderPurchaseInvoices();
        document.getElementById('purchaseAmount').value='';
        alert('✅ تم تسجيل الفاتورة');
    };
    
    document.querySelectorAll('.tab-btn').forEach(btn=>{
        btn.onclick=()=>{
            document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active-panel'));
            document.getElementById(btn.dataset.tab+'Panel').classList.add('active-panel');
            document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
            btn.classList.add('active');
            if(btn.dataset.tab==='products') renderManageProducts();
            if(btn.dataset.tab==='invoices') { renderSalesInvoices(); renderPurchaseInvoices(); }
            if(btn.dataset.tab==='reports') renderStats();
        };
    });
    
    updateSupplierSelect();
    renderProductsGrid();
    renderCart();
    renderManageProducts();
    renderCustomers();
    renderSuppliers();
    renderSalesInvoices();
    renderPurchaseInvoices();
    renderStats();
    updateCartUI();
    console.log("✅ نظام POS تم تحميله بنجاح!");
};
