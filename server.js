// server.js - COMPLETE WITH ALL WATERMARKS
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Middleware
app.use(express.json());
app.use(express.static('.'));
app.use('/public', express.static('public'));

// Create directories
if (!fs.existsSync('public')) {
    fs.mkdirSync('public', { recursive: true });
}

// ========== YOUR BROWSERLESS API KEYS ==========
const BROWSERLESS_KEYS = [
    '2Te50l7PwKA1D4B5a4ca0123ed8cb1a0d0191f351f1b26885',  // First key
    '2Te56KAYSiaLqcPb4bb943ae2c05b1332443f30ac6738bbb4'   // Second key
];

let keyUsage = {};
BROWSERLESS_KEYS.forEach(key => {
    keyUsage[key] = { count: 0, errors: 0 };
});

// ========== AUTO-PING FUNCTION ==========
function startAutoPing() {
    const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;
    
    if (!RENDER_EXTERNAL_URL) {
        console.log('💻 Local environment - auto-ping disabled');
        return;
    }
    
    const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes
    const SERVICE_URL = RENDER_EXTERNAL_URL;
    
    console.log(`🌐 Render detected: ${SERVICE_URL}`);
    
    async function pingServer() {
        try {
            await fetch(`${SERVICE_URL}/health`, { timeout: 10000 });
            console.log(`✅ Auto-ping successful at ${new Date().toLocaleTimeString()}`);
        } catch (error) {
            console.warn(`⚠️ Auto-ping failed: ${error.message}`);
        }
    }
    
    setTimeout(() => {
        console.log(`🔄 Auto-ping started (every 14 minutes)`);
        pingServer();
        setInterval(pingServer, PING_INTERVAL);
    }, 60000);
}

// ========== YOUR ORIGINAL RECEIPT FUNCTIONS ==========
function formatAccountNumber(account) {
    if (account.length >= 6) {
        const firstThree = account.substring(0, 3);
        const lastThree = account.substring(account.length - 3);
        const stars = '*'.repeat(account.length - 6);
        return firstThree + stars + lastThree;
    }
    return account;
}

function formatAmount(amount) {
    return parseFloat(amount).toLocaleString('en-NG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function generateTransactionNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}${random}`;
}

function formatNigeriaDate(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const suffix = (day % 10 === 1 && day !== 11) ? 'st' :
                  (day % 10 === 2 && day !== 12) ? 'nd' :
                  (day % 10 === 3 && day !== 13) ? 'rd' : 'th';
    return `${month} ${day}${suffix}, ${year} ${hours}:${minutes}:${seconds}`;
}

function getBestAPIKey() {
    const availableKeys = BROWSERLESS_KEYS.filter(key => keyUsage[key].errors < 5);
    if (availableKeys.length === 0) return BROWSERLESS_KEYS[0];
    
    return availableKeys.sort((a, b) => {
        return keyUsage[a].count - keyUsage[b].count;
    })[0];
}

// ========== GENERATE RECEIPT HTML WITH ALL 18 WATERMARKS ==========
function generateReceiptHTML(data) {
    const {
        senderName,
        formattedAccount,
        recipientName,
        recipientBank,
        recipientAccount,
        formattedAmount,
        transactionNumber,
        transactionDate
    } = data;

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        body {
            background: #f0f2f5;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        .receipt {
            max-width: 300px;
            background: white;
            padding: 15px;
            border-radius: 0;
            position: relative;
            overflow: hidden;
            margin: 0 auto;
        }
        /* ALL 18 WATERMARKS - RESTORED */
        .watermark-1 { position: absolute; top: 8%; left: 10%; transform: rotate(-35deg); font-size: 14px; font-weight: 900; color: rgba(0, 0, 0, 0.08); z-index: 0; pointer-events: none; }
        .watermark-2 { position: absolute; top: 8%; left: 40%; transform: rotate(-35deg); font-size: 12px; font-weight: 900; color: rgba(0, 0, 0, 0.08); z-index: 0; pointer-events: none; }
        .watermark-3 { position: absolute; top: 8%; left: 70%; transform: rotate(-35deg); font-size: 10px; font-weight: 900; color: rgba(0, 0, 0, 0.07); z-index: 0; pointer-events: none; }
        .watermark-4 { position: absolute; top: 25%; left: 5%; transform: rotate(-35deg); font-size: 16px; font-weight: 900; color: rgba(0, 0, 0, 0.07); z-index: 0; pointer-events: none; }
        .watermark-5 { position: absolute; top: 25%; left: 35%; transform: rotate(-35deg); font-size: 11px; font-weight: 900; color: rgba(0, 0, 0, 0.08); z-index: 0; pointer-events: none; }
        .watermark-6 { position: absolute; top: 25%; left: 65%; transform: rotate(-35deg); font-size: 13px; font-weight: 900; color: rgba(0, 0, 0, 0.07); z-index: 0; pointer-events: none; }
        .watermark-7 { position: absolute; top: 25%; left: 95%; transform: rotate(-35deg); font-size: 9px; font-weight: 900; color: rgba(0, 0, 0, 0.08); z-index: 0; pointer-events: none; }
        .watermark-8 { position: absolute; top: 42%; left: 15%; transform: rotate(-35deg); font-size: 15px; font-weight: 900; color: rgba(0, 0, 0, 0.07); z-index: 0; pointer-events: none; }
        .watermark-9 { position: absolute; top: 42%; left: 45%; transform: rotate(-35deg); font-size: 12px; font-weight: 900; color: rgba(0, 0, 0, 0.07); z-index: 0; pointer-events: none; }
        .watermark-10 { position: absolute; top: 42%; left: 75%; transform: rotate(-35deg); font-size: 14px; font-weight: 900; color: rgba(0, 0, 0, 0.08); z-index: 0; pointer-events: none; }
        .watermark-11 { position: absolute; top: 59%; left: 5%; transform: rotate(-35deg); font-size: 16px; font-weight: 900; color: rgba(0, 0, 0, 0.09); z-index: 0; pointer-events: none; }
        .watermark-12 { position: absolute; top: 59%; left: 35%; transform: rotate(-35deg); font-size: 14px; font-weight: 900; color: rgba(0, 0, 0, 0.09); z-index: 0; pointer-events: none; }
        .watermark-13 { position: absolute; top: 59%; left: 65%; transform: rotate(-35deg); font-size: 12px; font-weight: 900; color: rgba(0, 0, 0, 0.08); z-index: 0; pointer-events: none; }
        .watermark-14 { position: absolute; top: 59%; left: 95%; transform: rotate(-35deg); font-size: 13px; font-weight: 900; color: rgba(0, 0, 0, 0.08); z-index: 0; pointer-events: none; }
        .watermark-15 { position: absolute; top: 76%; left: 15%; transform: rotate(-35deg); font-size: 15px; font-weight: 900; color: rgba(0, 0, 0, 0.09); z-index: 0; pointer-events: none; }
        .watermark-16 { position: absolute; top: 76%; left: 45%; transform: rotate(-35deg); font-size: 17px; font-weight: 900; color: rgba(0, 0, 0, 0.09); z-index: 0; pointer-events: none; }
        .watermark-17 { position: absolute; top: 76%; left: 75%; transform: rotate(-35deg); font-size: 13px; font-weight: 900; color: rgba(0, 0, 0, 0.08); z-index: 0; pointer-events: none; }
        .watermark-18 { position: absolute; top: 93%; left: 25%; transform: rotate(-35deg); font-size: 15px; font-weight: 900; color: rgba(0, 0, 0, 0.09); z-index: 0; pointer-events: none; }
        
        .receipt-content {
            position: relative;
            z-index: 1;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
        }
        .logo {
            font-size: 26px;
            font-weight: 900;
            position: relative;
            display: flex;
            align-items: center;
        }
        .logo-dot {
            width: 14px;
            height: 14px;
            border: 5px solid #00C389;
            border-radius: 50%;
            position: relative;
            margin-right: 2px;
        }
        .logo-dot::before {
            content: "";
            position: absolute;
            top: 50%;
            left: -5px;
            width: 5px;
            height: 5px;
            background: white;
            transform: translateY(-50%);
        }
        .logo-dot::after {
            content: "-";
            position: absolute;
            top: 50%;
            left: -7px;
            transform: translateY(-50%);
            color: #1A3A7A;
            font-weight: 900;
            font-size: 18px;
        }
        .logo span {
            color: #1A3A7A;
            margin-left: 2px;
            font-weight: 900;
            font-size: 26px;
        }
        .title {
            font-size: 12px;
            font-weight: 500;
            color: #666666;
            text-align: right;
            margin-top: 8px;
        }
        .amount-section {
            text-align: center;
            margin-bottom: 15px;
            padding-bottom: 12px;
            border-bottom: 1px solid #E5E5E5;
        }
        .amount {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 4px;
            color: #00C389;
        }
        .status {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 1px;
            color: #666666;
        }
        .date {
            font-size: 9px;
            color: #666666;
        }
        .details-row {
            margin: 12px 0;
            display: flex;
            justify-content: space-between;
        }
        .label {
            font-weight: 600;
            color: #999999;
            font-size: 12px;
            width: 40%;
        }
        .value {
            font-size: 12px;
            width: 55%;
            text-align: right;
        }
        .value-main {
            font-weight: 700;
            color: #000000;
            font-size: 12px;
        }
        .value-sub {
            font-weight: 400;
            color: #999999;
            font-size: 12px;
        }
        .footer {
            text-align: left;
            font-size: 10px;
            color: #666666;
            line-height: 1.3;
            margin-top: 15px;
            padding-top: 12px;
            position: relative;
        }
        .footer::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(135deg, transparent 25%, #E5E5E5 25%, #E5E5E5 50%, transparent 50%, transparent 75%, #E5E5E5 75%);
            background-size: 8px 8px;
        }
    </style>
</head>
<body>
    <div class="receipt">
        <!-- ALL 18 WATERMARKS -->
        <div class="watermark-1">Opay</div>
        <div class="watermark-2">Opay</div>
        <div class="watermark-3">Opay</div>
        <div class="watermark-4">Opay</div>
        <div class="watermark-5">Opay</div>
        <div class="watermark-6">Opay</div>
        <div class="watermark-7">Opay</div>
        <div class="watermark-8">Opay</div>
        <div class="watermark-9">Opay</div>
        <div class="watermark-10">Opay</div>
        <div class="watermark-11">Opay</div>
        <div class="watermark-12">Opay</div>
        <div class="watermark-13">Opay</div>
        <div class="watermark-14">Opay</div>
        <div class="watermark-15">Opay</div>
        <div class="watermark-16">Opay</div>
        <div class="watermark-17">Opay</div>
        <div class="watermark-18">Opay</div>
        
        <div class="receipt-content">
            <div class="header">
                <div class="logo">
                    <div class="logo-dot"></div>
                    <span>Pɑy</span>
                </div>
                <div class="title">Transaction Receipt</div>
            </div>
            
            <div class="amount-section">
                <div class="amount">
                    <span style="font-size: 18px; margin-right: 2px; color: #00C389;">₦</span>${formattedAmount}
                </div>
                <div class="status">Successful</div>
                <div class="date">${transactionDate}</div>
            </div>
            
            <div class="details-row">
                <div class="label">Recipient Details</div>
                <div class="value">
                    <div class="value-main">${recipientName.toUpperCase()}</div>
                    <div class="value-sub">${recipientBank} |</div>
                    <div class="value-sub">${recipientAccount}</div>
                </div>
            </div>
            
            <div class="details-row">
                <div class="label">Sender Details</div>
                <div class="value">
                    <div class="value-main">${senderName.toUpperCase()}</div>
                    <div class="value-sub">OPay | ${formattedAccount}</div>
                </div>
            </div>
            
            <div class="details-row">
                <div class="label">Transaction No.</div>
                <div class="value value-sub">${transactionNumber}</div>
            </div>
            
            <div class="footer">
                Enjoy a better life with OPay. Get free transfers, withdrawals, bill payments, instant loans, and good annual interest On your savings. OPay is licensed by the Central Bank of Nigeria and insured by the NDIC.
            </div>
        </div>
    </div>
</body>
</html>`;
}

// ========== API ENDPOINTS ==========

// Main receipt generation endpoint
app.get('/api/genopay-image', async (req, res) => {
    let retryCount = 0;
    
    while (retryCount < BROWSERLESS_KEYS.length) {
        try {
            const { senderName, senderAccount, recipientName, recipientBank, recipientAccount, amount } = req.query;
            
            if (!senderName || !senderAccount || !recipientName || !recipientBank || !recipientAccount || !amount) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Missing required parameters' 
                });
            }
            
            if (senderAccount.length !== 10 || !/^\d+$/.test(senderAccount)) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Invalid sender account! Must be 10 digits' 
                });
            }
            
            if (!/^\d+(\.\d{1,2})?$/.test(amount)) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Invalid amount! Use format: 5000 or 5000.50' 
                });
            }
            
            const apiKey = getBestAPIKey();
            keyUsage[apiKey].count++;
            
            console.log(`🔑 Using API key ${BROWSERLESS_KEYS.indexOf(apiKey) + 1} (Usage: ${keyUsage[apiKey].count})`);
            
            const formattedAccount = formatAccountNumber(senderAccount);
            const formattedAmount = formatAmount(amount);
            const transactionNumber = generateTransactionNumber();
            const transactionDate = formatNigeriaDate(new Date());
            
            const receiptData = {
                senderName,
                formattedAccount,
                recipientName,
                recipientBank,
                recipientAccount,
                formattedAmount,
                transactionNumber,
                transactionDate
            };
            
            const receiptHtml = generateReceiptHTML(receiptData);
            
            const screenshotResponse = await fetch(`https://chrome.browserless.io/screenshot?token=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    html: receiptHtml,
                    options: {
                        type: 'png',
                        quality: 100,
                        clip: { x: 0, y: 0, width: 320, height: 550 }
                    }
                }),
                timeout: 30000
            });
            
            if (!screenshotResponse.ok) {
                keyUsage[apiKey].errors++;
                console.warn(`⚠️ Key failed: ${screenshotResponse.status}`);
                retryCount++;
                continue;
            }
            
            const imageBuffer = await screenshotResponse.buffer();
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(7);
            const filename = `opay_${timestamp}_${random}.png`;
            const filepath = path.join(__dirname, 'public', filename);
            
            await fs.promises.writeFile(filepath, imageBuffer);
            
            const baseUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
            const imageUrl = `${baseUrl}/public/${filename}`;
            
            console.log(`✅ Receipt saved: ${filename}`);
            
            res.json({
                success: true,
                imageUrl: imageUrl,
                receiptData: receiptData
            });
            
            return;
            
        } catch (error) {
            console.error(`❌ Attempt ${retryCount + 1} failed:`, error.message);
            retryCount++;
            
            if (retryCount >= BROWSERLESS_KEYS.length) {
                res.status(500).json({
                    success: false,
                    error: 'Failed to generate receipt'
                });
            }
        }
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'OPay Receipt API',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        keys: BROWSERLESS_KEYS.length
    });
});

// Keys status
app.get('/api/keys-status', (req, res) => {
    const totalUsage = Object.values(keyUsage).reduce((sum, u) => sum + u.count, 0);
    
    res.json({
        success: true,
        totalKeys: BROWSERLESS_KEYS.length,
        totalUsage: totalUsage,
        remainingHits: (BROWSERLESS_KEYS.length * 1000) - totalUsage,
        keys: BROWSERLESS_KEYS.map((key, index) => ({
            key: `Key ${index + 1}`,
            count: keyUsage[key].count,
            errors: keyUsage[key].errors
        }))
    });
});

// Serve index.html
app.get('/', (req, res) => {
    if (fs.existsSync('index.html')) {
        res.sendFile(path.join(__dirname, 'index.html'));
    } else {
        res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>OPay Receipt API</title></head>
        <body>
            <h1>OPay Receipt Generator API</h1>
            <p>✅ API is running with ${BROWSERLESS_KEYS.length} keys</p>
            <p>🎯 Free hits: ${BROWSERLESS_KEYS.length * 1000}/month</p>
        </body>
        </html>
        `);
    }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 OPay Receipt API running on port ${PORT}`);
    console.log(`🔑 API Keys: ${BROWSERLESS_KEYS.length}`);
    console.log(`🎯 Free hits/month: ${BROWSERLESS_KEYS.length * 1000}`);
    console.log(`\n📌 Endpoints:`);
    console.log(`  • Generate: /api/genopay-image?senderName=...`);
    console.log(`  • Health: /health`);
    console.log(`  • Keys: /api/keys-status`);
    
    if (process.env.RENDER_EXTERNAL_URL) {
        startAutoPing();
    }
});
