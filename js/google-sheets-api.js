// Google Sheets API Helper
class GoogleSheetsAPI {
    constructor() {
        this.isAuthorized = false;
        this.initClient();
    }

    initClient() {
        gapi.load('client:auth2', () => {
            gapi.client.init({
                apiKey: CONFIG.API_KEY,
                clientId: CONFIG.CLIENT_ID,
                discoveryDocs: CONFIG.DISCOVERY_DOCS,
                scopes: CONFIG.SCOPES
            }).then(() => {
                const auth2 = gapi.auth2.getAuthInstance();
                this.isAuthorized = auth2.isSignedIn.get();
                auth2.isSignedIn.listen((isSignedIn) => {
                    this.isAuthorized = isSignedIn;
                });
            }).catch(error => {
                console.error('Error initializing Google API:', error);
            });
        });
    }

    async signIn() {
        try {
            const auth2 = gapi.auth2.getAuthInstance();
            const user = await auth2.signIn();
            this.isAuthorized = true;
            return user;
        } catch (error) {
            console.error('Sign in error:', error);
        }
    }

    async signOut() {
        try {
            const auth2 = gapi.auth2.getAuthInstance();
            await auth2.signOut();
            this.isAuthorized = false;
        } catch (error) {
            console.error('Sign out error:', error);
        }
    }

    async readSheet(sheetName) {
        try {
            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: CONFIG.SPREADSHEET_ID,
                range: `${sheetName}!A:Z`
            });
            return response.result.values || [];
        } catch (error) {
            console.error('Error reading sheet:', error);
            return [];
        }
    }

    async writeSheet(sheetName, values) {
        try {
            const response = await gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: CONFIG.SPREADSHEET_ID,
                range: `${sheetName}!A:Z`,
                valueInputOption: 'USER_ENTERED',
                resource: { values: values }
            });
            return response.result;
        } catch (error) {
            console.error('Error writing to sheet:', error);
        }
    }

    async appendSheet(sheetName, values) {
        try {
            const response = await gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId: CONFIG.SPREADSHEET_ID,
                range: `${sheetName}!A:Z`,
                valueInputOption: 'USER_ENTERED',
                resource: { values: [values] }
            });
            return response.result;
        } catch (error) {
            console.error('Error appending to sheet:', error);
        }
    }

    async clearSheet(sheetName) {
        try {
            const response = await gapi.client.sheets.spreadsheets.values.clear({
                spreadsheetId: CONFIG.SPREADSHEET_ID,
                range: `${sheetName}!A:Z`
            });
            return response.result;
        } catch (error) {
            console.error('Error clearing sheet:', error);
        }
    }
}

const sheetsAPI = new GoogleSheetsAPI();