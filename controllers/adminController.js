const Transaction = require('../models/transactionModel');

// GET /api/admin/topups — รายการรอ approve ทั้งหมด
const getPendingTopups = async (req, res) => {
  try {
    const rows = await Transaction.getPending();
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getPendingTopups error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/topups/:id/approve — อนุมัติเติมเงิน
const approveTopup = async (req, res) => {
  try {
    const tx = await Transaction.getById(req.params.id);
    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });
    if (tx.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Transaction already processed' });
    }

    await Transaction.approveTopup(tx.id, tx.user_id, tx.amount);
    res.json({ success: true, message: 'Approved and balance updated' });
  } catch (err) {
    console.error('approveTopup error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/topups/:id/reject — ปฏิเสธเติมเงิน
const rejectTopup = async (req, res) => {
  try {
    const tx = await Transaction.getById(req.params.id);
    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });
    if (tx.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Transaction already processed' });
    }

    await Transaction.rejectTopup(tx.id);
    res.json({ success: true, message: 'Rejected' });
  } catch (err) {
    console.error('rejectTopup error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getPendingTopups, approveTopup, rejectTopup };
