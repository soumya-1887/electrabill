import React, { useState, useEffect } from 'react';
import {
  Users,
  Receipt,
  Zap,
  IndianRupee,
  PlusCircle,
  Eye,
  Download,
  Calendar,
  ArrowRight,
  Sparkles,
  TrendingUp,
  FileQuestion,
  RefreshCw
} from 'lucide-react';
import StatCard from '../components/StatCard';
import BillModal from '../components/BillModal';
import { api } from '../services/api';
import { formatINR, formatUnits, formatDate } from '../utils/formatters';
import { generateBillPDF } from '../utils/pdfGenerator';
import { useToast } from '../components/Toast';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';

export default function Dashboard({ setActiveTab, onSelectBill }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const { addToast } = useToast();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDashboardStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSeedSamples = async () => {
    try {
      const res = await api.seedSampleCustomers();
      addToast(res.message, 'success');
      fetchDashboardData();
    } catch (err) {
      addToast(err.message || 'Failed to seed sample customers', 'error');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-xl w-64"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200/80 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-72 bg-slate-200/80 rounded-2xl"></div>
      </div>
    );
  }

  const summary = stats?.summary || {
    totalCustomers: 0,
    totalBills: 0,
    totalUnits: 0,
    totalAmount: 0,
    formattedTotalAmount: '₹0',
    avgUnits: 0,
    avgAmount: 0,
    formattedAvgAmount: '₹0'
  };

  const recentBills = stats?.recentBills || [];
  const isEmpty = summary.totalBills === 0 && summary.totalCustomers === 0;

  // Chart data formatting
  const trendData = (stats?.recentTrends || []).map((b, idx) => ({
    name: b.bill_number ? b.bill_number.split('-').pop() : `#${idx + 1}`,
    customer: b.customer_name,
    units: b.units_consumed,
    amount: b.total_amount,
  }));

  const slabData = stats?.slabDistribution || [
    { name: 'Slab 1 (1–100 units @ ₹2)', amount: 0, color: '#06b6d4' },
    { name: 'Slab 2 (101–200 units @ ₹3)', amount: 0, color: '#3b82f6' },
    { name: 'Slab 3 (>200 units @ ₹5)', amount: 0, color: '#6366f1' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Executive Billing Dashboard
            </h1>
            <span className="px-2 py-0.5 text-xs font-bold bg-cyan-50 border border-cyan-200 text-cyan-800 rounded-full">
              Live DB
            </span>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Real-time utility consumption and progressive slab billing metrics
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDashboardData}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm"
            title="Refresh Database Stats"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTab('generate')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-glow-sm hover:shadow-glow hover:-translate-y-0.5 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Generate New Bill</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards (Real database metrics, zero dummy numbers) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Customers"
          value={summary.totalCustomers.toLocaleString('en-IN')}
          icon={Users}
          subtitle={
            summary.totalCustomers === 0
              ? 'No customers registered yet'
              : `${summary.totalCustomers} active metered accounts`
          }
          gradient="bg-gradient-to-tr from-cyan-500 to-teal-500 text-white shadow-sm"
        />

        <StatCard
          title="Total Bills Generated"
          value={summary.totalBills.toLocaleString('en-IN')}
          icon={Receipt}
          subtitle={
            summary.totalBills === 0
              ? 'No bills generated yet'
              : `${summary.totalBills} invoices created`
          }
          gradient="bg-gradient-to-tr from-blue-500 to-indigo-600 text-white shadow-sm"
        />

        <StatCard
          title="Total Units Consumed"
          value={formatUnits(summary.totalUnits)}
          icon={Zap}
          subtitle={
            summary.totalBills === 0
              ? '0 kWh billed'
              : `Avg ${summary.avgUnits} kWh / bill`
          }
          gradient="bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-sm"
        />

        <StatCard
          title="Total Billing Amount"
          value={summary.formattedTotalAmount}
          icon={IndianRupee}
          subtitle={
            summary.totalBills === 0
              ? '₹0 total revenue'
              : `Avg ${summary.formattedAvgAmount} / invoice`
          }
          gradient="bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-sm"
        />
      </div>

      {/* Empty State when database is brand new */}
      {isEmpty && (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-card text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center mx-auto shadow-glow-sm">
            <Zap className="w-8 h-8 fill-cyan-500" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-extrabold text-slate-900">
              Welcome to ElectraBill!
            </h3>
            <p className="text-sm text-slate-600">
              Your SQLite database is clean and ready. There are no dummy records. Start by generating your first electricity bill or load sample test accounts.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setActiveTab('generate')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-glow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Generate First Electricity Bill</span>
            </button>

            <button
              onClick={handleSeedSamples}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200/80 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-cyan-600" />
              <span>Load Sample Test Customers</span>
            </button>
          </div>
        </div>
      )}

      {/* Analytics Charts (When bills exist) */}
      {!isEmpty && trendData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue & Consumption Trend */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Billing &amp; Consumption Trends
                </h3>
                <p className="text-xs text-slate-500">Units (kWh) and Authoritative Billed Amount (₹)</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-cyan-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span> Units (kWh)
                </span>
                <span className="flex items-center gap-1.5 text-blue-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Amount (₹)
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUnits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                    }}
                    formatter={(val, name) => [
                      name === 'amount' ? formatINR(val) : `${val} kWh`,
                      name === 'amount' ? 'Billed Amount' : 'Units Consumed'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="units"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorUnits)"
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorAmount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Slab Distribution Breakdown */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Tariff Slab Revenue Breakdown
              </h3>
              <p className="text-xs text-slate-500">Revenue split across progressive slabs</p>
            </div>

            <div className="space-y-3 py-2">
              <div className="p-3 rounded-2xl bg-cyan-50/70 border border-cyan-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-cyan-900">Slab 1 (1–100 units)</p>
                  <p className="text-[11px] text-cyan-700">₹2 per unit</p>
                </div>
                <span className="text-sm font-extrabold text-cyan-950 font-mono">
                  {formatINR(slabData[0].amount)}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-blue-900">Slab 2 (101–200 units)</p>
                  <p className="text-[11px] text-blue-700">₹3 per unit</p>
                </div>
                <span className="text-sm font-extrabold text-blue-950 font-mono">
                  {formatINR(slabData[1].amount)}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-indigo-900">Slab 3 (&gt;200 units)</p>
                  <p className="text-[11px] text-indigo-700">₹5 per unit</p>
                </div>
                <span className="text-sm font-extrabold text-indigo-950 font-mono">
                  {formatINR(slabData[2].amount)}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Marginal Calculation</span>
              <button
                onClick={() => setActiveTab('tariffs')}
                className="text-cyan-600 hover:text-cyan-700 font-bold flex items-center gap-1"
              >
                <span>View Rules</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Bills Table */}
      {!isEmpty && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Electricity Bills</h3>
              <p className="text-xs text-slate-500">Latest authoritative billings registered in SQLite</p>
            </div>

            <button
              onClick={() => setActiveTab('history')}
              className="text-xs font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 self-start sm:self-auto"
            >
              <span>View Full History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/60 uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-6">Bill ID</th>
                  <th className="py-3 px-6">Customer</th>
                  <th className="py-3 px-6">Units Consumed</th>
                  <th className="py-3 px-6">Total Amount</th>
                  <th className="py-3 px-6">Date Generated</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentBills.map((bill) => (
                  <tr
                    key={bill.id}
                    className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                    onClick={() => setSelectedBill(bill)}
                  >
                    <td className="py-4 px-6 font-mono font-bold text-cyan-700">
                      {bill.bill_number}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{bill.customer_name}</div>
                      <div className="text-xs text-slate-400 font-mono">Meter: {bill.meter_number}</div>
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-700 font-semibold">
                      {bill.units_consumed} kWh
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-slate-900 text-sm">
                      {bill.formatted_amount}
                    </td>
                    <td className="py-4 px-6 text-slate-500 text-xs">
                      {formatDate(bill.generated_at)}
                    </td>
                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedBill(bill)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 transition-colors"
                          title="View Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => generateBillPDF(bill)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
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

      {/* Invoice Modal */}
      {selectedBill && (
        <BillModal
          bill={selectedBill}
          onClose={() => setSelectedBill(null)}
          onGenerateAnother={() => setActiveTab('generate')}
        />
      )}
    </div>
  );
}
