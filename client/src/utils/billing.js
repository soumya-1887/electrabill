/**
 * Client-side Electricity Billing Calculation Engine
 * Matches the authoritative backend business logic for instantaneous live preview
 */

export const TARIFF_RATES = {
  SLAB_1_LIMIT: 100,
  SLAB_1_RATE: 2.0,
  SLAB_2_LIMIT: 200,
  SLAB_2_RATE: 3.0,
  SLAB_3_RATE: 5.0,
};

export function calculateElectricityBill(units) {
  if (units === null || units === undefined || units === '') {
    return {
      isValid: false,
      error: 'Please enter units consumed.',
      totalAmount: 0,
      slabs: []
    };
  }

  const numericUnits = Number(units);

  if (isNaN(numericUnits) || !isFinite(numericUnits)) {
    return {
      isValid: false,
      error: 'Units must be a valid number.',
      totalAmount: 0,
      slabs: []
    };
  }

  if (numericUnits < 0) {
    return {
      isValid: false,
      error: 'Units consumed cannot be negative.',
      totalAmount: 0,
      slabs: []
    };
  }

  const roundedUnits = Math.round(numericUnits * 100) / 100;

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
    slab2Units = TARIFF_RATES.SLAB_2_LIMIT - TARIFF_RATES.SLAB_1_LIMIT;
    slab3Units = roundedUnits - TARIFF_RATES.SLAB_2_LIMIT;
  }

  slab1Units = Math.round(slab1Units * 100) / 100;
  slab2Units = Math.round(slab2Units * 100) / 100;
  slab3Units = Math.round(slab3Units * 100) / 100;

  const slab1Amount = Math.round(slab1Units * TARIFF_RATES.SLAB_1_RATE * 100) / 100;
  const slab2Amount = Math.round(slab2Units * TARIFF_RATES.SLAB_2_RATE * 100) / 100;
  const slab3Amount = Math.round(slab3Units * TARIFF_RATES.SLAB_3_RATE * 100) / 100;

  const totalAmount = Math.round((slab1Amount + slab2Amount + slab3Amount) * 100) / 100;

  return {
    isValid: true,
    error: null,
    unitsConsumed: roundedUnits,
    slab_1_amount: slab1Amount,
    slab_2_amount: slab2Amount,
    slab_3_amount: slab3Amount,
    rate_slab_1: TARIFF_RATES.SLAB_1_RATE,
    rate_slab_2: TARIFF_RATES.SLAB_2_RATE,
    rate_slab_3: TARIFF_RATES.SLAB_3_RATE,
    totalAmount,
    slabs: [
      {
        slabNumber: 1,
        slabRange: 'First 100 units (1–100)',
        units: slab1Units,
        rate: TARIFF_RATES.SLAB_1_RATE,
        amount: slab1Amount,
        isApplicable: roundedUnits > 0
      },
      {
        slabNumber: 2,
        slabRange: 'Units 101–200',
        units: slab2Units,
        rate: TARIFF_RATES.SLAB_2_RATE,
        amount: slab2Amount,
        isApplicable: roundedUnits > 100
      },
      {
        slabNumber: 3,
        slabRange: 'Units above 200 (>200)',
        units: slab3Units,
        rate: TARIFF_RATES.SLAB_3_RATE,
        amount: slab3Amount,
        isApplicable: roundedUnits > 200
      }
    ]
  };
}
