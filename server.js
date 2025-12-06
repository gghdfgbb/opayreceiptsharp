const express = require('express');
const path = require('path');
const fs = require('fs');
const { createCanvas } = require('canvas');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// In-memory cache for generated images
const imageCache = new Map();

// Generate transaction ID
function generateTransactionId() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `${year}${month}${day}020100${random}004263`;
}

// Mask sender account number
function maskSenderAccountNumber(accountNumber) {
  if (!accountNumber || accountNumber.length < 6) return accountNumber;
  const firstThree = accountNumber.substring(0, 3);
  const lastThree = accountNumber.substring(accountNumber.length - 3);
  const middleStars = '*'.repeat(accountNumber.length - 6);
  return `${firstThree}${middleStars}${lastThree}`;
}

// Format date
function formatDate() {
  const now = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = now.getDate();
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  const hour = now.getHours().toString().padStart(2, '0');
  const minute = now.getMinutes().toString().padStart(2, '0');
  const second = now.getSeconds().toString().padStart(2, '0');
  
  function getOrdinalSuffix(n) {
    if (n > 3 && n < 21) return 'th';
    switch (n % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }
  
  return `${month} ${day}${getOrdinalSuffix(day)}, ${year} ${hour}:${minute}:${second}`;
}

// Generate receipt as PNG image (returns Buffer)
function generateReceiptImage(receiptData) {
  const width = 400;
  const height = 650;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Header with OPay blue
  ctx.fillStyle = '#1A3A7A';
  ctx.fillRect(0, 0, width, 80);
  
  // OPay Logo
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 28px Arial';
  ctx.fillText('O P a y', 20, 50);
  
  // Receipt Title
  ctx.font = '12px Arial';
  ctx.fillText('Transaction Receipt', width - 150, 50);

  // Amount section
  ctx.fillStyle = '#00C389';
  ctx.font = 'bold 32px Arial';
  const amountText = `₦${receiptData.amount}`;
  ctx.fillText(amountText, width/2 - ctx.measureText(amountText).width/2, 140);
  
  ctx.fillStyle = '#666666';
  ctx.font = 'bold 18px Arial';
  ctx.fillText('Successful', width/2 - ctx.measureText('Successful').width/2, 170);
  
  ctx.font = '11px Arial';
  ctx.fillText(receiptData.date, width/2 - ctx.measureText(receiptData.date).width/2, 190);

  // Draw line
  ctx.strokeStyle = '#E5E5E5';
  ctx.beginPath();
  ctx.moveTo(20, 210);
  ctx.lineTo(width - 20, 210);
  ctx.stroke();

  // Recipient Details
  let y = 240;
  ctx.fillStyle = '#999999';
  ctx.font = 'bold 13px Arial';
  ctx.fillText('Recipient Details', 20, y);
  
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 15px Arial';
  ctx.fillText(receiptData.recipientName, width - 20 - ctx.measureText(receiptData.recipientName).width, y);
  
  y += 22;
  ctx.fillStyle = '#999999';
  ctx.font = '13px Arial';
  const bankText = `${receiptData.recipientBank} |`;
  ctx.fillText(bankText, width - 20 - ctx.measureText(bankText).width, y);
  
  y += 18;
  ctx.fillText(receiptData.recipientAccountNumber, width - 20 - ctx.measureText(receiptData.recipientAccountNumber).width, y);

  // Sender Details
  y += 35;
  ctx.fillStyle = '#999999';
  ctx.font = 'bold 13px Arial';
  ctx.fillText('Sender Details', 20, y);
  
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 15px Arial';
  ctx.fillText(receiptData.senderName, width - 20 - ctx.measureText(receiptData.senderName).width, y);
  
  y += 22;
  ctx.fillStyle = '#999999';
  ctx.font = '13px Arial';
  const senderAccText = `OPay | ${receiptData.senderAccountNumber}`;
  ctx.fillText(senderAccText, width - 20 - ctx.measureText(senderAccText).width, y);

  // Transaction Number
  y += 45;
  ctx.fillStyle = '#999999';
  ctx.font = 'bold 13px Arial';
  ctx.fillText('Transaction No.', 20, y);
  
  ctx.fillStyle = '#999999';
  ctx.font = '12px Arial';
  ctx.fillText(receiptData.transactionNo, width - 20 - ctx.measureText(receiptData.transactionNo).width, y);

  // Footer line
  y += 35;
  ctx.strokeStyle = '#E5E5E5';
  ctx.setLineDash([5, 3]);
  ctx.beginPath();
  ctx.moveTo(20, y);
  ctx.lineTo(width - 20, y);
  ctx.stroke();
  ctx.setLineDash([]);

  // Footer text
  y += 25;
  ctx.fillStyle = '#666666';
  ctx.font = '10px Arial';
  const footerText = 'Enjoy a better life with OPay. Get free transfers, withdrawals, bill payments, instant loans, and good annual interest On your savings. OPay is licensed by the Central Bank of Nigeria and insured by the NDIC.';
  
  const words = footerText.split(' ');
  let line = '';
  const lineHeight = 14;
  const maxWidth = width - 40;
  
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    const testWidth = ctx.measureText(testLine).width;
    
    if (testWidth > maxWidth && i > 0) {
      ctx.fillText(line, 20, y);
      line = words[i] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, 20, y);

  // Return image buffer
  return canvas.toBuffer('image/png');
}

// ==================== FIXED API ENDPOINTS ====================

// DIRECT IMAGE ENDPOINT - Returns actual PNG image
app.get('/api/receipt/image', (req, res) => {
  try {
    const {
      recipientName,
      recipientAccountNumber,
      recipientBank,
      senderName,
      senderAccountNumber,
      amount
    } = req.query;

    // STRICT VALIDATION
    const missingParams = [];
    
    if (!recipientName) missingParams.push('recipientName');
    if (!recipientAccountNumber) missingParams.push('recipientAccountNumber');
    if (!recipientBank) missingParams.push('recipientBank');
    if (!senderName) missingParams.push('senderName');
    if (!senderAccountNumber) missingParams.push('senderAccountNumber');
    if (!amount) missingParams.push('amount');

    if (missingParams.length > 0) {
      // Return error image
      const errorCanvas = createCanvas(400, 200);
      const errorCtx = errorCanvas.getContext('2d');
      errorCtx.fillStyle = '#FF6B6B';
      errorCtx.fillRect(0, 0, 400, 200);
      errorCtx.fillStyle = '#FFFFFF';
      errorCtx.font = 'bold 20px Arial';
      errorCtx.fillText('Error: Missing Parameters', 50, 80);
      errorCtx.font = '14px Arial';
      errorCtx.fillText(missingParams.join(', '), 50, 120);
      
      res.setHeader('Content-Type', 'image/png');
      return res.send(errorCanvas.toBuffer('image/png'));
    }

    // Validate amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      const errorCanvas = createCanvas(400, 200);
      const errorCtx = errorCanvas.getContext('2d');
      errorCtx.fillStyle = '#FF6B6B';
      errorCtx.fillRect(0, 0, 400, 200);
      errorCtx.fillStyle = '#FFFFFF';
      errorCtx.font = 'bold 20px Arial';
      errorCtx.fillText('Error: Invalid Amount', 50, 80);
      errorCtx.font = '14px Arial';
      errorCtx.fillText('Amount must be a valid number', 50, 120);
      
      res.setHeader('Content-Type', 'image/png');
      return res.send(errorCanvas.toBuffer('image/png'));
    }

    // Format amount
    const formattedAmount = parsedAmount.toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    // Prepare data
    const receiptData = {
      recipientName: recipientName.toUpperCase(),
      recipientAccountNumber: recipientAccountNumber,
      recipientBank: recipientBank,
      senderName: senderName.toUpperCase(),
      senderAccountNumber: maskSenderAccountNumber(senderAccountNumber),
      amount: formattedAmount,
      transactionNo: generateTransactionId(),
      status: 'Successful',
      date: formatDate()
    };

    // Generate image
    const imageBuffer = generateReceiptImage(receiptData);

    // Set headers for direct image
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', imageBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Content-Disposition', `inline; filename="opay-receipt-${Date.now()}.png"`);

    // Send the actual image
    res.send(imageBuffer);

  } catch (error) {
    console.error('Error generating receipt image:', error);
    
    // Return error image
    const errorCanvas = createCanvas(400, 200);
    const errorCtx = errorCanvas.getContext('2d');
    errorCtx.fillStyle = '#FF6B6B';
    errorCtx.fillRect(0, 0, 400, 200);
    errorCtx.fillStyle = '#FFFFFF';
    errorCtx.font = 'bold 20px Arial';
    errorCtx.fillText('Server Error', 50, 80);
    errorCtx.font = '14px Arial';
    errorCtx.fillText('Failed to generate receipt', 50, 120);
    
    res.setHeader('Content-Type', 'image/png');
    res.status(500).send(errorCanvas.toBuffer('image/png'));
  }
});

// JSON endpoint that returns image URL
app.get('/api/receipt/json', (req, res) => {
  try {
    const {
      recipientName,
      recipientAccountNumber,
      recipientBank,
      senderName,
      senderAccountNumber,
      amount
    } = req.query;

    // STRICT VALIDATION
    const missingParams = [];
    
    if (!recipientName) missingParams.push('recipientName');
    if (!recipientAccountNumber) missingParams.push('recipientAccountNumber');
    if (!recipientBank) missingParams.push('recipientBank');
    if (!senderName) missingParams.push('senderName');
    if (!senderAccountNumber) missingParams.push('senderAccountNumber');
    if (!amount) missingParams.push('amount');

    if (missingParams.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing parameters: ${missingParams.join(', ')}`
      });
    }

    // Validate amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a valid number'
      });
    }

    // Format amount
    const formattedAmount = parsedAmount.toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    // Create the direct image URL
    const imageUrl = `${req.protocol}://${req.headers.host}/api/receipt/image?recipientName=${encodeURIComponent(recipientName)}&recipientAccountNumber=${encodeURIComponent(recipientAccountNumber)}&amount=${encodeURIComponent(amount)}&recipientBank=${encodeURIComponent(recipientBank)}&senderName=${encodeURIComponent(senderName)}&senderAccountNumber=${encodeURIComponent(senderAccountNumber)}`;

    res.json({
      success: true,
      imageUrl: imageUrl,
      directImage: imageUrl, // For WhatsApp bot
      data: {
        recipientName: recipientName,
        recipientAccountNumber: recipientAccountNumber,
        recipientBank: recipientBank,
        senderName: senderName,
        senderAccountNumber: senderAccountNumber,
        amount: formattedAmount,
        status: 'Successful'
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process request'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'online',
    service: 'OPay Receipt Image Generator',
    timestamp: new Date().toISOString(),
    endpoints: {
      directImage: 'GET /api/receipt/image?recipientName=NAME&recipientAccountNumber=ACCOUNT&amount=AMOUNT&recipientBank=BANK&senderName=SENDER&senderAccountNumber=SENDERACCOUNT',
      jsonResponse: 'GET /api/receipt/json?recipientName=NAME&recipientAccountNumber=ACCOUNT&amount=AMOUNT&recipientBank=BANK&senderName=SENDER&senderAccountNumber=SENDERACCOUNT'
    },
    example: `${req.protocol}://${req.headers.host}/api/receipt/image?recipientName=John+Doe&recipientAccountNumber=9013377147&amount=50000&recipientBank=Access+Bank&senderName=Jane+Smith&senderAccountNumber=9123456789`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 OPay Receipt Image Generator running on port ${PORT}`);
  console.log(`📸 DIRECT IMAGE URL:`);
  console.log(`http://localhost:${PORT}/api/receipt/image?recipientName=John+Doe&recipientAccountNumber=9013377147&amount=50000&recipientBank=Access+Bank&senderName=Jane+Smith&senderAccountNumber=9123456789`);
  console.log(`\n📋 JSON URL:`);
  console.log(`http://localhost:${PORT}/api/receipt/json?recipientName=John+Doe&recipientAccountNumber=9013377147&amount=50000&recipientBank=Access+Bank&senderName=Jane+Smith&senderAccountNumber=9123456789`);
});
