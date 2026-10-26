/**
 * Billing Calculation Module for ElectraBill
 * 
 * Implements the progressive pricing system:
 * - First 100 units (1 - 100): ₹2 per unit
 * - Next 100 units (101 - 200): ₹3 per unit
 * - Units above 200 (> 200): ₹5 per unit
 * 
 * Each slab is calculated independently (marginal pricing).
 */

const TARIFF_RATES = {
  SLAB_1_LIMIT: 100,
  SLAB_1_RATE: 2.0,
  SLAB_2_LIMIT: 200,
  SLAB_2_RATE: 3.0,
  SLAB_3_RATE: 5.0,
};

/**
 * Format a number as Indian Rupee (INR) currency string
 * e.g. 750 -> "₹750", 1000 -> "₹1,000", 1250.5 -> "₹1,250.50"
 */
function formatINR(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '₹0';
  }
  return '₹' + amount.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2
  });
}

/**
 * Calculate electricity bill charges based on progressive pricing slabs
 * 
 * @param {number|string} units - Number of units consumed
 * @returns {Object} Structured bill calculation breakdown
 * @throws {Error} If units input is invalid, negative, or non-numeric
 */
function calculateElectricityBill(units) {
  // Input validation
  if (units === null || units === undefined || units === '') {
    throw new Error('Units consumed is required.');
  }

  const numericUnits = Number(units);

  if (isNaN(numericUnits) || !isFinite(numericUnits)) {
    throw new Error('Units consumed must be a valid numeric value.');
  }

  if (numericUnits < 0) {
    throw new Error('Units consumed cannot be negative.');
  }

  // Handle fractional units up to 2 decimal places cleanly
  const roundedUnits = Math.round(numericUnits * 100) / 100;

  // Progressive slab calculation
  let slab1Units = 0;
  let slab2Units = 0;
  let slab3Units = 0;

  if (roundedUnits <= TARIFF_RATES.SLAB_1_LIMIT) {
    slab1Units = roundedUnits;
  } else if (roundedUnits <= TARIFF_RATES.SLAB_2_LIMIT) {
    slab1Units = TARIFF_RATES.SLAB_1_LIMIT;
    slab2Units = roundedUnits - TARIFF_RATES.SLAB_1_LIMIT;
  } else {
    slab1Units = TARIFF_RATES.SLAB_1_LIMIT;
    slab2Units = TARIFF_RATES.SLAB_2_LIMIT - TARIFF_RATES.SLAB_1_LIMIT; // 100 units
    slab3Units = roundedUnits - TARIFF_RATES.SLAB_2_LIMIT;
  }

  // Precision rounding on units
  slab1Units = Math.round(slab1Units * 100) / 100;
  slab2Units = Math.round(slab2Units * 100) / 100;
  slab3Units = Math.round(slab3Units * 100) / 100;

  // Slab amounts
  const slab1Amount = Math.round(slab1Units * TARIFF_RATES.SLAB_1_RATE * 100) / 100;
  const slab2Amount = Math.round(slab2Units * TARIFF_RATES.SLAB_2_RATE * 100) / 100;
  const slab3Amount = Math.round(slab3Units * TARIFF_RATES.SLAB_3_RATE * 100) / 100;

  const totalAmount = Math.round((slab1Amount + slab2Amount + slab3Amount) * 100) / 100;

  return {
    unitsConsumed: roundedUnits,
    tariffRates: {
      slab1Rate: TARIFF_RATES.SLAB_1_RATE,
      slab2Rate: TARIFF_RATES.SLAB_2_RATE,
      slab3Rate: TARIFF_RATES.SLAB_3_RATE,
    },
    slabs: [
      {
        slabNumber: 1,
        slabRange: 'First 100 units (1–100)',
        units: slab1Units,
        rate: TARIFF_RATES.SLAB_1_RATE,
        amount: slab1Amount,
        formattedRate: `₹${TARIFF_RATES.SLAB_1_RATE}/unit`,
        formattedAmount: formatINR(slab1Amount),
        isApplicable: roundedUnits > 0
      },
      {
        slabNumber: 2,
        slabRange: 'Units 101–200',
        units: slab2Units,
        rate: TARIFF_RATES.SLAB_2_RATE,
        amount: slab2Amount,
        formattedRate: `₹${TARIFF_RATES.SLAB_2_RATE}/unit`,
        formattedAmount: formatINR(slab2Amount),
        isApplicable: roundedUnits > 100
      },
      {
        slabNumber: 3,
        slabRange: 'Units above 200 (>200)',
        units: slab3Units,
        rate: TARIFF_RATES.SLAB_3_RATE,
        amount: slab3Amount,
        formattedRate: `₹${TARIFF_RATES.SLAB_3_RATE}/unit`,
        formattedAmount: formatINR(slab3Amount),
        isApplicable: roundedUnits > 200
      }
    ],
    slab_1_amount: slab1Amount,
    slab_2_amount: slab2Amount,
    slab_3_amount: slab3Amount,
    rate_slab_1: TARIFF_RATES.SLAB_1_RATE,
    rate_slab_2: TARIFF_RATES.SLAB_2_RATE,
    rate_slab_3: TARIFF_RATES.SLAB_3_RATE,
    totalAmount,
    formattedTotal: formatINR(totalAmount),
    currency: 'INR'
  };
}

module.exports = {
  TARIFF_RATES,
  calculateElectricityBill,
  formatINR
};
