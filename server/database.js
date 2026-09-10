import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const dataDir = path.join(__dirname, 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'slopeguard.db');
console.log(`[SlopeGuard SQLite DB] Connecting to SQLite Database at: ${dbPath}`);

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// SHA-256 Hashing helper
export function hashPasswordSync(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Seed Demo Accounts
const DEMO_ACCOUNTS_SEED = [
  {
    User_ID: 'USR-ADM-001',
    Google_Sub: null,
    Name: 'Sreeja Unnam (Disaster Authority)',
    Email: 'sreejaunnam@gmail.com',
    Username: 'sreejaunnam',
    Password_hash: hashPasswordSync('Sreeja@123'),
    Role: 'admin',
    Title: 'Chief Disaster Officer, Sikkim SDMA',
    Village: 'Gangtok',
    District: 'Gangtok',
    Status: 'active',
    Is_Google_Account: 0,
    Picture: null
  },
  {
    User_ID: 'USR-ADM-002',
    Google_Sub: null,
    Name: 'Dr. Sonam Wangchuk',
    Email: 'admin@slopeguard.sikkim',
    Username: 'admin',
    Password_hash: hashPasswordSync('demo123'),
    Role: 'admin',
    Title: 'Disaster Management Officer',
    Village: 'Gangtok',
    District: 'Gangtok',
    Status: 'active',
    Is_Google_Account: 0,
    Picture: null
  },
  {
    User_ID: 'USR-RES-001',
    Google_Sub: null,
    Name: 'Tashi Bhutia',
    Email: 'resident@slopeguard.sikkim',
    Username: 'resident',
    Password_hash: hashPasswordSync('demo123'),
    Role: 'resident',
    Title: 'Resident Representative',
    Village: 'Gangtok',
    District: 'Gangtok',
    Status: 'active',
    Is_Google_Account: 0,
    Picture: null
  },
  {
    User_ID: 'USR-ADM-003',
    Google_Sub: null,
    Name: 'State SDMA Admin',
    Email: 'admin@slopeguard.gov.in',
    Username: 'sdma_admin',
    Password_hash: hashPasswordSync('admin123'),
    Role: 'admin',
    Title: 'Disaster Management Authority',
    Village: 'Gangtok',
    District: 'Gangtok',
    Status: 'active',
    Is_Google_Account: 0,
    Picture: null
  },
  {
    User_ID: 'USR-RES-002',
    Google_Sub: null,
    Name: 'Pema Lepcha',
    Email: 'pema.lepcha@mangan.res.in',
    Username: 'pema',
    Password_hash: hashPasswordSync('resident123'),
    Role: 'resident',
    Title: 'Village Head / Resident',
    Village: 'Mangan',
    District: 'Mangan',
    Status: 'active',
    Is_Google_Account: 0,
    Picture: null
  },
  {
    User_ID: 'USR-RES-003',
    Google_Sub: null,
    Name: 'Mingma Subba',
    Email: 'mingma.subba@pelling.res.in',
    Username: 'mingma',
    Password_hash: hashPasswordSync('resident123'),
    Role: 'resident',
    Title: 'Resident',
    Village: 'Pelling',
    District: 'Gyalshing',
    Status: 'active',
    Is_Google_Account: 0,
    Picture: null
  }
];

// Helper to parse CSV synchronously
function parseCSV(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`[SlopeGuard SQLite DB] CSV file not found: ${filePath}`);
    return [];
  }
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const parsed = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true
  });
  return parsed.data;
}

export function initDatabase() {
  console.log('[SlopeGuard SQLite DB] Initializing tables and schemas...');

  // 1. Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      google_sub TEXT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      username TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'resident',
      title TEXT,
      village TEXT,
      district TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      is_google_account INTEGER DEFAULT 0,
      picture TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // 2. Areas Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS areas (
      area_id TEXT PRIMARY KEY,
      state TEXT DEFAULT 'Sikkim',
      district TEXT,
      subdivision TEXT,
      block TEXT,
      village TEXT NOT NULL,
      road_name TEXT,
      latitude REAL,
      longitude REAL,
      risk_level TEXT DEFAULT 'LOW',
      soil_type TEXT,
      slope_angle_deg REAL,
      vegetation_cover TEXT,
      drainage_condition TEXT,
      monitoring_status TEXT DEFAULT 'Active',
      road_status TEXT DEFAULT 'Open',
      last_inspection_date TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // 3. Historical Landslides Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS historical_landslides (
      landslide_id TEXT PRIMARY KEY,
      area_id TEXT NOT NULL,
      village TEXT,
      district TEXT,
      date TEXT,
      trigger TEXT,
      road_affected TEXT,
      damage TEXT,
      fatalities INTEGER DEFAULT 0,
      source TEXT,
      latitude REAL,
      longitude REAL,
      created_at TEXT NOT NULL
    );
  `);

  // 4. Resident Contacts Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS resident_contacts (
      resident_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact_number TEXT,
      residential_area TEXT,
      village TEXT,
      district TEXT,
      emergency_contact TEXT,
      location TEXT,
      is_sample_data INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  // 5. Reports Table (with user_id for Per-user Data Isolation)
  db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      report_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      area_id TEXT NOT NULL,
      village TEXT,
      district TEXT,
      road_name TEXT,
      report_type TEXT NOT NULL,
      description TEXT,
      reporter_name TEXT,
      reporter_phone TEXT,
      reporter_email TEXT NOT NULL,
      image_url TEXT,
      status TEXT DEFAULT 'pending',
      note TEXT,
      ai_analysis_json TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // 6. Alerts Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      area_id TEXT,
      village TEXT,
      road TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_simulated INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  // --- SEED INITIAL DATA IF TABLES ARE EMPTY ---

  // Seed Users
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    console.log('[SlopeGuard SQLite DB] Seeding initial users...');
    const insertUser = db.prepare(`
      INSERT INTO users (user_id, google_sub, name, email, username, password_hash, role, title, village, district, status, is_google_account, picture, created_at)
      VALUES (@User_ID, @Google_Sub, @Name, @Email, @Username, @Password_hash, @Role, @Title, @Village, @District, @Status, @Is_Google_Account, @Picture, @Created_At)
    `);

    const insertManyUsers = db.transaction((users) => {
      for (const u of users) {
        insertUser.run({
          ...u,
          Created_At: new Date().toISOString()
        });
      }
    });

    insertManyUsers(DEMO_ACCOUNTS_SEED);
  }

  // Seed Areas
  const areaCount = db.prepare('SELECT COUNT(*) as count FROM areas').get().count;
  if (areaCount === 0) {
    console.log('[SlopeGuard SQLite DB] Seeding areas from CSV...');
    const areaCSVPath = path.join(rootDir, 'data', 'sikkim_area_data.csv');
    const areaRows = parseCSV(areaCSVPath);

    const insertArea = db.prepare(`
      INSERT INTO areas (area_id, state, district, subdivision, block, village, road_name, latitude, longitude, risk_level, soil_type, slope_angle_deg, vegetation_cover, drainage_condition, monitoring_status, road_status, last_inspection_date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertManyAreas = db.transaction((rows) => {
      for (const r of rows) {
        insertArea.run(
          r.Area_ID,
          r.State || 'Sikkim',
          r.District,
          r.Subdivision,
          r.Block,
          r.Village,
          r.Road_Name,
          r.Latitude,
          r.Longitude,
          r.Risk_Level,
          r.Soil_Type,
          r.Slope_Angle_deg,
          r.Vegetation_Cover,
          r.Drainage_Condition,
          r.Monitoring_Status || 'Active',
          r.Road_Status || 'Open',
          r.Last_Inspection_Date || new Date().toISOString().split('T')[0],
          new Date().toISOString()
        );
      }
    });

    insertManyAreas(areaRows);
  }

  // Seed Historical Landslides
  const landslideCount = db.prepare('SELECT COUNT(*) as count FROM historical_landslides').get().count;
  if (landslideCount === 0) {
    console.log('[SlopeGuard SQLite DB] Seeding historical landslides from CSV...');
    const lsCSVPath = path.join(rootDir, 'data', 'sikkim_landslide_history.csv');
    const lsRows = parseCSV(lsCSVPath);

    const insertLs = db.prepare(`
      INSERT INTO historical_landslides (landslide_id, area_id, village, district, date, trigger, road_affected, damage, fatalities, source, latitude, longitude, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertManyLs = db.transaction((rows) => {
      for (const r of rows) {
        insertLs.run(
          r.Landslide_ID,
          r.Area_ID,
          r.Village,
          r.District,
          r.Date,
          r.Trigger,
          r.Road_Affected,
          r.Damage,
          r.Fatalities || 0,
          r.Source,
          r.Latitude === 'NOT_REPORTED' ? null : r.Latitude,
          r.Longitude === 'NOT_REPORTED' ? null : r.Longitude,
          new Date().toISOString()
        );
      }
    });

    insertManyLs(lsRows);
  }

  // Seed Resident Contacts
  const residentCount = db.prepare('SELECT COUNT(*) as count FROM resident_contacts').get().count;
  if (residentCount === 0) {
    console.log('[SlopeGuard SQLite DB] Seeding sample resident contacts mapped to Sikkim areas...');
    const areas = db.prepare('SELECT * FROM areas').all();
    const firstNames = ['Tashi', 'Pema', 'Mingma', 'Karma', 'Sonam', 'Dorjee', 'Passang', 'Dawa', 'Bikash', 'Sita'];
    const lastNames = ['Bhutia', 'Lepcha', 'Pradhan', 'Chettri', 'Subba', 'Gurung', 'Tamang', 'Rai', 'Sharma', 'Karki'];

    const insertRes = db.prepare(`
      INSERT INTO resident_contacts (resident_id, name, contact_number, residential_area, village, district, emergency_contact, location, is_sample_data, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertManyRes = db.transaction((areasList) => {
      areasList.forEach((area, idx) => {
        const name = `${firstNames[idx % firstNames.length]} ${lastNames[(idx * 3) % lastNames.length]}`;
        insertRes.run(
          `RES-SK-${(idx + 1).toString().padStart(3, '0')}`,
          name,
          `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
          area.road_name || 'Main Village Road',
          area.village,
          area.district,
          `+91 97${Math.floor(10000000 + Math.random() * 90000000)}`,
          `${area.latitude}, ${area.longitude}`,
          1,
          new Date().toISOString()
        );
      });
    });

    insertManyRes(areas);
  }

  // Seed Initial Alerts
  const alertCount = db.prepare('SELECT COUNT(*) as count FROM alerts').get().count;
  if (alertCount === 0) {
    console.log('[SlopeGuard SQLite DB] Seeding initial alerts...');
    const initialAlerts = [
      {
        id: 'ALT-101',
        type: 'CRITICAL',
        area_id: 'SK-009',
        village: 'Mangan',
        road: 'NH-10',
        title: '🚨 CRITICAL: High Moisture & Historical Debris Slump near Mangan (NH-10)',
        message: 'Sensors detect rising soil moisture (88%) near Mangan on NH-10. Historically, this area experienced major landslides dating back to 1957. Restricted heavy vehicle movement advised.',
        is_simulated: 1,
        created_at: new Date().toISOString()
      },
      {
        id: 'ALT-102',
        type: 'HIGH',
        area_id: 'SK-010',
        village: 'Chungthang',
        road: 'NH-310A',
        title: '⚠️ HIGH RISK: Chungthang - NH-310A Restricted Corridor',
        message: 'Active water accumulation and steep terrain instability. Historical NIDM records note major historical events (1983, 1997) in this sector. Monitor closely.',
        is_simulated: 1,
        created_at: new Date(Date.now() - 3600000 * 3).toISOString()
      },
      {
        id: 'ALT-103',
        type: 'HIGH',
        area_id: 'SK-022',
        village: 'Pelling',
        road: 'Pelling Road',
        title: '⚠️ ROAD WARNING: Singtam-Dikchu Road / Pelling Sector Active Monitoring',
        message: 'Correlating 2024 press release records (Singtam-Dikchu event). Road accessibility compromised in nearby sectors.',
        is_simulated: 1,
        created_at: new Date(Date.now() - 3600000 * 8).toISOString()
      }
    ];

    const insertAlert = db.prepare(`
      INSERT INTO alerts (id, type, area_id, village, road, title, message, is_simulated, created_at)
      VALUES (@id, @type, @area_id, @village, @road, @title, @message, @is_simulated, @created_at)
    `);

    const insertManyAlerts = db.transaction((alerts) => {
      for (const a of alerts) insertAlert.run(a);
    });

    insertManyAlerts(initialAlerts);
  }

  console.log('[SlopeGuard SQLite DB] Database initialization complete.');
}

export default db;
