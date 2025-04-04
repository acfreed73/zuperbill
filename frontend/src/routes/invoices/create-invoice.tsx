import { useParams } from "react-router-dom";
import InvoiceForm from "../../components/InvoiceForm";

export default function CreateInvoiceRoute() {
    const { customerId } = useParams();

    if (!customerId) return <div>Invalid customer ID.</div>;

    return (
        <div className="p-4 max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Create Invoice</h1>
            <InvoiceForm customerId={customerId} />
        </div>
    );
}
