import React, { useState, useEffect } from 'react';
import {
  Zap,
  Calculator,
  User,
  Gauge,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Receipt,
  FileText,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { calculateElectricityBill } from '../utils/billing';
import { formatINR, formatUnits } from '../utils/formatters';
import { useToast } from '../components/Toast';
import BillModal from '../components/BillModal';

export default function GenerateBill({ setActiveTab }) {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [isNewCustomer, setIsNewCustomer] = useState(false);

  // Form Fields
  const [customerName, setCustomerName] = useState('');
  const [meterNumber, setMeterNumber] = useState('');
  const [address, setAddress] = useState('');
  const [units, setUnits] = useState('250');
  const [billingPeriod, setBillingPeriod] = useState(
    new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })
  );

  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 15);
  const [dueDate, setDueDate] = useState(defaultDueDate.toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [savedBill, setSavedBill] = useState(null);
  const { addToast } = useToast();

  // Load customer list
  useEffect(() => {
    async function loadCustomers() {
      try {
        const res = await api.getCustomers({ limit: 100 });
        if (res.success && res.data.length > 0) {
          setCustomers(res.data);
          setSelectedCustomerId(res.data[0].id.toString());
          setCustomerName(res.data[0].full_name);
          setMeterNumber(res.data[0].meter_number);
          setAddress(res.data[0].address || '');
        } else {
          setIsNewCustomer(true);
        }
      } catch (err) {
        console.error('Failed to load customers:', err);
        setIsNewCustomer(true);
      }
    }
    loadCustomers();
  }, []);

  // Update fields when selecting an existing customer
  const handleSelectCustomer = (e) => {
    const val = e.target.value;
    if (val === 'new') {
      setIsNewCustomer(true);
      setSelectedCustomerId('');
      setCustomerName('');
      setMeterNumber('');
      setAddress('');
    } else {
      setIsNewCustomer(false);
      setSelectedCustomerId(val);
      const found = customers.find((c) => c.id.toString() === val);
      if (found) {
        setCustomerName(found.full_name);
        setMeterNumber(found.meter_number);
        setAddress(found.address || '');
      }
    }
  };

  // Instant calculation preview
  const preview = calculateElectricityBill(units);

  const validate = () => {
    const newErrors = {};

    if (isNewCustomer) {
      if (!customerName.trim()) {
        newErrors.customerName = 'Customer full name is required.';
      }
      if (!meterNumber.trim()) {
        newErrors.meterNumber = 'Meter number is required.';
      }
    } else if (!selectedCustomerId) {
      newErrors.customer = 'Please select or add a customer.';
    }

    if (units === '' || units === null || units === undefined) {
      newErrors.units = 'Units consumed is required.';
    } else {
      const numUnits = Number(units);
      if (isNaN(numUnits) || !isFinite(numUnits)) {
        newErrors.units = 'Units must be a valid number.';
      } else if (numUnits < 0) {
        newErrors.units = 'Units consumed cannot be negative.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveBill = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const payload = {
        customer_id: isNewCustomer ? undefined : parseInt(selectedCustomerId, 10),
        customer_name: customerName.trim(),
        meter_number: meterNumber.trim().toUpperCase(),
        address: address.trim(),
        units_consumed: Number(units),
        billing_period: billingPeriod.trim(),
        due_date: dueDate,
        notes: notes.trim(),
      };

      const res = await api.createBill(payload);

      if (res.success) {
        // Confetti celebration
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });

        addToast(`Bill ${res.data.bill_number} generated successfully!`, 'success');
        setSavedBill(res.data);
      }
    } catch (err) {
      const msg = err.message || 'Failed to generate electricity bill.';
      setErrors({ form: msg });
      addToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const presetUnits = [0, 50, 100, 150, 200, 250, 300];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Generate Electricity Bill
          </h1>
          <span className="px-2 py-0.5 text-xs font-bold bg-cyan-100 text-cyan-800 rounded-md">
            Authoritative Calculation
          </span>
        </div>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Calculate electricity charges using progressive slabs and persist official invoices in SQLite
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card space-y-6">
          <form onSubmit={handleSaveBill} className="space-y-6">
            {errors.form && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span className="font-medium">{errors.form}</span>
              </div>
            )}

            {/* Customer Selection Mode */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Select Consumer <span className="text-rose-500">*</span></span>
                <button
                  type="button"
                  onClick={() => setIsNewCustomer(!isNewCustomer)}
                  className="text-xs font-bold text-cyan-600 hover:text-cyan-700 underline"
                >
                  {isNewCustomer ? 'Select Existing Customer' : '+ Register New Customer'}
                </button>
              </label>

              {!isNewCustomer && customers.length > 0 ? (
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    value={selectedCustomerId}
                    onChange={handleSelectCustomer}
                    className="w-full pl-10 pr-8 py-3 rounded-xl border border-slate-300 text-sm font-medium bg-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 transition-all appearance-none cursor-pointer"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name} — Meter: {c.meter_number}
                      </option>
                    ))}
                    <option value="new">+ Register a new consumer...</option>
                  </select>
                </div>
              ) : null}

              {/* Inline New Customer Fields */}
              {isNewCustomer && (
                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
                  <p className="text-xs font-bold text-cyan-800 uppercase tracking-wider">
                    New Consumer Details
                  </p>

                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="Customer Full Name *"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className={`w-full px-3.5 py-2 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                        errors.customerName
                          ? 'border-rose-300 focus:ring-rose-200'
                          : 'border-slate-300 focus:border-cyan-500 focus:ring-cyan-100'
                      }`}
                    />
                    {errors.customerName && (
                      <p className="text-xs text-rose-600 font-medium">{errors.customerName}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="Meter Number (e.g. MTR-4921) *"
                      value={meterNumber}
                      onChange={(e) => setMeterNumber(e.target.value.toUpperCase())}
                      className={`w-full px-3.5 py-2 rounded-xl border text-sm font-mono uppercase transition-all focus:outline-none focus:ring-2 ${
                        errors.meterNumber
                          ? 'border-rose-300 focus:ring-rose-200'
                          : 'border-slate-300 focus:border-cyan-500 focus:ring-cyan-100'
                      }`}
                    />
                    {errors.meterNumber && (
                      <p className="text-xs text-rose-600 font-medium">{errors.meterNumber}</p>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="Address (Optional)"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 transition-all"
                  />
                </div>
              )}
            </div>

            {/* Units Consumed */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Units Consumed (kWh) <span className="text-rose-500">*</span></span>
                <span className="text-xs font-semibold text-cyan-700">
                  {preview.isValid ? `${preview.unitsConsumed} kWh entered` : 'Invalid'}
                </span>
              </label>

              <div className="relative">
                <Zap className="w-5 h-5 text-amber-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Enter consumption e.g. 250"
                  value={units}
                  onChange={(e) => setUnits(e.target.value)}
                  className={`w-full pl-11 pr-20 py-3.5 rounded-2xl border text-lg font-mono font-bold transition-all focus:outline-none focus:ring-2 ${
                    errors.units
                      ? 'border-rose-300 focus:ring-rose-200 text-rose-900'
                      : 'border-slate-300 focus:border-cyan-500 focus:ring-cyan-100 text-slate-900'
                  }`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase">
                  Units
                </span>
              </div>
              {errors.units && <p className="text-xs text-rose-600 font-medium">{errors.units}</p>}

              {/* Quick Presets (From Required Tests) */}
              <div className="pt-1">
                <p className="text-[11px] font-semibold text-slate-400 mb-1.5">
                  Quick test presets (Required Cases):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {presetUnits.map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUnits(u.toString())}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                        Number(units) === u
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                      }`}
                    >
                      {u} units
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Billing Period & Due Date Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Billing Period
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={billingPeriod}
                    onChange={(e) => setBillingPeriod(e.target.value)}
                    placeholder="e.g. October 2026"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Payment Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>
            </div>

            {/* Optional Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Billing Notes / Meter Remarks (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Regular monthly residential meter reading. No tamper observed."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 resize-none"
              />
            </div>

            {/* Submit Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting || !preview.isValid}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-glow-sm hover:shadow-glow disabled:opacity-50 transition-all cursor-pointer"
              >
                <Receipt className="w-4 h-4" />
                <span>{isSubmitting ? 'Calculating & Saving...' : 'Save & Generate Official Bill'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Live Tariff Slab Preview (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 via-navy-900 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">Live Calculation Preview</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
              Marginal Slabs
            </span>
          </div>

          {/* Large Total Preview */}
          <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/60 space-y-1">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Estimated Total Payable
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-cyan-400 tracking-tight font-mono">
              {preview.isValid ? formatINR(preview.totalAmount) : '—'}
            </div>
            <p className="text-[11px] text-slate-400">
              For {preview.isValid ? preview.unitsConsumed : 0} units consumed
            </p>
          </div>

          {/* Itemized Progressive Slabs */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Progressive Slabs Breakdown
            </p>

            {preview.slabs && preview.slabs.length > 0 ? (
              preview.slabs.map((slab) => (
                <div
                  key={slab.slabNumber}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    slab.isApplicable
                      ? 'bg-slate-800/80 border-cyan-500/40 text-white'
                      : 'bg-slate-900/40 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          slab.isApplicable ? 'bg-cyan-400' : 'bg-slate-600'
                        }`}
                      ></span>
                      {slab.slabRange}
                    </span>
                    <span className="font-mono text-cyan-300 font-bold">
                      {formatINR(slab.amount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 font-mono">
                    <span>
                      {slab.units} units × ₹{slab.rate}/unit
                    </span>
                    <span>
                      {slab.isApplicable ? 'Active' : '0 units'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">Enter units to view slab charges.</p>
            )}
          </div>

          {/* Formula Card */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 text-[11px] text-slate-300 space-y-1.5">
            <p className="font-bold text-cyan-300 uppercase tracking-wide">Tariff Rules Applied:</p>
            <p>• First 100 units: ₹2/unit</p>
            <p>• Units 101–200: ₹3/unit</p>
            <p>• Units above 200: ₹5/unit</p>
            <p className="text-slate-400 italic pt-1">
              Backend verifies and independently calculates the final authoritative amount before storing.
            </p>
          </div>
        </div>
      </div>

      {/* Bill Generated Success Modal */}
      {savedBill && (
        <BillModal
          bill={savedBill}
          onClose={() => setSavedBill(null)}
          onGenerateAnother={() => {
            setSavedBill(null);
            setUnits('100');
          }}
        />
      )}
    </div>
  );
}
