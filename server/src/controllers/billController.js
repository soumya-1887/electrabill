/**
 * Bill Controller
 */

const db = require('../database/db');
const { calculateElectricityBill, formatINR } = require('../services/billingService');

/**
 * Generate a clean, unique bill number
 * Format: EB-YYYYMM-XXXXX (e.g. EB-202610-84291)
 */
function generateBillNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  return `EB-${year}${month}-${randomSuffix}`;
}

/**
 * Calculate electricity bill preview (does not persist)
 */
function calculatePreview(req, res, next) {
  try {
    const { units } = req.body;
    const calculation = calculateElectricityBill(units);
    res.json({
      success: true,
      data: calculation
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Calculate and save an authoritative electricity bill
 * Authoritative: the backend calculates the bill independently from units_consumed
 */
function createBill(req, res, next) {
  try {
    const {
      customer_id,
      customer_name,
      meter_number,
      address,
      units_consumed,
      billing_period,
      due_date,
      notes
    } = req.body;

    // 1. Verify or create customer
    let targetCustomerId = customer_id;

    if (!targetCustomerId) {
      // If customer details were provided inline instead of an ID
      if (!customer_name || !meter_number) {
        return res.status(400).json({
          success: false,
          error: 'Either a valid customer_id or customer_name and meter_number must be provided.'
        });
      }

      const cleanMeter = meter_number.trim().toUpperCase();
      let existingCustomer = db.get(`SELECT * FROM customers WHERE meter_number = ?`, [cleanMeter]);

      if (existingCustomer) {
        targetCustomerId = existingCustomer.id;
      } else {
        const insertCust = db.run(
          `INSERT INTO customers (full_name, meter_number, address) VALUES (?, ?, ?)`,
          [customer_name.trim(), cleanMeter, address ? address.trim() : '']
        );
        targetCustomerId = insertCust.lastInsertRowid;
      }
    } else {
      // Verify customer exists
      const cust = db.get(`SELECT * FROM customers WHERE id = ?`, [targetCustomerId]);
      if (!cust) {
        return res.status(404).json({
          success: false,
          error: `Customer with ID ${targetCustomerId} does not exist.`
        });
      }
    }

    // 2. Authoritative backend calculation
    // Throws descriptive validation error if units is invalid or negative
    const calculation = calculateElectricityBill(units_consumed);

    // 3. Generate unique bill number
    let billNumber = generateBillNumber();
    let collisionCheck = db.get(`SELECT id FROM bills WHERE bill_number = ?`, [billNumber]);
    while (collisionCheck) {
      billNumber = generateBillNumber();
      collisionCheck = db.get(`SELECT id FROM bills WHERE bill_number = ?`, [billNumber]);
    }

    // Default billing period if empty
    const now = new Date();
    const period = billing_period && billing_period.trim()
      ? billing_period.trim()
      : now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    // Default due date (15 days from now) if not provided
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 15);
    const finalDueDate = due_date && due_date.trim()
      ? due_date.trim()
      : defaultDueDate.toISOString().split('T')[0];

    // 4. Persist to database
    const insertResult = db.run(
      `INSERT INTO bills (
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        billNumber,
        targetCustomerId,
        calculation.unitsConsumed,
        calculation.slab_1_amount,
        calculation.slab_2_amount,
        calculation.slab_3_amount,
        calculation.totalAmount,
        calculation.rate_slab_1,
        calculation.rate_slab_2,
        calculation.rate_slab_3,
        period,
        finalDueDate,
        'Unpaid',
        notes ? notes.trim() : ''
      ]
    );

    // 5. Retrieve full bill with customer details
    const savedBill = getBillRecord(insertResult.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Electricity bill generated and saved successfully.',
      data: savedBill
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Helper to fetch a bill with customer info and reconstructed breakdown
 */
function getBillRecord(billId) {
  const row = db.get(
    `SELECT b.*, c.full_name as customer_name, c.meter_number, c.address as customer_address, c.phone as customer_phone
     FROM bills b
     JOIN customers c ON b.customer_id = c.id
     WHERE b.id = ?`,
    [billId]
  );

  if (!row) return null;

  // Reconstruct slab items using the saved historical rates
  const units = row.units_consumed;
  const s1Units = Math.min(Math.max(units, 0), 100);
  const s2Units = units > 100 ? Math.min(units - 100, 100) : 0;
  const s3Units = units > 200 ? units - 200 : 0;

  return {
    ...row,
    formatted_total: formatINR(row.total_amount),
    formatted_slab_1: formatINR(row.slab_1_amount),
    formatted_slab_2: formatINR(row.slab_2_amount),
    formatted_slab_3: formatINR(row.slab_3_amount),
    slabs: [
      {
        slabNumber: 1,
        slabRange: 'First 100 units (1–100)',
        units: s1Units,
        rate: row.rate_slab_1,
        amount: row.slab_1_amount,
        formattedRate: `₹${row.rate_slab_1}/unit`,
        formattedAmount: formatINR(row.slab_1_amount),
        isApplicable: units > 0
      },
      {
        slabNumber: 2,
        slabRange: 'Units 101–200',
        units: s2Units,
        rate: row.rate_slab_2,
        amount: row.slab_2_amount,
        formattedRate: `₹${row.rate_slab_2}/unit`,
        formattedAmount: formatINR(row.slab_2_amount),
        isApplicable: units > 100
      },
      {
        slabNumber: 3,
        slabRange: 'Units above 200 (>200)',
        units: s3Units,
        rate: row.rate_slab_3,
        amount: row.slab_3_amount,
        formattedRate: `₹${row.rate_slab_3}/unit`,
        formattedAmount: formatINR(row.slab_3_amount),
        isApplicable: units > 200
      }
    ]
  };
}

/**
 * List bills with search, date filters, sorting, and pagination
 */
function getBills(req, res, next) {
  try {
    const {
      search = '',
      startDate,
      endDate,
      sortBy = 'date',
      sortOrder = 'DESC',
      page = 1,
      limit = 10
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const params = [];

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      conditions.push(`(c.full_name LIKE ? OR c.meter_number LIKE ? OR b.bill_number LIKE ?)`);
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (startDate) {
      conditions.push(`b.generated_at >= ?`);
      params.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      conditions.push(`b.generated_at <= ?`);
      params.push(`${endDate} 23:59:59`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total matching records
    const countSql = `
      SELECT COUNT(*) as total 
      FROM bills b 
      JOIN customers c ON b.customer_id = c.id 
      ${whereClause}
    `;
    const countRow = db.get(countSql, params);
    const total = countRow ? countRow.total : 0;

    // Sorting map
    const orderDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    let orderColumn = 'b.id';
    if (sortBy === 'date') orderColumn = 'b.generated_at';
    else if (sortBy === 'amount') orderColumn = 'b.total_amount';
    else if (sortBy === 'units') orderColumn = 'b.units_consumed';
    else if (sortBy === 'customer') orderColumn = 'c.full_name';

    const dataSql = `
      SELECT b.*, c.full_name as customer_name, c.meter_number, c.address as customer_address, c.phone as customer_phone
      FROM bills b
      JOIN customers c ON b.customer_id = c.id
      ${whereClause}
      ORDER BY ${orderColumn} ${orderDirection}
      LIMIT ? OFFSET ?
    `;

    const rows = db.all(dataSql, [...params, limitNum, offset]);

    const formattedBills = rows.map(r => ({
      ...r,
      formatted_total: formatINR(r.total_amount)
    }));

    res.json({
      success: true,
      data: formattedBills,
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
 * Get bill details by ID
 */
function getBillById(req, res, next) {
  try {
    const { id } = req.params;
    const bill = getBillRecord(id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        error: `Bill with ID ${id} not found.`
      });
    }

    res.json({
      success: true,
      data: bill
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a bill by ID
 */
function deleteBill(req, res, next) {
  try {
    const { id } = req.params;
    const bill = db.get(`SELECT bill_number FROM bills WHERE id = ?`, [id]);

    if (!bill) {
      return res.status(404).json({
        success: false,
        error: `Bill with ID ${id} not found.`
      });
    }

    db.run(`DELETE FROM bills WHERE id = ?`, [id]);

    res.json({
      success: true,
      message: `Bill ${bill.bill_number} successfully deleted.`
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  calculatePreview,
  createBill,
  getBills,
  getBillById,
  deleteBill
};
