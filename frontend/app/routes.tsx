import Root from "./root";
import Home from "./routes/home";
import AddCustomer from "./routes/customers/add";
import CreateInvoice from "./routes/invoices/create-invoice";

import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Root />,
        children: [
            { path: "", element: <Home /> },
            { path: "add-customer", element: <AddCustomer /> },
            { path: "create-invoice/:customerId", element: <CreateInvoice /> },
        ],
    },
]);
