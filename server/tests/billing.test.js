const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { calculateElectricityBill, formatINR } = require('../src/services/billingService');

describe('ElectraBill — Progressive Billing Engine Tests', () => {
  describe('1. Required Mandatory Test Cases', () => {
    const requiredCases = [
      { units: 0, expectedTotal: 0, expectedFormatted: '₹0' },
      { units: 50, expectedTotal: 100, expectedFormatted: '₹100' },
      { units: 100, expectedTotal: 200, expectedFormatted: '₹200' },
      { units: 150, expectedTotal: 350, expectedFormatted: '₹350' },
      { units: 200, expectedTotal: 500, expectedFormatted: '₹500' },
      { units: 250, expectedTotal: 750, expectedFormatted: '₹750' },
      { units: 300, expectedTotal: 1000, expectedFormatted: '₹1,000' },
    ];

    for (const { units, expectedTotal, expectedFormatted } of requiredCases) {
      it(`calculates exactly ${expectedFormatted} for ${units} units`, () => {
        const result = calculateElectricityBill(units);
        assert.equal(result.totalAmount, expectedTotal, `Total for ${units} units should be ${expectedTotal}`);
        assert.equal(result.formattedTotal, expectedFormatted, `Formatted total should match ${expectedFormatted}`);
      });
    }
  });

  describe('2. Detailed Slab Breakdown Verifications', () => {
    it('correctly calculates slab units and amounts for 250 units', () => {
      const result = calculateElectricityBill(250);
      assert.equal(result.unitsConsumed, 250);
      assert.equal(result.slab_1_amount, 200); // 100 * 2
      assert.equal(result.slab_2_amount, 300); // 100 * 3
      assert.equal(result.slab_3_amount, 250); // 50 * 5
      assert.equal(result.totalAmount, 750);

      // Verify individual slab items
      assert.equal(result.slabs[0].units, 100);
      assert.equal(result.slabs[0].rate, 2);
      assert.equal(result.slabs[0].amount, 200);

      assert.equal(result.slabs[1].units, 100);
      assert.equal(result.slabs[1].rate, 3);
      assert.equal(result.slabs[1].amount, 300);

      assert.equal(result.slabs[2].units, 50);
      assert.equal(result.slabs[2].rate, 5);
      assert.equal(result.slabs[2].amount, 250);
    });

    it('correctly reports slab applicability flags', () => {
      const res50 = calculateElectricityBill(50);
      assert.equal(res50.slabs[0].isApplicable, true);
      assert.equal(res50.slabs[1].isApplicable, false);
      assert.equal(res50.slabs[2].isApplicable, false);

      const res150 = calculateElectricityBill(150);
      assert.equal(res150.slabs[0].isApplicable, true);
      assert.equal(res150.slabs[1].isApplicable, true);
      assert.equal(res150.slabs[2].isApplicable, false);

      const res300 = calculateElectricityBill(300);
      assert.equal(res300.slabs[0].isApplicable, true);
      assert.equal(res300.slabs[1].isApplicable, true);
      assert.equal(res300.slabs[2].isApplicable, true);
    });
  });

  describe('3. Boundary and Decimal Units', () => {
    it('handles exact boundary unit values (100 and 200)', () => {
      const bill100 = calculateElectricityBill(100);
      assert.equal(bill100.totalAmount, 200);
      assert.equal(bill100.slab_2_amount, 0);

      const bill200 = calculateElectricityBill(200);
      assert.equal(bill200.totalAmount, 500);
      assert.equal(bill200.slab_3_amount, 0);
    });

    it('handles decimal units correctly', () => {
      // 75.5 units: 75.5 * 2 = 151
      const res1 = calculateElectricityBill(75.5);
      assert.equal(res1.totalAmount, 151);

      // 150.5 units: 100 * 2 + 50.5 * 3 = 200 + 151.5 = 351.5
      const res2 = calculateElectricityBill(150.5);
      assert.equal(res2.totalAmount, 351.5);

      // 250.75 units: 100 * 2 + 100 * 3 + 50.75 * 5 = 200 + 300 + 253.75 = 753.75
      const res3 = calculateElectricityBill(250.75);
      assert.equal(res3.totalAmount, 753.75);
    });

    it('parses valid numeric strings cleanly', () => {
      const res = calculateElectricityBill('150');
      assert.equal(res.totalAmount, 350);
    });
  });

  describe('4. Input Validation and Error Handling', () => {
    it('throws error for negative units', () => {
      assert.throws(() => calculateElectricityBill(-10), /Units consumed cannot be negative/);
      assert.throws(() => calculateElectricityBill(-0.01), /Units consumed cannot be negative/);
    });

    it('throws error for non-numeric input', () => {
      assert.throws(() => calculateElectricityBill('abc'), /valid numeric value/);
      assert.throws(() => calculateElectricityBill(NaN), /valid numeric value/);
      assert.throws(() => calculateElectricityBill(Infinity), /valid numeric value/);
    });

    it('throws error for missing or empty input', () => {
      assert.throws(() => calculateElectricityBill(null), /Units consumed is required/);
      assert.throws(() => calculateElectricityBill(undefined), /Units consumed is required/);
      assert.throws(() => calculateElectricityBill(''), /Units consumed is required/);
    });
  });

  describe('5. Currency Formatting Helper', () => {
    it('formats numbers into Indian Rupee strings', () => {
      assert.equal(formatINR(0), '₹0');
      assert.equal(formatINR(500), '₹500');
      assert.equal(formatINR(1000), '₹1,000');
      assert.equal(formatINR(100000), '₹1,00,000');
      assert.equal(formatINR(351.5), '₹351.50');
    });
  });
});
