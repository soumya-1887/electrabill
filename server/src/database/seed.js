/**
 * Optional Database Seeder Script
 * Run with: npm run seed
 */

const { initDatabase } = require('./db');
const { calculateElectricityBill } = require('../services/billingService');

function seed() {
  const db = initDatabase();

  console.log('🌱 Seeding ElectraBill SQLite Database...');

  // Clear existing
  db.exec('PRAGMA foreign_keys = OFF;');
  db.exec('DELETE FROM bills;');
  db.exec('DELETE FROM customers;');
  try {
    db.exec("DELETE FROM sqlite_sequence WHERE name IN ('customers', 'bills');");
  } catch (e) {
    // sqlite_sequence might not exist yet if no autoincrement rows were inserted
  }
  db.exec('PRAGMA foreign_keys = ON;');

  // Insert standard test consumers
  const customers = [
    {
      name: 'Ramesh Sharma',
      meter: 'MTR-10024',
      address: '42 MG Road, Indiranagar, Bengaluru, Karnataka',
      phone: '+91 98765 43210'
    },
    {
      name: 'Priya Patel',
      meter: 'MTR-20455',
      address: '15 Park Street, Kolkata, West Bengal',
      phone: '+91 98234 56789'
    },
    {
      name: 'Vikram Singh',
      meter: 'MTR-30981',
      address: '78 Ring Road, Ahmedabad, Gujarat',
      phone: '+91 97123 45678'
    },
    {
      name: 'Ananya Deshmukh',
      meter: 'MTR-40112',
      address: '10 Shivaji Chowk, Pune, Maharashtra',
      phone: '+91 99887 76655'
    }
  ];

  const insertCustomer = db.prepare(
    'INSERT INTO customers (full_name, meter_number, address, phone) VALUES (?, ?, ?, ?)'
  );

  const customerIds = [];
  for (const c of customers) {
    const res = insertCustomer.run(c.name, c.meter, c.address, c.phone);
    customerIds.push(res.lastInsertRowid);
  }

  // Insert official test case bills matching required table
  // 50 units (₹100), 100 units (₹200), 150 units (₹350), 200 units (₹500), 250 units (₹750), 300 units (₹1000)
  const sampleBills = [
    { customerId: customerIds[0], units: 250, period: 'October 2026', billNumber: 'EB-202610-10024' },
    { customerId: customerIds[1], units: 150, period: 'October 2026', billNumber: 'EB-202610-20455' },
    { customerId: customerIds[2], units: 300, period: 'October 2026', billNumber: 'EB-202610-30981' },
    { customerId: customerIds[3], units: 100, period: 'October 2026', billNumber: 'EB-202610-40112' },
  ];

  const insertBill = db.prepare(`
    INSERT INTO bills (
      bill_number,
      customer_id,
      units_consumed,
      slab_1_amount,
      slab_2_amount,
      slab_3_amount,
      total_amount,
      rate_slab_1,
      rate_slab_2,
      rate_slab_3,
      billing_period,
      due_date,
      status,
      notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const b of sampleBills) {
    const calc = calculateElectricityBill(b.units);
    insertBill.run(
      b.billNumber,
      b.customerId,
      calc.unitsConsumed,
      calc.slab_1_amount,
      calc.slab_2_amount,
      calc.slab_3_amount,
      calc.totalAmount,
      calc.rate_slab_1,
      calc.rate_slab_2,
      calc.rate_slab_3,
      b.period,
      '2026-11-15',
      'Unpaid',
      'Standard progressive tariff calculation verified.'
    );
  }

  console.log('✅ Successfully seeded 4 realistic consumers and 4 verified bills!');
}

if (require.main === module) {
  seed();
}

module.exports = seed;
