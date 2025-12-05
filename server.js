const express = require('express');
const path = require('path');

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

// Mask account numbers
function maskAccountNumber(accountNumber) {
  if (!accountNumber || accountNumber.length < 4) return accountNumber;
  const lastFour = accountNumber.slice(-4);
  const masked = '*'.repeat(accountNumber.length - 4);
  return masked + lastFour;
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
  
  // Add ordinal suffix
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

// Generate receipt HTML
function generateReceiptHtml(data) {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        body {
            font-family: 'Inter', -apple-system, BlinkSystemFont, sans-serif;
            background-color: #f0f2f5;
            margin: 0;
            padding: 10px;
            color: #000000;
            line-height: 1.3;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        
        .receipt {
            max-width: 300px;
            background: white;
            padding: 15px;
            border-radius: 0;
            position: relative;
            overflow: hidden;
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
            color: ${data.status === 'Successful' ? '#00C389' : '#FF6B6B'};
        }
        
        .naira-symbol {
            font-size: 18px;
            margin-right: 2px;
            color: ${data.status === 'Successful' ? '#00C389' : '#FF6B6B'};
        }
        
        .status {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 1px;
            color: ${data.status === 'Successful' ? '#666666' : '#FF6B6B'};
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
    <div class="receipt">
        <!-- All watermarks -->
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
                <span class="naira-symbol">₦</span>${data.amount}
            </div>
            <div class="status">${data.status}</div>
            <div class="date">${data.date}</div>
        </div>
        
        <div class="section">
            <div class="section-title">Recipient Details</div>
            <div class="section-content">
                <div class="bold-text">${data.recipientName}</div>
                <div class="normal-text">${data.recipientBank} |</div>
                <div class="normal-text">${data.recipientAccountNumber}</div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">Sender Details</div>
            <div class="section-content">
                <div class="bold-text">${data.senderName}</div>
                <div class="normal-text">OPay | ${data.senderAccountNumber}</div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">Transaction No.</div>
            <div class="section-content normal-text">${data.transactionNo}</div>
        </div>
        
        <div class="footer">
            Enjoy a better life with OPay. Get free transfers, withdrawals, bill payments, instant loans, and good annual interest On your savings. OPay is licensed by the Central Bank of Nigeria and insured by the NDIC.
        </div>
    </div>
    
    <script>
        // Auto-print after 1 second
        setTimeout(() => {
            window.print();
            // Close window after 3 seconds if printed
            setTimeout(() => {
                window.close();
            }, 3000);
        }, 1000);
    </script>
</body>
</html>`;
}

// API Endpoint to generate receipt
app.post('/api/generate', (req, res) => {
  try {
    const {
      recipientName,
      recipientAccountNumber,
      recipientBank,
      senderName,
      senderAccountNumber,
      amount,
      transactionId,
      status = 'Successful'
    } = req.body;

    // Validate required fields
    if (!recipientName || !recipientAccountNumber || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Recipient name, account number, and amount are required'
      });
    }

    // Format amount with Naira symbol
    const formattedAmount = parseFloat(amount).toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    // Prepare data
    const receiptData = {
      recipientName: recipientName.toUpperCase(),
      recipientAccountNumber: maskAccountNumber(recipientAccountNumber),
      recipientBank: recipientBank || 'SmartCash Payment Service Bank',
      senderName: (senderName || 'PHILIP OTHUAMHO SALIU').toUpperCase(),
      senderAccountNumber: maskAccountNumber(senderAccountNumber || '9123456789'),
      amount: formattedAmount,
      transactionNo: transactionId || generateTransactionId(),
      status: status,
      date: formatDate()
    };

    // Generate HTML receipt
    const receiptHtml = generateReceiptHtml(receiptData);

    res.json({
      success: true,
      html: receiptHtml,
      data: receiptData
    });

  } catch (error) {
    console.error('Error generating receipt:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate receipt'
    });
  }
});

// Endpoint to directly show receipt (for external projects)
app.get('/receipt', (req, res) => {
  try {
    const {
      recipientName,
      recipientAccountNumber,
      recipientBank,
      senderName,
      senderAccountNumber,
      amount,
      transactionId,
      status = 'Successful'
    } = req.query;

    // Format amount
    const formattedAmount = parseFloat(amount || '1000.00').toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    // Prepare data with defaults
    const receiptData = {
      recipientName: (recipientName || 'PHILIP SALIU').toUpperCase(),
      recipientAccountNumber: maskAccountNumber(recipientAccountNumber || '9013377147'),
      recipientBank: recipientBank || 'SmartCash Payment Service Bank',
      senderName: (senderName || 'PHILIP OTHUAMHO SALIU').toUpperCase(),
      senderAccountNumber: maskAccountNumber(senderAccountNumber || '9123456789'),
      amount: formattedAmount,
      transactionNo: transactionId || generateTransactionId(),
      status: status,
      date: formatDate()
    };

    // Generate and send HTML
    const receiptHtml = generateReceiptHtml(receiptData);
    res.send(receiptHtml);

  } catch (error) {
    console.error('Error generating receipt:', error);
    res.status(500).send('Failed to generate receipt');
  }
});

// Simple health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'online', 
    service: 'OPay Receipt Generator',
    endpoints: {
      home: '/',
      generate: 'POST /api/generate',
      quickReceipt: 'GET /receipt?recipientName=...'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 OPay Receipt Generator running on port ${PORT}`);
  console.log(`📄 Web Interface: http://localhost:${PORT}`);
  console.log(`🔧 API Endpoint: http://localhost:${PORT}/api/generate`);
  console.log(`📝 Quick Receipt: http://localhost:${PORT}/receipt?recipientName=John&amount=5000`);
});
