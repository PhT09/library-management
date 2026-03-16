import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PublicPage from './pages/PublicPage';
import AdminLoginPage from './pages/AdminLoginPage';
import LibrarianLoginPage from './pages/LibrarianLoginPage';
import DashboardLayout from './layouts/DashboardLayout';
import ReaderManagement from './pages/ReaderManagement';
import BookManagement from './pages/BookManagement';
import BorrowManagement from './pages/BorrowManagement';
import ReturnManagement from './pages/ReturnManagement';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import ForgotPassword from './pages/ForgotPassword';
import ContactPublisher from './pages/ContactPublisher';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicPage />} />
        <Route path="/login" element={<Navigate to="/login-librarian" replace />} />
        <Route path="/login-admin" element={<AdminLoginPage />} />
        <Route path="/login-librarian" element={<LibrarianLoginPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/contact-publisher" element={<ContactPublisher />} />

        {/* Dashboard routes */}
        <Route path="/admin" element={<DashboardLayout />}>
          <Route index element={<Navigate to="readers" replace />} />
          
          {/* Các route mà cả Admin và Thủ thư đều vào được */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'librarian']} />}>
            <Route path="readers" element={<ReaderManagement />} />
            <Route path="books" element={<BookManagement />} />
            <Route path="borrow" element={<BorrowManagement />} />
            <Route path="returns" element={<ReturnManagement />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<div className="p-4 bg-white rounded-lg shadow min-h-[400px]"><h2>Cấu phần hệ thống (Demo)</h2></div>} />
          </Route>

          {/* CHỈ ADMIN mới vào được Quản lý người dùng */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="users" element={<UserManagement />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
