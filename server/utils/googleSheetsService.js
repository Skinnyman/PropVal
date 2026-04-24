const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

/**
 * Service Account Integration for Google Sheets API
 */

// Load the Service Account key
const KEY_FILE_PATH = path.join(__dirname, '..', 'service-account.json');

// Helper to check if key file exists
const isKeyFileAvailable = () => {
  return fs.existsSync(KEY_FILE_PATH);
};

// Initialize the Google Auth client
const getAuthClient = () => {
  // 1. Check if the JSON is provided via Environment Variable (for Render/Production)
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      return new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
    } catch (err) {
      console.error('[Google Sheets Service] Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON env variable:', err.message);
    }
  }

  // 2. Fallback to Local File (for Development)
  if (!isKeyFileAvailable()) {
    throw new Error('Google credentials missing. Set GOOGLE_SERVICE_ACCOUNT_JSON env variable or add service-account.json locally.');
  }

  return new google.auth.GoogleAuth({
    keyFile: KEY_FILE_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
};

/**
 * Extracts the Spreadsheet ID from a Google Sheets URL
 * @param {string} url 
 * @returns {string|null}
 */
const extractSpreadsheetId = (url) => {
  if (!url) return null;
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
};

/**
 * Fetches spreadsheet metadata (titles of all tabs)
 * @param {string} spreadsheetId 
 */
const getSpreadsheetMetadata = async (spreadsheetId) => {
  try {
    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });
    
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    // Return list of sheet names (tabs)
    return response.data.sheets.map(sheet => sheet.properties.title);
  } catch (err) {
    console.error('[Google Sheets Service Error]:', err.message);
    throw err;
  }
};

/**
 * Fetches all values from a specific sheet/tab
 * @param {string} spreadsheetId 
 * @param {string} sheetName 
 */
const getSheetValues = async (spreadsheetId, sheetName) => {
  try {
    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // Use a full range to get all data
    const range = `${sheetName}!A:Z`;
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    
    console.log(`[Google Sheets API] Successfully fetched ${rows ? rows.length : 0} rows from tab: ${sheetName}`);
    
    return rows || [];
  } catch (err) {
    console.error(`[Google Sheets Service Error] Tab: ${sheetName}:`, err.message);
    throw err;
  }
};

module.exports = {
  extractSpreadsheetId,
  getSpreadsheetMetadata,
  getSheetValues
};
