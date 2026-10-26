import React from 'react';
import {
  X,
  Printer,
  Download,
  PlusCircle,
  Zap,
  CheckCircle2,
  Calendar,
  Hash,
  User,
  Gauge,
  MapPin,
  Clock,
  ArrowRight
} from 'lucide-react';
import { formatINR, formatUnits, formatDateTime, formatDate } from '../utils/formatters';
import { generateBillPDF } from '../utils/pdfGenerator';

export default function BillModal({ bill, onClose, onGenerateAnother }) {
  if (!bill) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    generateBillPDF(bill);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden relative animate-slide-up">
        {/* Modal Top Bar (Action Buttons) - Hidden in Print */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-slate-50/80 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Official Electricity Invoice
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
              title="Print Invoice"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 transition-all shadow-glow-sm"
              title="Download PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors ml-1"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div className="printable-invoice p-6 sm:p-8 space-y-6">
          {/* Invoice Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-blue-600 flex items-center justify-center text-white shadow-glow-sm">
                <Zap className="w-7 h-7 fill-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  Electra<span className="text-cyan-600">Bill</span>
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Smart Electricity Utility & Billing Service
                </p>
                <p className="text-[11px] text-slate-400">Govt. Tariff Compliance (Marginal Slabs)</p>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-bold">
                <Hash className="w-3.5 h-3.5 text-cyan-600" />
                <span>{bill.bill_number}</span>
              </div>
              <p className="text-xs text-slate-500 font-medium pt-1">
                Generated: {formatDateTime(bill.generated_at)}
              </p>
              <p className="text-xs font-semibold text-rose-600">
                Payment Due: {formatDate(bill.due_date)}
              </p>
            </div>
          </div>

          {/* Consumer & Meter Information Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Consumer Details */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Consumer Details
              </p>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-600 shrink-0" />
                <span className="text-sm font-bold text-slate-900">
                  {bill.customer_name || 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-cyan-600 shrink-0" />
                <span className="text-xs font-mono font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Meter: {bill.meter_number || 'N/A'}
                </span>
              </div>
              {bill.customer_address && (
                <div className="flex items-start gap-2 pt-1 text-xs text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{bill.customer_address}</span>
                </div>
              )}
            </div>

            {/* Billing Details */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Billing Cycle
              </p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Billing Period:
                </span>
                <span className="font-bold text-slate-800">{bill.billing_period || 'Current Cycle'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Total Energy:
                </span>
                <span className="font-bold text-cyan-700 text-sm">
                  {bill.units_consumed} Units (kWh)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Invoice Status:</span>
                <span className="font-bold px-2 py-0.5 rounded-full text-[11px] bg-amber-50 text-amber-700 border border-amber-200">
                  {bill.status || 'Unpaid'}
                </span>
              </div>
            </div>
          </div>

          {/* Itemized Progressive Tariff Slab Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Progressive Tariff Slab Calculation
              </h3>
              <span className="text-xs font-medium text-slate-500">Independent Slabs</span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-900 text-white font-semibold">
                    <th className="py-3 px-4">Tariff Slab</th>
                    <th className="py-3 px-4 text-right">Units</th>
                    <th className="py-3 px-4 text-right">Rate</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {bill.slabs && bill.slabs.length > 0 ? (
                    bill.slabs.map((slab) => (
                      <tr
                        key={slab.slabNumber}
                        className={`${
                          slab.isApplicable ? 'bg-white' : 'bg-slate-50/50 text-slate-400'
                        }`}
                      >
                        <td className="py-3 px-4 font-medium">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                slab.isApplicable ? 'bg-cyan-500' : 'bg-slate-300'
                              }`}
                            ></span>
                            <span>{slab.slabRange}</span>
                            {!slab.isApplicable && (
                              <span className="text-[10px] text-slate-400 italic">
                                (Not reached)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {slab.units} kWh
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600">
                          {slab.formattedRate}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {slab.formattedAmount}
                        </td>
                      </tr>
                    ))
                  ) : (
                    // Fallback reconstruction if slabs array wasn't passed directly
                    <>
                      <tr className="bg-white">
                        <td className="py-3 px-4 font-medium">First 100 units (1–100)</td>
                        <td className="py-3 px-4 text-right font-mono">
                          {Math.min(Math.max(bill.units_consumed, 0), 100)} kWh
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600">₹2/unit</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {formatINR(bill.slab_1_amount)}
                        </td>
                      </tr>
                      <tr className={bill.units_consumed > 100 ? 'bg-white' : 'bg-slate-50/50 text-slate-400'}>
                        <td className="py-3 px-4 font-medium">Next 100 units (101–200)</td>
                        <td className="py-3 px-4 text-right font-mono">
                          {bill.units_consumed > 100 ? Math.min(bill.units_consumed - 100, 100) : 0} kWh
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600">₹3/unit</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {formatINR(bill.slab_2_amount)}
                        </td>
                      </tr>
                      <tr className={bill.units_consumed > 200 ? 'bg-white' : 'bg-slate-50/50 text-slate-400'}>
                        <td className="py-3 px-4 font-medium">Above 200 units (&gt;200)</td>
                        <td className="py-3 px-4 text-right font-mono">
                          {bill.units_consumed > 200 ? bill.units_consumed - 200 : 0} kWh
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600">₹5/unit</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {formatINR(bill.slab_3_amount)}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold border-t border-slate-200">
                    <td className="py-3 px-4 text-slate-900">Total Consumption &amp; Base Amount</td>
                    <td className="py-3 px-4 text-right font-mono text-cyan-700">
                      {bill.units_consumed} kWh
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400">—</td>
                    <td className="py-3 px-4 text-right font-mono text-lg text-slate-900">
                      {formatINR(bill.total_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Grand Payable Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-navy-900 to-slate-800 rounded-2xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
            <div>
              <p className="text-xs uppercase tracking-wider text-cyan-300 font-bold">
                Total Amount Payable (INR)
              </p>
              <p className="text-xs text-slate-400 pt-0.5">
                Inclusive of progressive slabs • No hidden surcharges
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-3xl sm:text-4xl font-extrabold text-cyan-400 tracking-tight">
                {formatINR(bill.total_amount)}
              </span>
            </div>
          </div>

          {/* Notice notes */}
          <div className="text-[11px] text-slate-400 space-y-1 pt-2 border-t border-slate-100">
            <p>• All charges follow standard progressive slab calculation: ₹2 (first 100 units), ₹3 (101–200 units), ₹5 (&gt;200 units).</p>
            <p>• Please pay within 15 calendar days from billing date.</p>
          </div>
        </div>

        {/* Modal Footer (Screen only) */}
        <div className="no-print flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 transition-colors"
          >
            Back to Dashboard
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onGenerateAnother && (
              <button
                onClick={() => {
                  onClose();
                  onGenerateAnother();
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Another Bill</span>
              </button>
            )}

            <button
              onClick={handleDownloadPDF}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-glow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
