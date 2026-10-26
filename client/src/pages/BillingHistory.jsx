import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Calendar,
  ArrowUpDown,
  Eye,
  Download,
  Trash2,
  Printer,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  PlusCircle
} from 'lucide-react';
import { api } from '../services/api';
import { formatINR, formatUnits, formatDate } from '../utils/formatters';
import { generateBillPDF } from '../utils/pdfGenerator';
import BillModal from '../components/BillModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { useToast } from '../components/Toast';

export default function BillingHistory({ setActiveTab }) {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 10 });

  // Modals
  const [selectedBill, setSelectedBill] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { addToast } = useToast();

  const fetchBills = async () => {
    try {
      setLoading(true);
      const res = await api.getBills({
        search,
        startDate,
        endDate,
        sortBy,
        sortOrder,
        page,
        limit: 10,
      });

      if (res.success) {
        setBills(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Error fetching bills:', err);
      addToast(err.message || 'Failed to load bills', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [search, startDate, endDate, sortBy, sortOrder, page]);

  const handleDeleteBill = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      await api.deleteBill(deleteTarget.id);
      addToast(`Bill ${deleteTarget.bill_number} deleted successfully`, 'success');
      setDeleteTarget(null);
      fetchBills();
    } catch (err) {
      addToast(err.message || 'Failed to delete bill', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenPrint = (bill, e) => {
    e.stopPropagation();
    setSelectedBill(bill);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleOpenPDF = (bill, e) => {
    e.stopPropagation();
    generateBillPDF(bill);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Billing Archives &amp; History
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Search, filter, export, and inspect persisted electricity invoices
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchBills}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm"
            title="Refresh History"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTab('generate')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-glow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Generate New Bill</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search box */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer, meter no, or bill ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 transition-all"
            />
          </div>

          {/* Date range */}
          <div className="md:col-span-4 flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-1/2 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-cyan-500"
              title="Start Date"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-1/2 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-cyan-500"
              title="End Date"
            />
          </div>

          {/* Sort controls */}
          <div className="md:col-span-3 flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:border-cyan-500"
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
              <option value="units">Sort by Units</option>
              <option value="customer">Sort by Customer</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
              className="p-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
              title={`Switch to ${sortOrder === 'ASC' ? 'Descending' : 'Ascending'}`}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Clear filters shortcut */}
        {(search || startDate || endDate) && (
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <span className="text-slate-500">Active filters applied</span>
            <button
              onClick={() => {
                setSearch('');
                setStartDate('');
                setEndDate('');
                setPage(1);
              }}
              className="font-bold text-cyan-600 hover:text-cyan-700"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Bills Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate-200/70 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : bills.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-card text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center mx-auto">
            <Receipt className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-lg font-bold text-slate-900">No Billing Records Found</h3>
            <p className="text-xs text-slate-500">
              {search || startDate || endDate
                ? 'No invoices match your selected search criteria.'
                : 'No electricity bills have been registered in the database yet.'}
            </p>
          </div>
          <button
            onClick={() => setActiveTab('generate')}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors"
          >
            Create New Bill
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/60 uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-6">Bill Number</th>
                  <th className="py-3 px-6">Customer</th>
                  <th className="py-3 px-6">Period</th>
                  <th className="py-3 px-6">Units</th>
                  <th className="py-3 px-6">Total Amount</th>
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bills.map((bill) => (
                  <tr
                    key={bill.id}
                    onClick={() => setSelectedBill(bill)}
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-6 font-mono font-bold text-cyan-700">
                      {bill.bill_number}
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 group-hover:text-cyan-700 transition-colors">
                        {bill.customer_name}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        Meter: {bill.meter_number}
                      </div>
                    </td>

                    <td className="py-4 px-6 text-slate-600 text-xs">
                      {bill.billing_period || 'Current'}
                    </td>

                    <td className="py-4 px-6 font-mono font-semibold text-slate-800">
                      {bill.units_consumed} kWh
                    </td>

                    <td className="py-4 px-6 font-mono font-bold text-slate-900 text-sm">
                      {bill.formatted_total}
                    </td>

                    <td className="py-4 px-6 text-slate-500 text-xs">
                      {formatDate(bill.generated_at)}
                    </td>

                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedBill(bill)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-700 hover:bg-cyan-50 transition-colors"
                          title="View Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleOpenPrint(bill, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                          title="Print Invoice"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleOpenPDF(bill, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(bill);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                          title="Delete Bill"
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

          {/* Pagination Controls */}
          <div className="p-4 bg-slate-50/70 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 font-medium">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total bills)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 font-bold text-slate-700">
                {pagination.page} / {pagination.totalPages}
              </span>

              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill View Modal */}
      {selectedBill && (
        <BillModal
          bill={selectedBill}
          onClose={() => setSelectedBill(null)}
          onGenerateAnother={() => setActiveTab('generate')}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Electricity Bill?"
        message={`Are you sure you want to delete bill ${deleteTarget?.bill_number} for customer ${deleteTarget?.customer_name}?`}
        warning="This invoice record will be permanently deleted from the database."
        confirmText="Delete Bill"
        onConfirm={handleDeleteBill}
        onClose={() => setDeleteTarget(null)}
        isDeleting={isDeleting}
      />
    </div>
  );
}
