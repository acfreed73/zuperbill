import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/services/api";

interface TechSummary {
    tech_id: number;
    user_name: string;
    ytd: {
        invoice_count: number;
        total_amount: number;
        paid_amount: number;
        unpaid_amount: number;
        overdue_amount: number;
    };
    all_time: {
        invoice_count: number;
        total_amount: number;
    };
}

export default function TechSummaryReport() {
    const [data, setData] = useState<TechSummary[]>([]);

    useEffect(() => {
        api.get("/reports/tech-summary")
            .then(res => setData(res.data))
            .catch(err => console.error("Failed to fetch tech report", err));
    }, []);

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Technician Invoice Summary</h1>
            <table className="w-full text-sm border border-gray-300">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-2 text-left">Tech</th>
                        <th className="p-2 text-left">Invoices (YTD)</th>
                        <th className="p-2 text-left">Total (YTD)</th>
                        <th className="p-2 text-left">Paid $</th>
                        <th className="p-2 text-left">Unpaid $</th>
                        <th className="p-2 text-left">Overdue $</th>
                        <th className="p-2 text-left">Invoices (All)</th>
                        <th className="p-2 text-left">Total (All)</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map(tech => (
                        <tr key={tech.tech_id} className="border-t">
                            <td className="p-2">{tech.user_name}</td>
                            <td className="p-2">
                                <Link
                                    to={`/invoices?tech_id=${tech.tech_id}&period=ytd`}
                                    className="text-blue-600 underline"
                                >
                                    {tech.ytd.invoice_count}
                                </Link>
                            </td>
                            <td className="p-2">
                                <Link
                                    to={`/invoices?tech_id=${tech.tech_id}&period=ytd`}
                                    className="text-blue-600 underline"
                                >
                                    ${tech.ytd.total_amount.toFixed(2)}
                                </Link>
                            </td>
                            <td className="p-2 text-green-600">
                                ${tech.ytd.paid_amount.toFixed(2)}
                            </td>
                            <td className="p-2 text-red-600">
                                ${tech.ytd.unpaid_amount.toFixed(2)}
                            </td>
                            <td className="p-2 text-orange-500">
                                ${tech.ytd.overdue_amount.toFixed(2)}
                            </td>
                            <td className="p-2">
                                <Link
                                    to={`/invoices?tech_id=${tech.tech_id}`}
                                    className="text-blue-600 underline"
                                >
                                    {tech.all_time.invoice_count}
                                </Link>
                            </td>
                            <td className="p-2">
                                <Link
                                    to={`/invoices?tech_id=${tech.tech_id}`}
                                    className="text-blue-600 underline"
                                >
                                    ${tech.all_time.total_amount.toFixed(2)}
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
