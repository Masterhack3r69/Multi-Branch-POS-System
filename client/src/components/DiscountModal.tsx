import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface DiscountModalProps {
  subtotal: number;
  onApply: (discountAmount: number, reason: string) => void;
  onCancel: () => void;
}

export function DiscountModal({ subtotal, onApply, onCancel }: DiscountModalProps) {
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [discountValue, setDiscountValue] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState<string>('');

  const calculateDiscount = (): number => {
    const value = parseFloat(discountValue) || 0;
    if (discountType === 'fixed') {
      return Math.min(value, subtotal);
    } else {
      return (subtotal * value) / 100;
    }
  };

  const discountAmount = calculateDiscount();
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const handleApply = () => {
    if (!discountValue || discountValue === '0') {
      setError('Please enter a discount amount');
      return;
    }

    if (discountAmount < 0) {
      setError('Discount cannot be negative');
      return;
    }

    onApply(discountAmount, reason);
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-9999">
      <div className="bg-white text-gray-900 p-8 rounded-lg shadow-xl max-w-md w-full border-2 border-black">
        <h2 className="text-xl font-black uppercase tracking-tighter mb-6">Apply Discount</h2>

        {error && (
          <div className="mb-4 p-3 border-2 border-red-600 bg-red-50 text-red-700 text-sm font-bold">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-6">
          {/* Discount Type Selection */}
          <div>
            <label className="block text-sm font-bold uppercase mb-2">Discount Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setDiscountType('fixed');
                  setError('');
                }}
                className={`flex-1 py-2 font-bold uppercase border-2 ${
                  discountType === 'fixed'
                    ? 'border-black bg-black text-white'
                    : 'border-black bg-white text-black hover:bg-zinc-50'
                }`}
              >
                Fixed Amount
              </button>
              <button
                onClick={() => {
                  setDiscountType('percent');
                  setError('');
                }}
                className={`flex-1 py-2 font-bold uppercase border-2 ${
                  discountType === 'percent'
                    ? 'border-black bg-black text-white'
                    : 'border-black bg-white text-black hover:bg-zinc-50'
                }`}
              >
                Percentage
              </button>
            </div>
          </div>

          {/* Discount Value Input */}
          <div>
            <label className="block text-sm font-bold uppercase mb-2">
              {discountType === 'fixed' ? 'Amount ($)' : 'Percentage (%)'}
            </label>
            <Input
              type="number"
              step={discountType === 'fixed' ? '0.01' : '0.1'}
              min="0"
              value={discountValue}
              onChange={(e) => {
                setDiscountValue(e.target.value);
                setError('');
              }}
              placeholder={discountType === 'fixed' ? '0.00' : '0'}
              autoFocus
            />
          </div>

          {/* Discount Preview */}
          {discountValue && (
            <div className="p-3 bg-zinc-50 border-2 border-black">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-bold">Subtotal:</span>
                <span className="font-mono">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mb-2 text-red-600 font-bold">
                <span>Discount:</span>
                <span className="font-mono">-${discountAmount.toFixed(2)}</span>
              </div>
              <div className="border-t border-black pt-2 flex justify-between font-bold">
                <span>Final Total:</span>
                <span className="font-mono">${finalTotal.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Reason (Optional) */}
          <div>
            <label className="block text-sm font-bold uppercase mb-2">Reason (Optional)</label>
            <textarea
              className="w-full border-2 border-black p-3 font-mono text-sm focus:outline-none focus:bg-zinc-50"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Customer loyalty, bulk purchase, damage..."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button onClick={handleApply} className="flex-1 h-12">
            APPLY DISCOUNT
          </Button>
          <button
            onClick={onCancel}
            className="flex-1 h-12 border-2 border-black font-bold uppercase hover:bg-black hover:text-white"
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}
