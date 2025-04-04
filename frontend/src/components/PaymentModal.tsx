// app/components/PaymentModal.tsx
import React, { useState } from "react";

interface Props {
    invoice: any;
    onClose: () => void;
    onSubmit: (updates: { status: string; payment_type: string; notes: string }) => void;
}

export default function PaymentModal({ invoice, onClose, onSubmit }: Props) {
    const [status, setStatus] = useState(invoice.status || "unpaid");
    const [paymentType, setPaymentType] = useState(invoice.payment_type || "");
    const [notes, setNotes] = useState(invoice.notes || "");

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg relative">
                <h2 className="text-lg font-semibold mb-4">Update Payment Info</h2>

                <label className="block mb-2">
                    <span className="text-sm font-medium">Status</span>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full border rounded p-2 mt-1"
                    >
                        <option value="unpaid">Unpaid</option>
                        <option value="paid">Paid</option>
                    </select>
                </label>

                <label className="block mb-2">
                    <span className="text-sm font-medium">Payment Type</span>
                    <input
                        type="text"
                        value={paymentType}
                        onChange={(e) => setPaymentType(e.target.value)}
                        className="w-full border rounded p-2 mt-1"
                        placeholder="e.g. Cash, Zelle, Check"
                    />
                </label>

                <label className="block mb-4">
                    <span className="text-sm font-medium">Notes</span>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="w-full border rounded p-2 mt-1"
                        placeholder="Add any payment notes here..."
                    />
                </label>

                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="text-sm text-gray-600 hover:underline">Cancel</button>
                    <button
                        onClick={() => onSubmit({ status, payment_type: paymentType, notes })}
                        className="bg-blue-600 text-white px-4 py-2 rounded"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
