// Force Vercel bundler to include all backend files in the serverless function
require('../backend/config/db');
require('../backend/routes/studentRoutes');
require('../backend/routes/authRoutes');
require('../backend/routes/jobRoutes');
require('../backend/routes/companyRoutes');
require('../backend/routes/adminRoutes');
require('../backend/routes/placementRoutes');
require('../backend/models/Student');
require('../backend/models/Company');
require('../backend/models/Job');
require('../backend/models/Admin');
require('../backend/models/Application');
require('../backend/models/Employee');
require('../backend/models/PlacementUpdate');

const app = require('../backend/server');

module.exports = app;



