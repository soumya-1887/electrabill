/**
 * API Client for ElectraBill Backend
 */

const BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.error || `HTTP error! status: ${response.status}`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    if (!error.status) {
      console.error(`Network or server error calling ${url}:`, error.message);
    }
    throw error;
  }
}

export const api = {
  // Health
  getHealth: () => request('/health'),

  // Dashboard
  getDashboardStats: () => request('/dashboard/stats'),

  // Customers
  getCustomers: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    return request(`/customers?${query.toString()}`);
  },
  getCustomer: (id) => request(`/customers/${id}`),
  createCustomer: (data) => request('/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateCustomer: (id, data) => request(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteCustomer: (id, force = false) => request(`/customers/${id}${force ? '?force=true' : ''}`, {
    method: 'DELETE',
  }),
  seedSampleCustomers: () => request('/customers/seed/samples', {
    method: 'POST',
  }),

  // Bills
  calculatePreview: (units) => request('/bills/calculate', {
    method: 'POST',
    body: JSON.stringify({ units }),
  }),
  getBills: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    return request(`/bills?${query.toString()}`);
  },
  getBill: (id) => request(`/bills/${id}`),
  createBill: (data) => request('/bills', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deleteBill: (id) => request(`/bills/${id}`, {
    method: 'DELETE',
  }),
};
