import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import InvoicePreview from "../../components/InvoicePreview";

export default function AcknowledgeInvoice() {
    const { invoiceId } = useParams<{ invoiceId: string }>();
    const sigRef = useRef<SignatureCanvas>(null);
    const [invoice, setInvoice] = useState<any>(null);
    const [agreed, setAgreed] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [signed, setSigned] = useState(false);

    useEffect(() => {
        fetch(`http://192.168.1.187:8000/invoices/${invoiceId}`)
            .then(res => res.json())
            .then(setInvoice)
            .catch(err => console.error("Failed to load invoice", err));
    }, [invoiceId]);

    const handleSubmit = async () => {
        if (!agreed || sigRef.current?.isEmpty()) {
            alert("Please agree to the terms and sign before submitting.");
            return;
        }

        setSubmitting(true);
        const signatureData = sigRef.current?.toDataURL("image/png");
        const payload = {
            signature_base64: signatureData,
            accepted: true,
            signed_at: new Date().toISOString()
        };

        const res = await fetch(`http://192.168.1.187:8000/invoices/${invoiceId}/acknowledge`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("Invoice acknowledged. Receipt emailed.");
            window.location.href = "/customers";
        } else {
            alert("Failed to submit. Try again.");
        }

        setSubmitting(false);
    };

    const handleClear = () => {
        sigRef.current?.clear();
        setSigned(false);
    };

    if (!invoice) return <p className="p-4">Loading...</p>;

    const signatureData = signed ? sigRef.current?.toDataURL("image/png") : undefined;

    return (
        <div className="p-4 max-w-5xl mx-auto">
            <InvoicePreview
                invoice={invoice}
                signatureDataUrl={signatureData}
                signedAt={new Date().toLocaleString()}
                accepted={agreed}
            />

            <div className="mt-6">
                <label className="block font-semibold mb-2">Terms & Conditions</label>

                <div className="border p-3 text-xs h-48 overflow-y-scroll bg-gray-50 rounded leading-snug space-y-2">
                    <h3 className="font-semibold text-sm">Terms and Conditions</h3>
                    <p><strong>Last updated:</strong> March 31, 2025</p>

                    <p><strong>1. Scope of Services</strong><br />
                        The following services are offered by Zuper Handy, hereafter referred to as "Company":</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>General Home Repairs: Patching holes, fixing trim, adjusting doors and hardware, light fixture swaps.</li>
                        <li>Electrical: Replacing GFCI outlets, light switches, ceiling fans, doorbells (non-permitted work only).</li>
                        <li>Plumbing: Faucet and fixture replacement, toilet installation, minor leak repairs (no water main or gas line work).</li>
                        <li>Smart Tech: Doorbell cameras, smart switches, Wi-Fi devices, thermostat replacements, smart locks.</li>
                        <li>Child Safety & Accessibility: Installing cabinet latches, baby gates, outlet covers, grab bars, bed rails.</li>
                        <li>Assembly & Mounting: Furniture assembly, wall-mounting TVs, shelves, and art.</li>
                        <li>Other Tasks: Additional tasks may be performed at the Company’s discretion and are subject to the same terms.</li>
                    </ul>
                    <p>Any work requiring licensed contracting, electrical permits, plumbing beyond fixture replacement, or structural alterations is outside the scope of this agreement.</p>

                    <p><strong>2. Payment Terms</strong><br />
                        Standard rate is $100/hour, with a 1-hour minimum per visit. Time is billed in full-hour increments. Payment is due upon completion unless agreed in advance. Accepted: Cash, Check, Zelle.<br />
                        Returned checks incur a $35 fee. Late payments incur 1.5% monthly interest. Invoices unpaid after 14 days may be sent to collections.</p>

                    <p><strong>3. Insurance</strong><br />
                        The Company carries general liability insurance for damages caused by gross negligence. Does not cover damage from pre-existing issues, client-supplied materials, or hidden structural conditions.</p>

                    <p><strong>4. Liability and Indemnification</strong><br />
                        The Client indemnifies Zuper Handy from claims or damages arising from injuries not caused by our negligence, client-supplied materials, or existing site conditions. Liability is limited to the total value of services. No incidental/consequential damages awarded.</p>

                    <p><strong>5. Workmanship Guarantee</strong><br />
                        30-day labor warranty. Does not cover materials. Warranty void if work is altered or misused.</p>

                    <p><strong>6. Appointment Policies</strong><br />
                        Cancel at least 24 hours in advance. Late cancellations/no-shows may incur 1-hour charge. Time starts upon arrival.</p>

                    <p><strong>7. Right to Refuse Service</strong><br />
                        We may decline or cancel service if unsafe, inaccessible, or if client behavior is abusive.</p>

                    <p><strong>8. Photo Documentation</strong><br />
                        Before/after photos may be used for liability and marketing unless client opts out in writing.</p>

                    <p><strong>9. Acts of God / Force Majeure</strong><br />
                        Not liable for failure to perform due to natural disasters, outages, strikes, pandemics, or other uncontrollable events.</p>

                    <p><strong>10. Termination of Contract</strong><br />
                        Either party may terminate service at any time. Services to date must be paid. Prepaid work is prorated.</p>

                    <p><strong>11. Dispute Resolution</strong><br />
                        Disputes will first attempt resolution in good faith. If unresolved, disputes go to mediation or binding arbitration in Illinois.</p>

                    <p><strong>12. Governing Law</strong><br />
                        This Agreement is governed by Illinois state law.</p>

                    <p><strong>13. Acceptance of Terms</strong><br />
                        By requesting or confirming service, the Client accepts these terms whether via phone, email, text, or booking form.</p>
                </div>


                <label className="block mt-2">
                    <input
                        type="checkbox"
                        className="mr-2"
                        checked={agreed}
                        onChange={() => setAgreed(!agreed)}
                    />
                    I agree to the terms and acknowledge work completion.
                </label>
            </div>

            <div className="mt-4">
                <label className="block font-semibold mb-2">Signature</label>
                <SignatureCanvas
                    ref={sigRef}
                    penColor="black"
                    canvasProps={{ width: 600, height: 200, className: "border rounded" }}
                    onEnd={() => setSigned(true)}
                />
                <button onClick={handleClear} className="text-sm mt-2 text-blue-600">Clear</button>
            </div>

            <button
                onClick={handleSubmit}
                disabled={submitting}
                className="mt-6 bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50"
            >
                {submitting ? "Submitting..." : "Submit Acknowledgment"}
            </button>
        </div>
    );
}
