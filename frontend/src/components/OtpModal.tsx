import { useState, useEffect, useRef } from "react";
import api from "@/services/api";

export default function OtpModal({ uuid, onVerified }: { uuid: string; onVerified: () => void }) {
    const [pin, setPin] = useState("");
    const [message, setMessage] = useState("A PIN has been sent to your email.");
    const [canResend, setCanResend] = useState(false);
    const [seconds, setSeconds] = useState(120);
    const [verifying, setVerifying] = useState(false);
    const [otpActive, setOtpActive] = useState(true);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const hasStartedRef = useRef(false);

    useEffect(() => {
        if (!uuid || hasStartedRef.current) return;

        hasStartedRef.current = true;

        const sendInitialOtp = async () => {
            console.log("[OTP Modal] Sending initial OTP for UUID:", uuid);
            try {
                const res = await api.get(`/public/invoice/${uuid}/request-otp`);
                const backendMessage = res?.data?.message;
                console.log("[OTP Modal] Response message:", backendMessage);
                setMessage(backendMessage || "A PIN has been sent to your email.");
            } catch (err) {
                console.error("[OTP Modal] Failed to send OTP:", err);
                setMessage("Failed to send OTP. Please refresh.");
            }
        };

        const startTimer = () => {
            setSeconds(120);
            setOtpActive(true);
            setCanResend(false);

            if (intervalRef.current) clearInterval(intervalRef.current);

            intervalRef.current = setInterval(() => {
                setSeconds((s) => {
                    if (s <= 1) {
                        clearInterval(intervalRef.current!);
                        setCanResend(true);
                        setOtpActive(false);
                        return 0;
                    }
                    return s - 1;
                });
            }, 1000);
        };

        sendInitialOtp();
        startTimer();

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [uuid]);

    const verifyPin = async () => {
        setVerifying(true);
        console.log(`[OTP Modal] Verifying PIN: ${pin}`);
        try {
            await api.post(`/public/invoice/${uuid}/verify-otp`, { pin });
            console.log("[OTP Modal] PIN verified.");
            onVerified();
        } catch {
            console.warn("[OTP Modal] PIN verification failed.");
            setMessage("Invalid or expired PIN. Please try again.");
        } finally {
            setVerifying(false);
        }
    };

    const resendOtp = async () => {
        setCanResend(false);
        setSeconds(120);
        setMessage("Requesting new PIN...");
        try {
            const res = await api.get(`/public/invoice/${uuid}/request-otp`);
            setMessage(res.data.message || "A new PIN has been sent to your email.");
        } catch {
            setMessage("Failed to resend OTP. Please try again.");
        }
    };

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60).toString().padStart(2, "0");
        const sec = (s % 60).toString().padStart(2, "0");
        return `${m}:${sec}`;
    };

    const progress = ((120 - seconds) / 120) * 100;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm text-center space-y-4 relative">
                <h2 className="text-xl font-semibold">Enter Your One-Time PIN</h2>
                <p>{message}</p>

                {otpActive ? (
                    <>
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
                    </>
                ) : (
                    <button onClick={resendOtp} className="text-blue-600 underline text-sm">
                        Resend PIN
                    </button>
                )}

                <div className="text-sm text-gray-500">
                    {otpActive ? (
                        <>
                            Time remaining: <span className="font-mono">{formatTime(seconds)}</span>
                            <div className="w-full h-2 bg-gray-200 mt-1 rounded">
                                <div
                                    className="h-2 bg-blue-500 rounded transition-all"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </>
                    ) : (
                        <p>Your PIN expired. Click “Resend PIN” to try again.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
