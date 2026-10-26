/**
 * Customer Controller
 */

const db = require('../database/db');

/**
 * Get all customers with search and pagination
 */
function getCustomers(req, res, next) {
  try {
    const { search = '', page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    let countSql = `SELECT COUNT(*) as total FROM customers`;
    let querySql = `
      SELECT c.*, 
        (SELECT COUNT(*) FROM bills b WHERE b.customer_id = c.id) as bills_count,
        (SELECT COALESCE(SUM(total_amount), 0) FROM bills b WHERE b.customer_id = c.id) as total_spent,
        (SELECT COALESCE(SUM(units_consumed), 0) FROM bills b WHERE b.customer_id = c.id) as total_units
      FROM customers c
    `;
    const params = [];
    const countParams = [];

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      countSql += ` WHERE full_name LIKE ? OR meter_number LIKE ?`;
      querySql += ` WHERE full_name LIKE ? OR meter_number LIKE ?`;
      countParams.push(searchTerm, searchTerm);
      params.push(searchTerm, searchTerm);
    }

    querySql += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
    params.push(limitNum, offset);

    const countRow = db.get(countSql, countParams);
    const total = countRow ? countRow.total : 0;
    const customers = db.all(querySql, params);

    res.json({
      success: true,
      data: customers,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single customer by ID with their bill history
 */
function getCustomerById(req, res, next) {
  try {
    const { id } = req.params;
    const customer = db.get(`SELECT * FROM customers WHERE id = ?`, [id]);

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: `Customer with ID ${id} not found.`
      });
    }

    // Fetch customer's bills
    const bills = db.all(
      `SELECT * FROM bills WHERE customer_id = ? ORDER BY generated_at DESC`,
      [id]
    );

    const stats = db.get(
      `SELECT 
        COUNT(*) as total_bills,
        COALESCE(SUM(units_consumed), 0) as total_units,
        COALESCE(SUM(total_amount), 0) as total_spent
       FROM bills WHERE customer_id = ?`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...customer,
        stats: stats || { total_bills: 0, total_units: 0, total_spent: 0 },
        bills
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new customer
 */
function createCustomer(req, res, next) {
  try {
    const { full_name, meter_number, address, phone } = req.body;

    // Validation
    if (!full_name || typeof full_name !== 'string' || !full_name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Customer full name is required.'
      });
    }

    if (!meter_number || typeof meter_number !== 'string' || !meter_number.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Meter number is required.'
      });
    }

    const cleanName = full_name.trim();
    const cleanMeter = meter_number.trim().toUpperCase();
    const cleanAddress = address && typeof address === 'string' ? address.trim() : '';
    const cleanPhone = phone && typeof phone === 'string' ? phone.trim() : '';

    // Check if meter number already exists
    const existing = db.get(`SELECT id FROM customers WHERE meter_number = ?`, [cleanMeter]);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: `Meter number "${cleanMeter}" is already registered to another customer.`
      });
    }

    const result = db.run(
      `INSERT INTO customers (full_name, meter_number, address, phone) VALUES (?, ?, ?, ?)`,
      [cleanName, cleanMeter, cleanAddress, cleanPhone]
    );

    const newCustomer = db.get(`SELECT * FROM customers WHERE id = ?`, [result.lastInsertRowid]);

    res.status(201).json({
      success: true,
      message: 'Customer registered successfully.',
      data: newCustomer
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update customer details
 */
function updateCustomer(req, res, next) {
  try {
    const { id } = req.params;
    const { full_name, meter_number, address, phone } = req.body;

    const existing = db.get(`SELECT * FROM customers WHERE id = ?`, [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: `Customer with ID ${id} not found.`
      });
    }

    if (!full_name || typeof full_name !== 'string' || !full_name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Customer full name is required.'
      });
    }

    if (!meter_number || typeof meter_number !== 'string' || !meter_number.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Meter number is required.'
      });
    }

    const cleanName = full_name.trim();
    const cleanMeter = meter_number.trim().toUpperCase();
    const cleanAddress = address && typeof address === 'string' ? address.trim() : '';
    const cleanPhone = phone && typeof phone === 'string' ? phone.trim() : '';

    // Check if new meter number conflicts with another customer
    const conflict = db.get(
      `SELECT id FROM customers WHERE meter_number = ? AND id != ?`,
      [cleanMeter, id]
    );
    if (conflict) {
      return res.status(409).json({
        success: false,
        error: `Meter number "${cleanMeter}" is already registered to another customer.`
      });
    }

    db.run(
      `UPDATE customers SET full_name = ?, meter_number = ?, address = ?, phone = ? WHERE id = ?`,
      [cleanName, cleanMeter, cleanAddress, cleanPhone, id]
    );

    const updated = db.get(`SELECT * FROM customers WHERE id = ?`, [id]);

    res.json({
      success: true,
      message: 'Customer updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a customer safely
 * If customer has bills, requires ?force=true or refuses deletion
 */
function deleteCustomer(req, res, next) {
  try {
    const { id } = req.params;
    const { force } = req.query;

    const customer = db.get(`SELECT * FROM customers WHERE id = ?`, [id]);
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: `Customer with ID ${id} not found.`
      });
    }

    const billCountRow = db.get(`SELECT COUNT(*) as count FROM bills WHERE customer_id = ?`, [id]);
    const billCount = billCountRow ? billCountRow.count : 0;

    if (billCount > 0 && force !== 'true') {
      return res.status(409).json({
        success: false,
        requiresConfirmation: true,
        billsCount: billCount,
        error: `Cannot delete customer "${customer.full_name}". They have ${billCount} linked bill(s). Pass force=true if you want to permanently delete customer and all associated bills.`
      });
    }

    // If force=true, delete associated bills first, then customer
    if (billCount > 0 && force === 'true') {
      db.run(`DELETE FROM bills WHERE customer_id = ?`, [id]);
    }

    db.run(`DELETE FROM customers WHERE id = ?`, [id]);

    res.json({
      success: true,
      message: `Customer "${customer.full_name}" ${billCount > 0 ? `and ${billCount} associated bill(s)` : ''} successfully deleted.`
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Optional seed helper for development / demonstration
 */
function seedSampleCustomers(req, res, next) {
  try {
    const samples = [
      { name: 'Arjun Mehta', meter: 'MTR-10024', address: '42 MG Road, Indiranagar, Bengaluru', phone: '+91 98765 43210' },
      { name: 'Priya Sharma', meter: 'MTR-20455', address: '15 Park Street, Kolkata, West Bengal', phone: '+91 98234 56789' },
      { name: 'Rajesh Patel', meter: 'MTR-30981', address: '78 Ring Road, Ahmedabad, Gujarat', phone: '+91 97123 45678' },
      { name: 'Ananya Deshmukh', meter: 'MTR-40112', address: '10 Shivaji Chowk, Pune, Maharashtra', phone: '+91 99887 76655' }
    ];

    let added = 0;
    for (const s of samples) {
      const exists = db.get(`SELECT id FROM customers WHERE meter_number = ?`, [s.meter]);
      if (!exists) {
        db.run(
          `INSERT INTO customers (full_name, meter_number, address, phone) VALUES (?, ?, ?, ?)`,
          [s.name, s.meter, s.address, s.phone]
        );
        added++;
      }
    }

    res.json({
      success: true,
      message: `${added} sample customer(s) added successfully.`
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  seedSampleCustomers
};
