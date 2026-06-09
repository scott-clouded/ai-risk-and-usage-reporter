/**
 * Parses raw CSV string into an array of objects mapping headers to row values
 */
export function parseCSV(csvText) {
  if (!csvText) return [];
  const lines = csvText.split(/\r?\n/);
  if (lines.length === 0) return [];

  // Find first non-empty line as header
  let headerIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim()) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) return [];

  const headers = parseCSVLine(lines[headerIndex]);
  const results = [];

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(line);
    
    const row = {};
    headers.forEach((header, index) => {
      const cleanHeader = header.trim().replace(/^"|"$/g, '');
      const rawValue = values[index] !== undefined ? values[index] : '';
      row[cleanHeader] = rawValue.trim().replace(/^"|"$/g, '').replace(/""/g, '"');
    });
    results.push(row);
  }
  return results;
}

/**
 * Splits a single CSV line taking quotes into account
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      current += char; // Keep quotes, we clean them in parseCSV
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
