import React from "react";
import ReactDOM from "react-dom/client";
import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";
import Root from "./app/root";
import Home from "./app/routes/home";
import AddCustomer from "./app/routes/customers/add"; 
import CreateInvoice from "./app/routes/invoices/create-invoice";
import CustomerList from "./app/routes/customers/list";
import InvoicesList from "./app/routes/invoices/list";
import EditCustomer from "./app/routes/customers/edit";
import EditInvoice from "./app/routes/invoices/edit-invoice";

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
        ],
    },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>
);
