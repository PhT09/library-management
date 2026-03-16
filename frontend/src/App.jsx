import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PublicPage from './pages/PublicPage';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './layouts/DashboardLayout';
import ReaderManagement from './pages/ReaderManagement';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Dashboard routes */}
        <Route path="/admin" element={<DashboardLayout />}>
          <Route index element={<Navigate to="readers" replace />} />
          <Route path="readers" element={<ReaderManagement />} />
          <Route path="books" element={<div className="p-4 bg-white rounded-lg shadow min-h-[400px]"><h2>Quản lý danh mục sách (Demo)</h2></div>} />
          <Route path="borrow-return" element={<div className="p-4 bg-white rounded-lg shadow min-h-[400px]"><h2>Mượn/Trả sách (Demo)</h2></div>} />
          <Route path="users" element={<div className="p-4 bg-white rounded-lg shadow min-h-[400px]"><h2>Quản lý người dùng hệ thống (Demo)</h2></div>} />
          <Route path="change-password" element={<div className="p-4 bg-white rounded-lg shadow min-h-[400px]"><h2>Đổi mật khẩu (Demo)</h2></div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
