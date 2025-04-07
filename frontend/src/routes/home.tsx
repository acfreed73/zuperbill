// frontend/src/routes/home.tsx
import { Outlet, useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-800 text-white p-4 flex justify-between items-center">
        <img src="/zuperhandy_white.gif" alt="ZuperHandy Logo" className="h-10" />
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </header>
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  );
}
// export default function Home() {
//   return (
//     <div className="p-6">
//       <h1 className="text-4xl font-bold mb-4">ZuperBill</h1>
//       <p className="text-lg">Your invoicing assistant. Add customers, create invoices, and capture signatures.</p>
//     </div>
//   );
// }
