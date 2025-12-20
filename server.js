// server.js
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('.')); // Serve static files from root

// Auto-ping function to keep Render alive
function startAutoPing() {
    const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes
    const SERVER_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
    
    async function pingServer() {
        try {
            console.log(`✅ Auto-ping at ${new Date().toISOString()}`);
        } catch (error) {
            console.warn(`⚠️ Auto-ping failed: ${error.message}`);
        }
    }
    
    // Start pinging after 1 minute, then every 14 minutes
    setTimeout(() => {
        pingServer();
        setInterval(pingServer, PING_INTERVAL);
    }, 60000);
    
    console.log(`🔄 Auto-ping system started (every ${PING_INTERVAL / 60000} minutes)`);
}

// Serve the main receipt generator page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Health check endpoint for auto-pinging
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 OPay Receipt Generator running on port ${PORT}`);
    console.log(`📱 Main app: http://localhost:${PORT}`);
    
    // Start auto-ping if on Render
    if (process.env.RENDER) {
        console.log('🌐 Render environment detected - starting auto-ping system');
        startAutoPing();
    } else {
        console.log('💻 Local environment - auto-ping disabled');
    }
});
