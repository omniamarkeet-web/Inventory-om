# خطوات الإعداد

## 1. إنشاء مشروع Google Cloud

1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com/)
2. أنشئ مشروع جديد
3. فعّل Google Sheets API:
   - ابحث عن "Google Sheets API"
   - انقر على "Enable"

## 2. إنشاء بيانات الاعتماد (Credentials)

### للتطوير المحلي (Web Application):
1. اذهب إلى "Credentials"
2. اختر "Create Credentials" → "OAuth 2.0 Client ID"
3. اختر "Web application"
4. أضف URIs المصرح بها:
   - `http://localhost:8000` (للتطوير المحلي)
   - رابط موقعك النهائي
5. انسخ Client ID و API Key

### للتطبيق الويب:
1. أنشئ Service Account:
   - "Create Credentials" → "Service Account"
   - انسخ البيانات الخاصة به

## 3. إنشاء Google Sheet

1. اذهب إلى [Google Sheets](https://sheets.google.com/)
2. أنشئ spreadsheet جديد
3. أنسخ الـ Spreadsheet ID من الرابط
4. أنشئ sheets بهذه الأسماء:
   - المخزون
   - المبيعات
   - العملاء
   - الموردين
   - التقارير

## 4. تحديث config.js

في ملف `js/config.js`:

```javascript
const CONFIG = {
    CLIENT_ID: 'YOUR_CLIENT_ID.apps.googleusercontent.com', // أدخل Client ID
    API_KEY: 'YOUR_API_KEY', // أدخل API Key
    SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID', // أدخل معرف الجدول
    SCOPES: 'https://www.googleapis.com/auth/spreadsheets',
    DISCOVERY_DOCS: [
        'https://sheets.googleapis.com/$discovery/rest?version=v4'
    ]
};
```

## 5. تشغيل التطبيق

### استخدام Python:
```bash
python -m http.server 8000
```

### أو استخدام Node.js:
```bash
npx http-server
```

ثم افتح المتصفح على `http://localhost:8000`

## 6. الخطوات الإضافية

### إضافة صفوف الرؤوس في Google Sheets:
في كل sheet، أضف الرؤوس في الصف الأول:

**المخزون:**
| رقم المنتج | الاسم | الكمية | السعر |

**المبيعات:**
| رقم المبيعة | العميل | المنتج | الكمية | الإجمالي | التاريخ |

**العملاء:**
| الاسم | الهاتف | البريد الإلكتروني | العنوان |

**الموردين:**
| الاسم | الهاتف | البريد الإلكتروني | المنتجات |

## الميزات المتقدمة (قريباً)

- [ ] نماذج أفضل لإضافة/تعديل البيانات
- [ ] طباعة الفواتير
- [ ] التقارير المتقدمة والرسوم البيانية
- [ ] النسخ الاحتياطية التلقائية
- [ ] التحقق من البيانات
- [ ] تصفية وفرز متقدم
