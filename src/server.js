const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const mikrotikRoutes = require('../routes/mikrotik');

const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

app.use('/api', mikrotikRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// WiFi Planner route
app.get('/wifi-planner', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/wifi-planner/index.html'));
});

// Serve WiFi Planner static files
app.use('/wifi-planner', express.static(path.join(__dirname, '../public/wifi-planner')));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Guardian Relay server running on http://0.0.0.0:${PORT}`);
});

module.exports = app;