require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const { startScheduler } = require('./scheduler/cronJob');

require('./models/Post');
require('./models/Setting');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/generate', require('./routes/generate'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/settings', require('./routes/settings'));

const PORT = process.env.PORT || 3001;

sequelize.sync().then(() => {
  app.listen(PORT, () => console.log(`[Server] Running on http://localhost:${PORT}`));
  startScheduler();
});
