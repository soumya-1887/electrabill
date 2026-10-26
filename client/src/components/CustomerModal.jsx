import React, { useState, useEffect } from 'react';
import { X, User, Gauge, MapPin, Phone, AlertCircle, Save } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from './Toast';

export default function CustomerModal({ customer, isOpen, onClose, onSuccess }) {
  const [fullName, setFullName] = useState('');
  const [meterNumber, setMeterNumber] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const { addToast } = useToast();

  const isEdit = Boolean(customer && customer.id);

  useEffect(() => {
    if (customer) {
      setFullName(customer.full_name || '');
      setMeterNumber(customer.meter_number || '');
      setAddress(customer.address || '');
      setPhone(customer.phone || '');
    } else {
      setFullName('');
      setMeterNumber('');
      setAddress('');
      setPhone('');
    }
    setErrors({});
  }, [customer, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters.';
    }

    if (!meterNumber.trim()) {
      newErrors.meterNumber = 'Meter number is required.';
    } else if (meterNumber.trim().length < 3) {
      newErrors.meterNumber = 'Meter number must be at least 3 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const payload = {
        full_name: fullName.trim(),
        meter_number: meterNumber.trim().toUpperCase(),
        address: address.trim(),
        phone: phone.trim(),
      };

      let result;
      if (isEdit) {
        result = await api.updateCustomer(customer.id, payload);
        addToast(`Customer "${fullName}" updated successfully!`, 'success');
      } else {
        result = await api.createCustomer(payload);
        addToast(`Customer "${fullName}" added successfully!`, 'success');
      }

      onSuccess(result.data);
      onClose();
    } catch (err) {
      const errorMsg = err.message || 'Failed to save customer.';
      setErrors({ form: errorMsg });
      addToast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden relative animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center text-cyan-700">
              <User className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              {isEdit ? 'Edit Customer' : 'Add New Customer'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.form && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errors.form}</span>
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Customer Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. Ramesh Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                  errors.fullName
                    ? 'border-rose-300 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-cyan-500 focus:ring-cyan-100'
                }`}
              />
            </div>
            {errors.fullName && <p className="text-xs text-rose-600 font-medium">{errors.fullName}</p>}
          </div>

          {/* Meter Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Meter Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Gauge className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. MTR-88231"
                value={meterNumber}
                onChange={(e) => setMeterNumber(e.target.value.toUpperCase())}
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm font-mono uppercase transition-all focus:outline-none focus:ring-2 ${
                  errors.meterNumber
                    ? 'border-rose-300 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-cyan-500 focus:ring-cyan-100'
                }`}
              />
            </div>
            {errors.meterNumber && <p className="text-xs text-rose-600 font-medium">{errors.meterNumber}</p>}
            <p className="text-[11px] text-slate-400">Must be unique across all active consumers.</p>
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Phone Number (Optional)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. +91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 transition-all"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Premises Address (Optional)
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <textarea
                rows={2}
                placeholder="e.g. Flat 302, Green Park Apartments, New Delhi"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 transition-all resize-none"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-glow-sm disabled:opacity-50 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Register Customer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
