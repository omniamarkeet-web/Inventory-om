// Google Sheets Configuration
const CONFIG = {
    // استبدل بـ Client ID الخاص بك من Google Cloud Console
    CLIENT_ID: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
    API_KEY: 'YOUR_API_KEY',
    SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID',
    SCOPES: 'https://www.googleapis.com/auth/spreadsheets',
    DISCOVERY_DOCS: [
        'https://sheets.googleapis.com/$discovery/rest?version=v4'
    ]
};

// Sheet names في Google Sheets
const SHEETS = {
    INVENTORY: 'المخزون',
    SALES: 'المبيعات',
    CUSTOMERS: 'العملاء',
    SUPPLIERS: 'الموردين',
    REPORTS: 'التقارير'
};