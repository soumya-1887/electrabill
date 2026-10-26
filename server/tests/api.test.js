const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const { initDatabase, getDatabase } = require('../src/database/db');
const customerController = require('../src/controllers/customerController');
const billController = require('../src/controllers/billController');
const dashboardController = require('../src/controllers/dashboardController');

// Helper to create mock request and response objects
function createMockRes() {
  return {
    statusCode: 200,
    _data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this._data = data;
      return this;
    }
  };
}

before(() => {
  initDatabase();
});

describe('ElectraBill — API Controller & Database Tests', () => {
  it('Dashboard stats returns valid real metrics', async () => {
    const req = {};
    const res = createMockRes();
    dashboardController.getDashboardStats(req, res, assert.fail);

    assert.equal(res.statusCode, 200);
    assert.equal(res._data.success, true);
    assert.ok(typeof res._data.data.summary.totalCustomers === 'number');
    assert.ok(typeof res._data.data.summary.totalBills === 'number');
    assert.ok(typeof res._data.data.summary.totalUnits === 'number');
    assert.ok(typeof res._data.data.summary.totalAmount === 'number');
  });

  it('Customer Controller: creates new customer with validation', async () => {
    const uniqueMeter = `MTR-TEST-${Date.now()}`;
    const req = {
      body: {
        full_name: 'Aditi Rao',
        meter_number: uniqueMeter,
        address: '404 Cyber City, Gurugram',
        phone: '+91 91234 56789'
      }
    };
    const res = createMockRes();
    customerController.createCustomer(req, res, assert.fail);

    assert.equal(res.statusCode, 201);
    assert.equal(res._data.success, true);
    assert.equal(res._data.data.full_name, 'Aditi Rao');
    assert.equal(res._data.data.meter_number, uniqueMeter);
  });

  it('Customer Controller: rejects duplicate meter numbers', async () => {
    const duplicateMeter = `MTR-DUP-${Date.now()}`;
    // First creation
    const req1 = { body: { full_name: 'Original User', meter_number: duplicateMeter } };
    const res1 = createMockRes();
    customerController.createCustomer(req1, res1, assert.fail);
    assert.equal(res1.statusCode, 201);

    // Duplicate creation
    const req2 = { body: { full_name: 'Duplicate User', meter_number: duplicateMeter } };
    const res2 = createMockRes();
    customerController.createCustomer(req2, res2, assert.fail);

    assert.equal(res2.statusCode, 409);
    assert.equal(res2._data.success, false);
    assert.match(res2._data.error, /already registered/);
  });

  it('Bill Controller: calculatePreview returns instant breakdown without saving', async () => {
    const req = { body: { units: 250 } };
    const res = createMockRes();
    billController.calculatePreview(req, res, assert.fail);

    assert.equal(res.statusCode, 200);
    assert.equal(res._data.data.totalAmount, 750);
    assert.equal(res._data.data.slab_1_amount, 200);
    assert.equal(res._data.data.slab_2_amount, 300);
    assert.equal(res._data.data.slab_3_amount, 250);
  });

  it('Bill Controller: createBill performs authoritative calculation and saves to SQLite', async () => {
    // 1. Create a customer
    const meter = `MTR-BILL-${Date.now()}`;
    const custReq = { body: { full_name: 'Sunil Gavaskar', meter_number: meter } };
    const custRes = createMockRes();
    customerController.createCustomer(custReq, custRes, assert.fail);
    const customerId = custRes._data.data.id;

    // 2. Generate bill with 300 units (expected: 1000)
    // Send a fraudulent total_amount from client to verify backend ignores client total!
    const billReq = {
      body: {
        customer_id: customerId,
        units_consumed: 300,
        billing_period: 'October 2026',
        total_amount: 10 // Backend MUST recalculate and ignore 10!
      }
    };
    const billRes = createMockRes();
    billController.createBill(billReq, billRes, assert.fail);

    assert.equal(billRes.statusCode, 201);
    assert.equal(billRes._data.success, true);
    assert.equal(billRes._data.data.total_amount, 1000, 'Must be authoritative ₹1,000');
    assert.equal(billRes._data.data.units_consumed, 300);
    assert.equal(billRes._data.data.customer_name, 'Sunil Gavaskar');
    assert.ok(billRes._data.data.bill_number.startsWith('EB-'));
  });

  it('Customer Controller: enforces safe deletion policy when bills exist', async () => {
    // 1. Create customer
    const meter = `MTR-GUARD-${Date.now()}`;
    const custReq = { body: { full_name: 'Guard User', meter_number: meter } };
    const custRes = createMockRes();
    customerController.createCustomer(custReq, custRes, assert.fail);
    const customerId = custRes._data.data.id;

    // 2. Attach a bill
    const billReq = { body: { customer_id: customerId, units_consumed: 150 } };
    const billRes = createMockRes();
    billController.createBill(billReq, billRes, assert.fail);

    // 3. Delete without force -> must reject with 409
    const delReq1 = { params: { id: customerId }, query: {} };
    const delRes1 = createMockRes();
    customerController.deleteCustomer(delReq1, delRes1, assert.fail);

    assert.equal(delRes1.statusCode, 409);
    assert.equal(delRes1._data.requiresConfirmation, true);

    // 4. Delete with force=true -> succeeds
    const delReq2 = { params: { id: customerId }, query: { force: 'true' } };
    const delRes2 = createMockRes();
    customerController.deleteCustomer(delReq2, delRes2, assert.fail);

    assert.equal(delRes2.statusCode, 200);
    assert.equal(delRes2._data.success, true);
  });

  it('Bill Controller: list bills with search and pagination', async () => {
    const req = { query: { page: 1, limit: 10 } };
    const res = createMockRes();
    billController.getBills(req, res, assert.fail);

    assert.equal(res.statusCode, 200);
    assert.ok(Array.isArray(res._data.data));
    assert.ok(res._data.pagination.total >= 0);
  });
});
