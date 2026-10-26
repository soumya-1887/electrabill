/**
 * Formatting Utilities
 */

/**
 * Format amount as Indian Rupees (INR)
 */
export function formatINR(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }
  const numeric = Number(amount);
  return '₹' + numeric.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(numeric) ? 0 : 2
  });
}

/**
 * Format units with kWh label
 */
export function formatUnits(units) {
  if (units === null || units === undefined || isNaN(units)) {
    return '0 kWh';
  }
  const numeric = Number(units);
  return `${numeric.toLocaleString('en-IN', { maximumFractionDigits: 2 })} kWh`;
}

/**
 * Format date string to friendly readable format
 */
export function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

/**
 * Format datetime to friendly readable format
 */
export function formatDateTime(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
}
