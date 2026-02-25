const XLSX = require('xlsx');

const workbook = XLSX.readFile('/Users/lithinknasani/Documents/GitHub/MorTendance/EASTERN_2026_DATABASE.xlsx');
console.log('Sheet Names:', workbook.SheetNames);

workbook.SheetNames.forEach(sheetName => {
    if (sheetName.toLowerCase().includes('doxa') || sheetName.toLowerCase().includes('pal')) {
        console.log(`\n=== Sheet: ${sheetName} ===`);
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        console.log('Sample rows (first 10):');
        data.slice(0, 10).forEach((row, i) => {
            console.log(`${i}: ${JSON.stringify(row)}`);
        });
    }
});
