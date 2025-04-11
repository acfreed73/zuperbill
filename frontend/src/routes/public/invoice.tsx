import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/services/api";
import InvoicePreview from "@/components/InvoicePreview";

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
    if (!invoice) return <p className="p-4 text-red-600">Invoice not found.</p>;

    return (
        <div className="p-4 max-w-5xl mx-auto">
            <InvoicePreview
                invoice={invoice}
                signatureDataUrl={invoice.signature_base64 || ""}
                signedAt={invoice.signed_at}
                accepted={invoice.accepted}
                testimonial={invoice.testimonial}
            />
            {invoice.media_folder_url && (
                <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-2">Drive Folder</h3>
                    <a
                        href={invoice.media_folder_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                    >
                        View Folder on Google Drive
                    </a>
                </div>
            )}
        </div>
    );
}
