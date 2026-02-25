const XLSX = require('xlsx');

const workbook = XLSX.readFile('/Users/lithinknasani/Documents/GitHub/MorTendance/EASTERN_2026_DATABASE.xlsx');
console.log('Sheet Names:', workbook.SheetNames);

workbook.SheetNames.forEach(sheetName => {
    console.log(`\n--- ${sheetName} ---`);
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log('Sample data (first 5 rows):');
    data.slice(0, 5).forEach(row => {
        console.log(JSON.stringify(row));
    });
});
