import React, { useEffect, useState } from "react";

interface Props {
    invoice: any;
    signatureDataUrl?: string;
    signedAt?: string;
    accepted?: boolean;
    testimonial?: string;
}


export default function InvoicePreview({ invoice, signatureDataUrl, signedAt, accepted }: Props) {
    const paidDate = invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString() : null;
    const [testimonial, setTestimonial] = useState(invoice.testimonial || "");

    useEffect(() => {
        setTestimonial(invoice.testimonial || "");
    }, [invoice.testimonial]);

    return (
        <div className="relative bg-white shadow p-6 max-w-4xl mx-auto text-sm leading-relaxed">
            {/* PAID STAMP OVERLAY */}
            {paidDate && (
                <>
                    <div
                        className="absolute top-1/4 left-1/4 w-1/2 h-1/2 opacity-30 z-0"
                        style={{
                            backgroundImage: "url('/paid-stamp.png')",
                            backgroundSize: "contain",
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "center",
                            transform: "rotate(-15deg)"
                        }}
                    />
                    <div className="absolute top-[56%] left-[56%] text-red-600 text-3xl font-bold z-10 transform -rotate-[40deg] -translate-x-1/2 opacity-60">
                        {paidDate}
                    </div>
                </>
            )}

            {/* Header */}
            <div className="flex justify-between items-start mb-4 relative z-10">
                <img src="/zuper_blue.png" alt="ZH" className="h-16" />
                <div className="text-right text-xs">
                    <strong>Zuper Handy Services</strong><br />
                    3907 Cleveland St.<br />
                    Skokie IL. 60076<br />
                    (847) 271-1468<br />
                    billing@zuperhandy.com
                </div>
            </div>

            {/* Invoice & Customer Details */}
            <div className="flex justify-between mb-4 relative z-10">
                <div className="w-1/2">
                    <p><strong>Invoice #: </strong>{invoice.invoice_number}</p>
                    <p><strong>Date: </strong>{new Date(invoice.date).toLocaleDateString()}</p>
                    <p><strong>Status: </strong>{invoice.status}</p>
                    <p><strong>Payment Type: </strong>{invoice.payment_type || "N/A"}</p>
                </div>
                <div className="w-1/2 text-right">
                    <p><strong>Customer:</strong></p>
                    <p>{invoice.customer.name}</p>
                    <p>{invoice.customer.street}</p>
                    <p>{invoice.customer.city}, {invoice.customer.state} {invoice.customer.zipcode}</p>
                    <p>{invoice.customer.phone}</p>
                    <p>{invoice.customer.email}</p>
                </div>
            </div>

            {/* Items Table */}
            <table className="w-full mt-2 border text-xs relative z-10">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border p-2 text-left">Description</th>
                        <th className="border p-2 text-left">Qty</th>
                        <th className="border p-2 text-left">Unit Price</th>
                        <th className="border p-2 text-left">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {invoice.items.map((item: any, idx: number) => (
                        <tr key={idx}>
                            <td className="border p-2">{item.description}</td>
                            <td className="border p-2">{item.quantity}</td>
                            <td className="border p-2">${item.unit_price.toFixed(2)}</td>
                            <td className="border p-2">${(item.quantity * item.unit_price).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="text-right mt-4 relative z-10">
                <p>Subtotal: ${invoice.total.toFixed(2)}</p>
                <p>Discount: -${(invoice.discount || 0).toFixed(2)}</p>
                <p>Tax: {(invoice.tax || 0).toFixed(2)}%</p>
                <p className="font-bold text-base">Total Due: ${invoice.final_total.toFixed(2)}</p>
            </div>

            {/* Notes */}
            {invoice.notes && (
                <div className="mt-4 relative z-10">
                    <strong>Notes:</strong>
                    <p>{invoice.notes}</p>
                </div>
            )}

            {/* Signature */}
            <div className="mt-6 relative z-10">
                <strong>Customer Signature:</strong><br />
                {signatureDataUrl && accepted ? (
                    <>
                        <img src={signatureDataUrl} alt="Signature" className="h-20 mt-2" />
                        <p className="text-xs italic mt-1">
                            Signed and accepted on {signedAt || "N/A"}.
                        </p>
                        <p className="text-xs text-gray-600">
                            (Customer acknowledged work completion and agreed to terms.)
                        </p>
                        {testimonial && (
                            <blockquote className="mt-6 border-l-4 border-gray-400 pl-4 italic text-sm text-gray-700">
                                {testimonial}
                                <br />
                                <span className="text-xs text-right block mt-1">— {invoice.customer.name}</span>
                            </blockquote>
                        )}
                    </>
                ) : (
                    <>
                        <div className="border-b border-black h-20 w-64 mt-2"></div>
                        <span className="text-xs">(Sign here)</span>
                    </>
                )}
            </div>
        </div>
    );
}
