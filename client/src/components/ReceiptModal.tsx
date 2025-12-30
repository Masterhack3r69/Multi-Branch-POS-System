import { Button } from '@/components/ui/Button';

interface ReceiptItem {
  skuId: string;
  name: string;
  qty: number;
  price: number;
  discount?: number;
}

interface ReceiptModalProps {
  transactionNumber: string;
  items: ReceiptItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  taxRate: number;
  paymentMethod: string;
  paymentAmount: number;
  changeAmount: number;
  timestamp: Date;
  cashierName: string;
  terminalId: string;
  branchName: string;
  receiptFooter?: string;
  onClose: () => void;
}

export function ReceiptModal({
  transactionNumber,
  items,
  subtotal,
  discountAmount,
  taxAmount,
  total,
  taxRate,
  paymentMethod,
  paymentAmount,
  changeAmount,
  timestamp,
  cashierName,
  terminalId,
  branchName,
  receiptFooter,
  onClose
}: ReceiptModalProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-9999 p-4">
      <div className="bg-white text-gray-900 max-w-lg w-full shadow-xl border-2 border-black">
        {/* Receipt Header */}
        <div className="p-6 border-b-2 border-black bg-black text-white text-center">
          <h1 className="text-2xl font-black uppercase tracking-tighter mb-2">RECEIPT</h1>
          <p className="font-mono text-sm">{transactionNumber}</p>
        </div>

        {/* Receipt Content */}
        <div className="p-6 font-mono text-sm max-h-[70vh] overflow-y-auto">
          {/* Store Info */}
          <div className="text-center mb-6 border-b-2 border-black pb-4">
            <p className="font-bold text-base">{branchName}</p>
            <p className="text-xs">Terminal: {terminalId}</p>
            <p className="text-xs">Cashier: {cashierName}</p>
            <p className="text-xs">{timestamp.toLocaleDateString()} {timestamp.toLocaleTimeString()}</p>
          </div>

          {/* Items */}
          <div className="mb-4 border-b-2 border-black pb-4">
            <div className="mb-2 pb-2 border-b border-gray-300">
              <div className="flex justify-between text-xs font-bold uppercase mb-1">
                <span>Item</span>
                <span>Qty</span>
                <span>Price</span>
                <span>Total</span>
              </div>
            </div>
            {items.map((item) => {
              const itemSubtotal = item.price * item.qty;
              const itemDiscount = item.discount || 0;
              const itemTotal = itemSubtotal - itemDiscount;
              return (
                <div key={item.skuId} className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold flex-1">{item.name}</span>
                    <span className="text-right ml-2">{item.qty}x ${item.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span></span>
                    <span className="text-right">${itemTotal.toFixed(2)}</span>
                  </div>
                  {itemDiscount > 0 && (
                    <div className="flex justify-between text-xs text-red-600 italic">
                      <span>Discount:</span>
                      <span className="text-right">-${itemDiscount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div className="space-y-2 border-b-2 border-black pb-4 mb-4">
            <div className="flex justify-between text-xs">
              <span>Subtotal:</span>
              <span className="font-mono">${subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-xs text-red-600 font-bold">
                <span>Discount:</span>
                <span className="font-mono">-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span>Tax ({(taxRate * 100).toFixed(2)}%):</span>
              <span className="font-mono">${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base mt-2">
              <span>TOTAL:</span>
              <span className="font-mono">${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment */}
          <div className="space-y-2 border-b-2 border-black pb-4 mb-4">
            <div className="flex justify-between text-xs">
              <span>Payment Method:</span>
              <span className="font-bold">{paymentMethod}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Amount Paid:</span>
              <span className="font-mono">${paymentAmount.toFixed(2)}</span>
            </div>
            {changeAmount > 0 && (
              <div className="flex justify-between font-bold text-sm">
                <span>Change:</span>
                <span className="font-mono">${changeAmount.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          {receiptFooter && (
            <div className="text-center text-xs italic text-gray-600 py-4 border-t border-gray-300">
              {receiptFooter}
            </div>
          )}

          {/* Thank You */}
          <div className="text-center text-xs font-bold uppercase tracking-wide pt-4">
            Thank you for your purchase!
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t-2 border-black bg-zinc-50 flex gap-3 print:hidden">
          <Button onClick={handlePrint} className="flex-1 h-12">
            PRINT RECEIPT
          </Button>
          <button
            onClick={onClose}
            className="flex-1 h-12 border-2 border-black font-bold uppercase hover:bg-black hover:text-white"
          >
            DONE
          </button>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white;
          }
          .fixed {
            position: static;
          }
          .bg-gray-900 {
            background: none;
          }
          .print\\:hidden {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
