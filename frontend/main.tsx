import React from "react";
import ReactDOM from "react-dom/client";
import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";
import Root from "./src/root";
import Home from "./src/routes/home";
import AddCustomer from "./src/routes/customers/add"; 
import CreateInvoice from "./src/routes/invoices/create-invoice";
import CustomerList from "./src/routes/customers/list";
import InvoicesList from "./src/routes/invoices/list";
import EditCustomer from "./src/routes/customers/edit";
import EditInvoice from "./src/routes/invoices/edit-invoice";
import AcknowledgeInvoice from "./src/routes/invoices/acknowledge";
import PublicInvoice from "./src/routes/public/invoice";


const router = createBrowserRouter([
    {
        path: "/",
        element: <Root />,
        children: [
            { index: true, element: <Home />, },
            { path: "add-customer", element: <AddCustomer />, }, 
            { path: "customers", element: <CustomerList />, },
            { path: "invoices", element: <InvoicesList /> },
            { path: "edit-customer/:id", element: <EditCustomer /> },
            { path: "edit-invoice/:invoiceId", element: <EditInvoice /> },
            { path: "create-invoice/:customerId", element: <CreateInvoice /> },
            { path: "invoices/:invoiceId/acknowledge", element: <AcknowledgeInvoice /> }, 
        ],
    },
        { path: "/public/invoice/:token", element: <PublicInvoice />, },

]);

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>
);
