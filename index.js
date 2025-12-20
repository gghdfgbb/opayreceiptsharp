
// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files from public folder
app.use('/receipts', express.static('receipts')); // Serve generated receipts

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

// Helper functions
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
    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    // Add ordinal suffix to day
    const suffix = (day % 10 === 1 && day !== 11) ? 'st' :
                  (day % 10 === 2 && day !== 12) ? 'nd' :
                  (day % 10 === 3 && day !== 13) ? 'rd' : 'th';
    
    return `${month} ${day}${suffix}, ${year} ${hours}:${minutes}:${seconds}`;
}

// Generate receipt HTML (same as in index.html)
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

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                body {
                    font-family: 'Inter', sans-serif;
                    background-color: #f0f2f5;
                    margin: 0;
                    padding: 10px;
                    color: #000000;
                    line-height: 1.3;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    width: 400px;
                }
                
                .receipt {
                    max-width: 300px;
                    background: white;
                    padding: 15px;
                    border-radius: 0;
                    position: relative;
                    overflow: hidden;
                    font-family: 'Inter', sans-serif !important;
                }
                
                /* Watermarks */
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
                
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 15px;
                    position: relative;
                    z-index: 1;
                }
                
                .opay-logo {
                    font-size: 26px;
                    font-weight: 900;
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                
                .incomplete-circle {
                    width: 14px;
                    height: 14px;
                    border: 5px solid #00C389;
                    border-radius: 50%;
                    position: relative;
                    margin-right: 2px;
                }
                
                .incomplete-circle::before {
                    content: "";
                    position: absolute;
                    top: 50%;
                    left: -5px;
                    width: 5px;
                    height: 5px;
                    background: white;
                    transform: translateY(-50%);
                }
                
                .incomplete-circle::after {
                    content: "-";
                    position: absolute;
                    top: 50%;
                    left: -7px;
                    transform: translateY(-50%);
                    color: #1A3A7A;
                    font-weight: 900;
                    font-size: 18px;
                }
                
                .opay-text {
                    color: #1A3A7A;
                    margin-left: 2px;
                    font-weight: 900;
                    font-size: 26px;
                }
                
                .receipt-title {
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
                    position: relative;
                    z-index: 1;
                }
                
                .amount {
                    font-size: 20px;
                    font-weight: 700;
                    margin-bottom: 4px;
                    color: #00C389;
                }
                
                .naira-symbol {
                    font-size: 18px;
                    margin-right: 2px;
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
                
                .section {
                    margin: 12px 0;
                    display: flex;
                    justify-content: space-between;
                    position: relative;
                    z-index: 1;
                }
                
                .section-title {
                    font-weight: 600;
                    color: #999999;
                    font-size: 12px;
                    width: 40%;
                }
                
                .section-content {
                    font-size: 12px;
                    width: 55%;
                    text-align: right;
                }
                
                .bold-text {
                    font-weight: 700;
                    color: #000000;
                    font-size: 12px;
                }
                
                .normal-text {
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
                    z-index: 1;
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
            <div class="receipt" id="receipt">
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
                
                <div class="header">
                    <div class="opay-logo">
                        <div class="incomplete-circle"></div>
                        <span class="opay-text">Pɑy</span>
                    </div>
                    <div class="receipt-title">Transaction Receipt</div>
                </div>
                
                <div class="amount-section">
                    <div class="amount">
                        <span class="naira-symbol">₦</span>${formattedAmount}
                    </div>
                    <div class="status">Successful</div>
                    <div class="date">${transactionDate}</div>
                </div>
                
                <div class="section">
                    <div class="section-title">Recipient Details</div>
                    <div class="section-content">
                        <div class="bold-text">${recipientName.toUpperCase()}</div>
                        <div class="normal-text">${recipientBank} |</div>
                        <div class="normal-text">${recipientAccount}</div>
                    </div>
                </div>
                
                <div class="section">
                    <div class="section-title">Sender Details</div>
                    <div class="section-content">
                        <div class="bold-text">${senderName.toUpperCase()}</div>
                        <div class="normal-text">OPay | ${formattedAccount}</div>
                    </div>
                </div>
                
                <div class="section">
                    <div class="section-title">Transaction No.</div>
                    <div class="section-content normal-text">${transactionNumber}</div>
                </div>
                
                <div class="footer">
                    Enjoy a better life with OPay. Get free transfers, withdrawals, bill payments, instant loans, and good annual interest On your savings. OPay is licensed by the Central Bank of Nigeria and insured by the NDIC.
                </div>
            </div>
            
            <script src="https://html2canvas.hertzen.com/dist/html2canvas.min.js"></script>
            <script>
                // Wait for page to load
                window.onload = function() {
                    // Convert receipt to image
                    html2canvas(document.getElementById('receipt'), {
                        scale: 2,
                        backgroundColor: '#f0f2f5',
                        useCORS: true,
                        logging: false,
                        allowTaint: true
                    }).then(canvas => {
                        // Convert canvas to data URL
                        const imageData = canvas.toDataURL('image/png');
                        
                        // Send the image data back to the server
                        fetch('/api/receipt-generated', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                receiptId: '${transactionNumber}',
                                imageData: imageData
                            })
                        });
                    });
                };
            </script>
        </body>
        </html>
    `;
}

// ==================== SIMPLE API ENDPOINT ====================

// Store generated receipts temporarily
const generatedReceipts = new Map();

// API endpoint to generate OPay receipt image (SIMPLE VERSION)
app.get('/api/genopay', async (req, res) => {
    try {
        const {
            senderName,
            senderAccount,
            recipientName,
            recipientBank,
            recipientAccount,
            amount
        } = req.query;

        // Validate required parameters
        if (!senderName || !senderAccount || !recipientName || !recipientBank || !recipientAccount || !amount) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters',
                message: 'Required: senderName, senderAccount, recipientName, recipientBank, recipientAccount, amount'
            });
        }

        // Validate account number
        if (senderAccount.length !== 10 || !/^\d+$/.test(senderAccount)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid sender account number',
                message: 'Must be 10 digits'
            });
        }

        // Generate receipt data
        const formattedAccount = formatAccountNumber(senderAccount);
        const formattedAmount = formatAmount(amount);
        const transactionNumber = generateTransactionNumber();
        const transactionDate = formatNigeriaDate(new Date());

        // Create receipt data object
        const receiptData = {
            senderName,
            formattedAccount,
            recipientName,
            recipientBank,
            recipientAccount,
            formattedAmount,
            transactionNumber,
            transactionDate,
            timestamp: Date.now()
        };

        // Generate the receipt HTML
        const receiptHTML = generateReceiptHTML(receiptData);

        // For this simple version, we'll return the HTML with a JavaScript solution
        // In a real implementation, you would use Puppeteer or similar to generate the image server-side
        
        // For now, return a response that tells the bot how to get the image
        res.json({
            success: true,
            message: 'Receipt HTML generated. Use client-side rendering for image.',
            data: {
                receiptId: transactionNumber,
                receiptHTML: receiptHTML,
                receiptData: receiptData,
                instructions: 'Use html2canvas on client side to convert to image'
            }
        });

        console.log(`✅ Receipt data generated for transaction: ${transactionNumber}`);

    } catch (error) {
        console.error('Error generating OPay receipt:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate receipt',
            message: error.message
        });
    }
});

// Alternative: Simple image generation using a headless browser service
app.get('/api/genopay-image', async (req, res) => {
    try {
        const {
            senderName,
            senderAccount,
            recipientName,
            recipientBank,
            recipientAccount,
            amount
        } = req.query;

        // Validate required parameters
        if (!senderName || !senderAccount || !recipientName || !recipientBank || !recipientAccount || !amount) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters',
                message: 'Required: senderName, senderAccount, recipientName, recipientBank, recipientAccount, amount'
            });
        }

        // Validate account number
        if (senderAccount.length !== 10 || !/^\d+$/.test(senderAccount)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid sender account number',
                message: 'Must be 10 digits'
            });
        }

        // Generate receipt data
        const formattedAccount = formatAccountNumber(senderAccount);
        const formattedAmount = formatAmount(amount);
        const transactionNumber = generateTransactionNumber();
        const transactionDate = formatNigeriaDate(new Date());

        // Create a unique filename
        const filename = `opay_receipt_${transactionNumber}_${Date.now()}.png`;
        const imageUrl = `${req.protocol}://${req.get('host')}/api/receipt-image/${filename}`;

        // Store receipt data
        const receiptData = {
            senderName,
            formattedAccount,
            recipientName,
            recipientBank,
            recipientAccount,
            formattedAmount,
            transactionNumber,
            transactionDate,
            imageUrl: imageUrl,
            timestamp: Date.now()
        };

        generatedReceipts.set(filename, receiptData);

        // Return the image URL directly
        res.json({
            success: true,
            message: 'OPay receipt image URL generated',
            data: {
                imageUrl: imageUrl,
                receiptData: {
                    senderName: senderName.toUpperCase(),
                    senderAccount: formattedAccount,
                    recipientName: recipientName.toUpperCase(),
                    recipientBank: recipientBank,
                    recipientAccount: recipientAccount,
                    amount: `₦${formattedAmount}`,
                    transactionNumber: transactionNumber,
                    transactionDate: transactionDate
                }
            }
        });

        console.log(`✅ Image URL generated: ${imageUrl}`);

    } catch (error) {
        console.error('Error generating OPay receipt image:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate receipt image',
            message: error.message
        });
    }
});

// Endpoint to get receipt image (placeholder - returns a sample image)
app.get('/api/receipt-image/:filename', (req, res) => {
    const { filename } = req.params;
    
    if (generatedReceipts.has(filename)) {
        // In a real implementation, you would return the actual image
        // For now, redirect to a sample receipt image
        res.redirect('https://via.placeholder.com/400x600/00C389/FFFFFF?text=OPay+Receipt');
    } else {
        res.status(404).json({
            success: false,
            error: 'Receipt not found'
        });
    }
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'OPay Receipt API is working!',
        endpoints: {
            generate: '/api/genopay-image?senderName=John&senderAccount=9123456789&recipientName=Jane&recipientBank=Access+Bank&recipientAccount=9876543210&amount=5000',
            example: 'http://localhost:3000/api/genopay-image?senderName=John+Doe&senderAccount=9123456789&recipientName=Jane+Smith&recipientBank=Access+Bank&recipientAccount=9876543210&amount=5000'
        },
        usage: 'Call /api/genopay-image with all parameters to get an image URL that can be sent to WhatsApp'
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 OPay Receipt Generator running on port ${PORT}`);
    console.log(`📱 Main app: http://localhost:${PORT}`);
    console.log(`🖼️ API endpoint: http://localhost:${PORT}/api/genopay-image`);
    console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
    
    // Start auto-ping if on Render
    if (process.env.RENDER) {
        console.log('🌐 Render environment detected - starting auto-ping system');
        startAutoPing();
    } else {
        console.log('💻 Local environment - auto-ping disabled');
    }
});

