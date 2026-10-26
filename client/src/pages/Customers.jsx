import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  PlusCircle,
  Edit2,
  Trash2,
  Eye,
  Gauge,
  MapPin,
  Phone,
  Receipt,
  Sparkles,
  Calendar,
  X,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { formatINR, formatUnits, formatDate } from '../utils/formatters';
import CustomerModal from '../components/CustomerModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import BillModal from '../components/BillModal';
import { useToast } from '../components/Toast';

export default function Customers({ setActiveTab }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });

  // Modal states
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [forceDeleteConfirm, setForceDeleteConfirm] = useState(false);
  const [viewingBill, setViewingBill] = useState(null);

  const { addToast } = useToast();

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.getCustomers({ search, page: pagination.page, limit: pagination.limit });
      if (res.success) {
        setCustomers(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      addToast(err.message || 'Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, pagination.page]);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setIsCustomerModalOpen(true);
  };

  const handleOpenEdit = (customer, e) => {
    e.stopPropagation();
    setEditingCustomer(customer);
    setIsCustomerModalOpen(true);
  };

  const handleOpenDetail = async (customer) => {
    try {
      const res = await api.getCustomer(customer.id);
      if (res.success) {
        setSelectedCustomerDetail(res.data);
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch customer details', 'error');
    }
  };

  const handleDeleteRequest = (customer, e) => {
    if (e) e.stopPropagation();
    setDeleteTarget(customer);
    setForceDeleteConfirm(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      await api.deleteCustomer(deleteTarget.id, forceDeleteConfirm);
      addToast(
        `Customer "${deleteTarget.full_name}" deleted successfully.`,
        'success'
      );
      setDeleteTarget(null);
      setForceDeleteConfirm(false);
      if (selectedCustomerDetail && selectedCustomerDetail.id === deleteTarget.id) {
        setSelectedCustomerDetail(null);
      }
      fetchCustomers();
    } catch (err) {
      if (err.data && err.data.requiresConfirmation) {
        setForceDeleteConfirm(true);
      } else {
        addToast(err.message || 'Failed to delete customer', 'error');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSeedSamples = async () => {
    try {
      const res = await api.seedSampleCustomers();
      addToast(res.message, 'success');
      fetchCustomers();
    } catch (err) {
      addToast(err.message || 'Failed to load samples', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Customer Directory
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Manage consumer profiles, metered connections, and billing histories
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchCustomers}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm"
            title="Refresh Directory"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-glow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name or meter number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 transition-all"
          />
        </div>

        <div className="text-xs font-semibold text-slate-500 self-start sm:self-auto">
          Showing {customers.length} of {pagination.total} consumers
        </div>
      </div>

      {/* Customers List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-200/70 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-card text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center mx-auto">
            <Users className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-lg font-bold text-slate-900">No Customers Found</h3>
            <p className="text-xs text-slate-500">
              {search
                ? `No consumers matched your search term "${search}".`
                : 'Your database currently has no registered electricity consumers.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors"
            >
              Add New Customer
            </button>
            <button
              onClick={handleSeedSamples}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
              <span>Load Sample Test Customers</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/60 uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-6">Customer Name</th>
                  <th className="py-3 px-6">Meter Number</th>
                  <th className="py-3 px-6">Address</th>
                  <th className="py-3 px-6">Bills Count</th>
                  <th className="py-3 px-6">Total Billed</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => handleOpenDetail(c)}
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 group-hover:text-cyan-700 transition-colors">
                        {c.full_name}
                      </div>
                      {c.phone && <div className="text-xs text-slate-400">{c.phone}</div>}
                    </td>

                    <td className="py-4 px-6 font-mono font-bold text-cyan-700">
                      <span className="px-2 py-0.5 rounded-md bg-cyan-50 border border-cyan-100 text-xs">
                        {c.meter_number}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-slate-600 text-xs max-w-xs truncate">
                      {c.address || '—'}
                    </td>

                    <td className="py-4 px-6 font-mono font-semibold text-slate-700">
                      {c.bills_count || 0} bill(s)
                    </td>

                    <td className="py-4 px-6 font-mono font-bold text-slate-900">
                      {formatINR(c.total_spent || 0)}
                    </td>

                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenDetail(c)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-700 hover:bg-cyan-50 transition-colors"
                          title="View Customer Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleOpenEdit(c, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                          title="Edit Customer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteRequest(c, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Detail Drawer / Modal */}
      {selectedCustomerDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden relative animate-slide-up space-y-6 p-6 sm:p-8">
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-600">
                  Consumer Profile
                </span>
                <h2 className="text-2xl font-black text-slate-900 mt-1">
                  {selectedCustomerDetail.full_name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-cyan-100 text-cyan-800">
                    Meter: {selectedCustomerDetail.meter_number}
                  </span>
                  {selectedCustomerDetail.phone && (
                    <span className="text-xs text-slate-500">{selectedCustomerDetail.phone}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomerDetail(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Bills Issued</span>
                <p className="text-lg font-bold text-slate-900 font-mono mt-0.5">
                  {selectedCustomerDetail.stats?.total_bills || 0}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Energy Used</span>
                <p className="text-lg font-bold text-cyan-700 font-mono mt-0.5">
                  {formatUnits(selectedCustomerDetail.stats?.total_units || 0)}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Billed</span>
                <p className="text-lg font-bold text-slate-900 font-mono mt-0.5">
                  {formatINR(selectedCustomerDetail.stats?.total_spent || 0)}
                </p>
              </div>
            </div>

            {/* Bills History */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Billing Invoices History
              </h3>

              {selectedCustomerDetail.bills && selectedCustomerDetail.bills.length > 0 ? (
                <div className="max-h-60 overflow-y-auto rounded-2xl border border-slate-200 divide-y divide-slate-100">
                  {selectedCustomerDetail.bills.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => {
                        setViewingBill({
                          ...b,
                          customer_name: selectedCustomerDetail.full_name,
                          meter_number: selectedCustomerDetail.meter_number,
                          customer_address: selectedCustomerDetail.address,
                        });
                      }}
                      className="p-3.5 hover:bg-slate-50 flex items-center justify-between text-xs cursor-pointer transition-colors"
                    >
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-cyan-700">{b.bill_number}</span>
                        <div className="text-[11px] text-slate-400">
                          Period: {b.billing_period || 'Current'} • Date: {formatDate(b.generated_at)}
                        </div>
                      </div>

                      <div className="text-right space-y-0.5">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {formatINR(b.total_amount)}
                        </span>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {b.units_consumed} kWh
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No bills generated for this consumer yet.</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setSelectedCustomerDetail(null);
                  handleDeleteRequest(selectedCustomerDetail);
                }}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Consumer</span>
              </button>

              <button
                onClick={() => {
                  setSelectedCustomerDetail(null);
                  setActiveTab('generate');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors"
              >
                Generate Bill For This Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <CustomerModal
        customer={editingCustomer}
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSuccess={() => fetchCustomers()}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        title={forceDeleteConfirm ? 'Warning: Linked Bills Found!' : 'Delete Customer?'}
        message={
          forceDeleteConfirm
            ? `Customer "${deleteTarget?.full_name}" has linked billing records. Deleting this customer will also permanently delete all their historical bills.`
            : `Are you sure you want to delete customer "${deleteTarget?.full_name}"?`
        }
        warning={
          forceDeleteConfirm
            ? 'This action cannot be undone. All invoice records for this consumer will be removed from SQLite.'
            : undefined
        }
        confirmText={forceDeleteConfirm ? 'Yes, Delete Customer & Bills' : 'Delete Customer'}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          setDeleteTarget(null);
          setForceDeleteConfirm(false);
        }}
        isDeleting={isDeleting}
      />

      {/* Viewing Bill Modal */}
      {viewingBill && (
        <BillModal
          bill={viewingBill}
          onClose={() => setViewingBill(null)}
        />
      )}
    </div>
  );
}
