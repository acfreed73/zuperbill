import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/services/api";
import InvoicePreview from "@/components/InvoicePreview";
import SignatureCanvas from "react-signature-canvas";

export default function PublicInvoiceView() {
    const { token } = useParams<{ token: string }>();
    const [invoice, setInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [verified, setVerified] = useState(false);

    const [pin, setPin] = useState("");
    const [message, setMessage] = useState("A PIN has been sent to your email.");
    const [canResend, setCanResend] = useState(false);
    const [seconds, setSeconds] = useState(120);
    const [verifying, setVerifying] = useState(false);

    // Signature related
    const sigRef = useRef<SignatureCanvas>(null);
    const [agreed, setAgreed] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [signed, setSigned] = useState(false);
    const [cleared, setCleared] = useState(false);

    useEffect(() => {
        if (token) {
            api.get(`/public/invoice/${token}/request-otp`)
                .catch(() => setMessage("Failed to send OTP. Please refresh."));
        }

        const interval = setInterval(() => {
            setSeconds((s) => {
                if (s <= 1) {
                    setCanResend(true);
                    clearInterval(interval);
                    return 0;
                }
                return s - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [token]);

    useEffect(() => {
        if (verified && token) {
            api.get(`/public/invoice/${token}`)
                .then(res => setInvoice(res.data))
                .catch(err => console.error("Failed to load invoice", err))
                .finally(() => setLoading(false));
        }
    }, [verified, token]);

    const verifyPin = async () => {
        setVerifying(true);
        try {
            await api.post(`/public/invoice/${token}/verify-otp`, { pin });
            setVerified(true);
        } catch {
            setMessage("Invalid or expired PIN. Please try again.");
        } finally {
            setVerifying(false);
        }
    };

    const resendOtp = async () => {
        setCanResend(false);
        setSeconds(120);
        setMessage("A new PIN has been sent to your email.");
        await api.get(`/public/invoice/${token}/request-otp`);
    };

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60).toString().padStart(2, "0");
        const sec = (s % 60).toString().padStart(2, "0");
        return `${m}:${sec}`;
    };

    const handleClearSignature = () => {
        sigRef.current?.clear();
        setSigned(false);
        setCleared(true);
    };

    const handleSubmit = async () => {
        if (!agreed) {
            alert("You must accept the terms.");
            return;
        }
        if (sigRef.current?.isEmpty() && !(invoice.is_estimate ? invoice.estimate_signature_base64 : invoice.signature_base64)) {
            alert("You must provide a signature.");
            return;
        }

        setSubmitting(true);

        const payload: any = {};

        if (invoice.is_estimate) {
            payload.estimate_accepted = agreed;
            payload.estimate_signed_at = new Date().toISOString();
        } else {
            payload.accepted = agreed;
            payload.signed_at = new Date().toISOString();
        }

        if (!sigRef.current?.isEmpty() && !cleared) {
            if (invoice.is_estimate) {
                payload.estimate_signature_base64 = sigRef.current?.toDataURL("image/png");
            } else {
                payload.signature_base64 = sigRef.current?.toDataURL("image/png");
            }
        }

        try {
            await api.post(`/public/invoice/${token}/acknowledge`, payload);
            alert("Thank you! Your document has been signed and emailed to you.");
            window.location.reload();
        } catch (err: any) {
            alert(err.response?.data?.detail || "Failed to submit acknowledgment.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!verified) {
        const progress = ((120 - seconds) / 120) * 100;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm text-center space-y-4 relative">
                    <h2 className="text-xl font-semibold">Enter Your One-Time PIN</h2>
                    <p>{message}</p>
                    <input
                        type="text"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        className="border p-2 rounded w-full"
                        maxLength={6}
                        placeholder="6-digit PIN"
                    />
                    <button
                        onClick={verifyPin}
                        className="bg-blue-600 text-white rounded px-4 py-2 w-full"
                        disabled={verifying}
                    >
                        {verifying ? "Verifying..." : "Submit"}
                    </button>
                    <div className="text-sm text-gray-600 mt-2">
                        {canResend ? (
                            <button onClick={resendOtp} className="text-blue-600 underline">
                                Resend PIN
                            </button>
                        ) : (
                            <>
                                Time remaining: <span className="font-mono">{formatTime(seconds)}</span>
                                <div className="w-full h-2 bg-gray-200 mt-1 rounded">
                                    <div
                                        className="h-2 bg-blue-500 rounded transition-all"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (loading) return <p className="p-4">Loading...</p>;
    if (!invoice) return <p className="p-4 text-red-600">Document not found.</p>;

    return (
        <div className="p-4 max-w-5xl mx-auto">
            <InvoicePreview
                invoice={invoice}
                signatureDataUrl={invoice.is_estimate ? invoice.estimate_signature_base64 : invoice.signature_base64}
                signedAt={invoice.is_estimate ? invoice.estimate_signed_at : invoice.signed_at}
                accepted={invoice.is_estimate ? invoice.estimate_accepted : invoice.accepted}
                testimonial={invoice.testimonial}
            />

            {!(invoice.is_estimate ? invoice.estimate_accepted : invoice.accepted) ? (
                <div className="mt-8 p-4 border rounded">
                    <h3 className="text-lg font-semibold mb-4">
                        {invoice.is_estimate ? "Accept this Estimate" : "Acknowledge this Invoice"}
                    </h3>

                    {/* Terms and Conditions */}
                    <div className="mb-4">
                        <iframe
                            src="https://callitweb.com/zacharyfreed/terms.html"
                            className="w-full h-40 border rounded"
                            title="Terms"
                        />
                        <label className="block mt-2">
                            <input
                                type="checkbox"
                                className="mr-2"
                                checked={agreed}
                                onChange={() => setAgreed(!agreed)}
                            />
                            {invoice.is_estimate
                                ? "I accept the terms and authorize the work described in this Estimate."
                                : "I agree to the terms and acknowledge work completion."}
                        </label>
                    </div>

                    {/* Signature Pad */}
                    <div className="mb-4">
                        <SignatureCanvas
                            ref={sigRef}
                            penColor="black"
                            canvasProps={{ width: 600, height: 200, className: "border rounded", style: { maxWidth: "100%" } }}
                            onEnd={() => setSigned(true)}
                        />
                        <button onClick={handleClearSignature} className="text-sm mt-2 text-blue-600">
                            Clear
                        </button>
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        className="bg-green-600 text-white px-6 py-2 rounded"
                        disabled={submitting}
                    >
                        {submitting ? "Submitting..." : invoice.is_estimate ? "Accept Estimate" : "Acknowledge Invoice"}
                    </button>
                </div>
            ):(
                // ✅ Render confirmation that it has already been signed
                <div className="mt-8 p-4 border rounded bg-green-50 text-green-800">
                    <h3 className="text-lg font-semibold mb-2">
                        {invoice.is_estimate ? "Estimate Accepted" : "Invoice Acknowledged"}
                    </h3>
                    <p>
                        This {invoice.is_estimate ? "estimate" : "invoice"} was{" "}
                        {invoice.is_estimate ? "accepted" : "acknowledged"} on{" "}
                        <strong>
                            {new Date(invoice.is_estimate ? invoice.estimate_signed_at : invoice.signed_at).toLocaleString()} UTC
                        </strong>.
                    </p>
                </div>
            )}
        </div>
    );
}
