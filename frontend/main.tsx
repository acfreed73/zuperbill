// frontend/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import {
    createBrowserRouter,
    RouterProvider,
    Outlet,
} from "react-router-dom";

import Root from "./src/root";
import Home from "./src/routes/home";
import RequireAuth from "./src/components/RequireAuth";
import AddCustomer from "./src/routes/customers/add";
import CreateInvoice from "./src/routes/invoices/create-invoice";
import CustomerList from "./src/routes/customers/list";
import InvoicesList from "./src/routes/invoices/list";
import EditCustomer from "./src/routes/customers/edit";
import EditInvoice from "./src/routes/invoices/edit-invoice";
import AcknowledgeInvoice from "./src/routes/invoices/acknowledge";
import Login from "./src/routes/login";
import PublicInvoice from "./src/routes/public/invoice";
import TechSummaryReport from "@/components/TechSummaryReport";

const router = createBrowserRouter([
    {
        path: "/",
        element: <RequireAuth />,  // 🔐 Protected area
        children: [
            {
                path: "/",
                element: <Root />,
                children: [
                    { index: true, element: < CustomerList /> },
                    { path: "add-customer", element: <AddCustomer /> },
                    { path: "customers", element: <CustomerList /> },
                    { path: "invoices", element: <InvoicesList /> },
                    { path: "edit-customer/:id", element: <EditCustomer /> },
                    { path: "edit-invoice/:invoiceId", element: <EditInvoice /> },
                    { path: "create-invoice/:customerId", element: <CreateInvoice /> },
                    { path: "invoices/:invoiceId/acknowledge", element: <AcknowledgeInvoice /> },
                    { path: "reports/tech-summary", element: <TechSummaryReport /> }
                ],
            },
        ],
    },
    { path: "/login", element: <Login /> },  // 🔓 Public
    { path: "/public/invoice/:token", element: <PublicInvoice /> },  // 🔓 Public
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>
);
