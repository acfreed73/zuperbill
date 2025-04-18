//frontend/src/routes/admin/backup.tsx
import { useState } from "react";
import axios from "@/services/api";

export default function BackupPage() {
    const [file, setFile] = useState<File | null>(null);
    const [message, setMessage] = useState("");

    const downloadBackup = async () => {
        const response = await axios.get("/admin/download");
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `zuperbill-backup-${new Date().toISOString()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const uploadBackup = async () => {
        if (!file) {
            setMessage("Please select a backup file first!");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            await axios.post("/admin/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            setMessage("✅ Backup restored successfully!");
        } catch (err) {
            console.error(err);
            setMessage("❌ Error restoring backup.");
        }
    };


    return (
        <div className="p-4">
            <h1 className="text-xl mb-4">Backup and Restore</h1>

            <button onClick={downloadBackup} className="p-2 bg-blue-500 text-white rounded mb-4">
                Download Backup
            </button>

            <div className="mt-6 flex flex-col gap-4">
                <label className="block">
                    <span className="sr-only">Choose backup file</span>
                    <input
                        type="file"
                        accept=".json"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                       file:rounded-full file:border-0
                       file:text-sm file:font-semibold
                       file:bg-blue-50 file:text-blue-700
                       hover:file:bg-blue-100"
                    />
                </label>

                <button
                    onClick={uploadBackup}
                    className="p-2 bg-green-500 hover:bg-green-600 text-white rounded"
                >
                    Upload and Restore Backup
                </button>
            </div>

            {message && <p className="mt-4">{message}</p>}
        </div>
    );
}
