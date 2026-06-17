import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseCSV } from './utils/parser.js';
import { analyzeData } from './utils/analyzer.js';
import { generateMockData } from './utils/mockGenerator.js';

const app = express();
const PORT = process.env.PORT || 5001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.join(__dirname, '../../frontend/dist');

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve static assets from frontend build directory
app.use(express.static(frontendDistPath));

// Configure Multer for in-memory file storage
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

/**
 * Main analysis endpoint - processes two uploaded CSV files
 */
app.post('/api/analyze', upload.fields([
  { name: 'appsCsv', maxCount: 1 },
  { name: 'signinsCsv', maxCount: 1 }
]), (req, res) => {
  try {
    const files = req.files;
    
    if (!files || !files.appsCsv) {
      return res.status(400).json({ error: 'At least the App Registrations CSV file is required.' });
    }

    const appsBuffer = files.appsCsv[0].buffer.toString('utf-8');
    const apps = parseCSV(appsBuffer);

    let signIns = [];
    if (files.signinsCsv && files.signinsCsv[0]) {
      const signinsBuffer = files.signinsCsv[0].buffer.toString('utf-8');
      signIns = parseCSV(signinsBuffer);
    }

    const results = analyzeData(apps, signIns);
    res.json(results);
  } catch (error) {
    console.error('Error processing files:', error);
    res.status(500).json({ error: 'Failed to process files. Please check the CSV formats.' });
  }
});

/**
 * Demo endpoint - returns comprehensive pre-calculated mock data
 */
app.get('/api/demo', (req, res) => {
  try {
    const { apps, signIns } = generateMockData();
    const results = analyzeData(apps, signIns);
    res.json(results);
  } catch (error) {
    console.error('Error generating demo data:', error);
    res.status(500).json({ error: 'Failed to generate demo data.' });
  }
});

// Fallback all non-API requests to index.html (supporting SPA routing)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`AI Reporter Server running on port ${PORT}`);
});
