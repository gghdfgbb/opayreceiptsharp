const express = require('express');
const path = require('path');
const fs = require('fs');
const { createCanvas, registerFont, loadImage } = require('canvas');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

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

// Generate receipt as PNG image
async function generateReceiptImage(receiptData) {
  const width = 400;
  const height = 600;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Header
  ctx.fillStyle = '#1A3A7A';
  ctx.fillRect(0, 0, width, 80);
  
  // OPay Logo
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 24px Arial';
  ctx.fillText('OPay', 20, 50);
  
  // Receipt Title
  ctx.font = '12px Arial';
  ctx.fillText('Transaction Receipt', width - 150, 50);

  // Amount section
  ctx.fillStyle = '#00C389';
  ctx.font = 'bold 28px Arial';
  ctx.fillText(`₦${receiptData.amount}`, width/2 - ctx.measureText(`₦${receiptData.amount}`).width/2, 130);
  
  ctx.fillStyle = '#666666';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('Successful', width/2 - ctx.measureText('Successful').width/2, 160);
  
  ctx.font = '10px Arial';
  ctx.fillText(receiptData.date, width/2 - ctx.measureText(receiptData.date).width/2, 180);

  // Draw line
  ctx.strokeStyle = '#E5E5E5';
  ctx.beginPath();
  ctx.moveTo(20, 200);
  ctx.lineTo(width - 20, 200);
  ctx.stroke();

  // Recipient Details
  let y = 230;
  ctx.fillStyle = '#999999';
  ctx.font = 'bold 12px Arial';
  ctx.fillText('Recipient Details', 20, y);
  
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 14px Arial';
  ctx.fillText(receiptData.recipientName, width - 20 - ctx.measureText(receiptData.recipientName).width, y);
  
  y += 20;
  ctx.fillStyle = '#999999';
  ctx.font = '12px Arial';
  ctx.fillText(`${receiptData.recipientBank} |`, width - 20 - ctx.measureText(`${receiptData.recipientBank} |`).width, y);
  
  y += 15;
  ctx.fillText(receiptData.recipientAccountNumber, width - 20 - ctx.measureText(receiptData.recipientAccountNumber).width, y);

  // Sender Details
  y += 30;
  ctx.fillStyle = '#999999';
  ctx.font = 'bold 12px Arial';
  ctx.fillText('Sender Details', 20, y);
  
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 14px Arial';
  ctx.fillText(receiptData.senderName, width - 20 - ctx.measureText(receiptData.senderName).width, y);
  
  y += 20;
  ctx.fillStyle = '#999999';
  ctx.font = '12px Arial';
  ctx.fillText(`OPay | ${receiptData.senderAccountNumber}`, width - 20 - ctx.measureText(`OPay | ${receiptData.senderAccountNumber}`).width, y);

  // Transaction Number
  y += 40;
  ctx.fillStyle = '#999999';
  ctx.font = 'bold 12px Arial';
  ctx.fillText('Transaction No.', 20, y);
  
  ctx.fillStyle = '#999999';
  ctx.font = '12px Arial';
  ctx.fillText(receiptData.transactionNo, width - 20 - ctx.measureText(receiptData.transactionNo).width, y);

  // Footer line
  y += 30;
  ctx.strokeStyle = '#E5E5E5';
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(20, y);
  ctx.lineTo(width - 20, y);
  ctx.stroke();
  ctx.setLineDash([]);

  // Footer text
  y += 20;
  ctx.fillStyle = '#666666';
  ctx.font = '9px Arial';
  const footerText = 'Enjoy a better life with OPay. Get free transfers, withdrawals, bill payments, instant loans, and good annual interest On your savings. OPay is licensed by the Central Bank of Nigeria and insured by the NDIC.';
  
  const words = footerText.split(' ');
  let line = '';
  let lineHeight = 12;
  
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    const testWidth = ctx.measureText(testLine).width;
    
    if (testWidth > (width - 40)) {
      ctx.fillText(line, 20, y);
      line = words[i] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, 20, y);

  // Return buffer
  return canvas.toBuffer('image/png');
}

// ==================== API ENDPOINTS ====================

// Direct image endpoint (for WhatsApp bot)
app.get('/api/receipt/image', async (req, res) => {
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

    // Generate image buffer
    const imageBuffer = await generateReceiptImage(receiptData);

    // Set headers for direct image response
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', imageBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    
    // Send image directly
    res.send(imageBuffer);

  } catch (error) {
    console.error('Error generating receipt image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate receipt image'
    });
  }
});

// JSON endpoint that returns image URL (alternative)
app.get('/api/receipt/url', (req, res) => {
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

    // Create the direct image URL
    const imageUrl = `http://${req.headers.host}/api/receipt/image?recipientName=${encodeURIComponent(recipientName)}&recipientAccountNumber=${encodeURIComponent(recipientAccountNumber)}&amount=${encodeURIComponent(amount)}&recipientBank=${encodeURIComponent(recipientBank)}&senderName=${encodeURIComponent(senderName)}&senderAccountNumber=${encodeURIComponent(senderAccountNumber)}`;

    res.json({
      success: true,
      imageUrl: imageUrl,
      data: {
        recipientName: recipientName,
        recipientAccountNumber: recipientAccountNumber,
        recipientBank: recipientBank,
        senderName: senderName,
        senderAccountNumber: senderAccountNumber,
        amount: parsedAmount,
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
    endpoints: {
      directImage: 'GET /api/receipt/image?recipientName=NAME&recipientAccountNumber=ACCOUNT&amount=AMOUNT&recipientBank=BANK&senderName=SENDER&senderAccountNumber=SENDERACCOUNT',
      imageUrl: 'GET /api/receipt/url?recipientName=NAME&recipientAccountNumber=ACCOUNT&amount=AMOUNT&recipientBank=BANK&senderName=SENDER&senderAccountNumber=SENDERACCOUNT'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 OPay Receipt Image Generator running on port ${PORT}`);
  console.log(`📸 Direct Image API: http://localhost:${PORT}/api/receipt/image?recipientName=John&recipientAccountNumber=0123456789&amount=5000&recipientBank=Access Bank&senderName=Jane&senderAccountNumber=9123456789`);
});
