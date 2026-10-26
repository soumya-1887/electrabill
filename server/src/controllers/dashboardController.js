/**
 * Dashboard Controller
 * Aggregates real metrics from SQLite database without dummy values
 */

const db = require('../database/db');
const { formatINR } = require('../services/billingService');

function getDashboardStats(req, res, next) {
  try {
    // 1. Total customers
    const customerRow = db.get(`SELECT COUNT(*) as count FROM customers`);
    const totalCustomers = customerRow ? customerRow.count : 0;

    // 2. Total bills, total units, total revenue
    const billStats = db.get(`
      SELECT 
        COUNT(*) as total_bills,
        COALESCE(SUM(units_consumed), 0) as total_units,
        COALESCE(SUM(total_amount), 0) as total_amount,
        COALESCE(SUM(slab_1_amount), 0) as total_slab_1,
        COALESCE(SUM(slab_2_amount), 0) as total_slab_2,
        COALESCE(SUM(slab_3_amount), 0) as total_slab_3,
        COALESCE(AVG(units_consumed), 0) as avg_units,
        COALESCE(AVG(total_amount), 0) as avg_amount
      FROM bills
    `);

    const totalBills = billStats ? billStats.total_bills : 0;
    const totalUnits = billStats ? Math.round(billStats.total_units * 100) / 100 : 0;
    const totalAmount = billStats ? Math.round(billStats.total_amount * 100) / 100 : 0;

    // 3. Recent bills (last 6 records)
    const recentBills = db.all(`
      SELECT b.id, b.bill_number, b.units_consumed, b.total_amount, b.billing_period, b.generated_at, b.status,
             c.id as customer_id, c.full_name as customer_name, c.meter_number
      FROM bills b
      JOIN customers c ON b.customer_id = c.id
      ORDER BY b.generated_at DESC, b.id DESC
      LIMIT 6
    `).map(b => ({
      ...b,
      formatted_amount: formatINR(b.total_amount)
    }));

    // 4. Consumption and revenue analytics for Recharts
    // Monthly trend or last bills trend
    const recentTrends = db.all(`
      SELECT b.id, b.bill_number, b.units_consumed, b.total_amount, b.generated_at, c.full_name as customer_name
      FROM bills b
      JOIN customers c ON b.customer_id = c.id
      ORDER BY b.generated_at ASC
      LIMIT 12
    `);

    // Slab revenue distribution
    const slabDistribution = [
      { name: 'Slab 1 (1–100 units @ ₹2)', amount: billStats ? billStats.total_slab_1 : 0, color: '#06b6d4' },
      { name: 'Slab 2 (101–200 units @ ₹3)', amount: billStats ? billStats.total_slab_2 : 0, color: '#3b82f6' },
      { name: 'Slab 3 (>200 units @ ₹5)', amount: billStats ? billStats.total_slab_3 : 0, color: '#6366f1' },
    ];

    res.json({
      success: true,
      data: {
        summary: {
          totalCustomers,
          totalBills,
          totalUnits,
          totalAmount,
          formattedTotalAmount: formatINR(totalAmount),
          avgUnits: Math.round((billStats ? billStats.avg_units : 0) * 10) / 10,
          avgAmount: Math.round((billStats ? billStats.avg_amount : 0) * 100) / 100,
          formattedAvgAmount: formatINR(billStats ? billStats.avg_amount : 0)
        },
        recentBills,
        recentTrends,
        slabDistribution,
        isEmpty: totalBills === 0 && totalCustomers === 0
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardStats
};
