import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Customers from "./pages/Customers";
import Invoices from "./pages/Invoices";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/invoices" element={<Invoices />} />
      </Routes>
    </Router>
  );
}
