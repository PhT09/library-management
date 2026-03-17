import { Navigate, Outlet } from 'react-router-dom';

/**
 * ProtectedRoute - Bảo vệ các route yêu cầu quyền cụ thể.
 * @param {string} role - Quyền yêu cầu (admin/librarian)
 */
const ProtectedRoute = ({ allowedRoles }) => {
    const rawRole = localStorage.getItem('userRole');
    const userRole = rawRole ? rawRole.toLowerCase() : '';
    const token = localStorage.getItem('access_token');

    // Nếu chưa đăng nhập, về trang login
    if (!token) {
        return <Navigate to="/" replace />;
    }

    // Nếu quyền không hợp lệ, về trang mặc định của họ (hoặc 403)
    const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());
    if (allowedRoles && !normalizedAllowed.includes(userRole)) {
        return <Navigate to={userRole === 'admin' ? '/admin/users' : '/admin/books'} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
