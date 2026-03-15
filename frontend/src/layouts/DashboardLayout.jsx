import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import { Menu } from 'primereact/menu';
import { authApi } from '../services/api';

export default function DashboardLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Lấy thông tin user từ localStorage (đã lưu sau khi login qua authApi.getMe())
    const userRole = localStorage.getItem('userRole') || 'librarian';
    const userInfo = authApi.getUserInfo();

    const getMenuItems = () => {
        const commonItems = [];

        const librarianItems = [
            { label: 'Quản lý Danh mục sách', icon: 'pi pi-book', command: () => navigate('/admin/books') },
            { label: 'Quản lý Độc giả', icon: 'pi pi-users', command: () => navigate('/admin/readers') },
            { label: 'Mượn/Trả sách', icon: 'pi pi-arrow-right-arrow-left', command: () => navigate('/admin/borrow-return') }
        ];

        const adminItems = [
            { label: 'Quản lý Người dùng hệ thống', icon: 'pi pi-id-card', command: () => navigate('/admin/users') },
            { label: 'Cấu phần hệ thống', icon: 'pi pi-cog', command: () => navigate('/admin/settings') }
        ];

        return userRole === 'admin' ? [...adminItems, ...commonItems] : [...librarianItems, ...commonItems];
    };

    /**
     * Đăng xuất: xóa token + userRole + userInfo khỏi localStorage,
     * sau đó redirect về trang login
     */
    const handleLogout = () => {
        authApi.logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            {/* Sidebar */}
            <aside className={`${isSidebarOpen ? 'w-64' : 'w-0'} bg-white shadow-md transition-width duration-300 flex flex-col overflow-hidden`}>
                <div className="h-16 flex items-center justify-center border-b border-gray-200 shrink-0">
                    <i className="pi pi-book text-blue-600 text-2xl mr-2"></i>
                    <h2 className="text-xl font-bold text-gray-800 whitespace-nowrap">Admin Portal</h2>
                </div>

                <div className="flex-grow py-4 px-3 overflow-y-auto">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
                        {userRole === 'admin' ? 'Quản trị viên' : 'Thủ thư'}
                    </p>
                    <Menu model={getMenuItems()} className="w-full border-none p-0" />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-grow flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 z-10">
                    <Button
                        icon="pi pi-bars"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-button-text p-button-rounded text-gray-600"
                        aria-label="Toggle Sidebar"
                    />

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            {/* Hiển thị full_name thực từ backend, fallback nếu chưa có */}
                            <p className="text-sm font-semibold text-gray-800 m-0">
                                {userInfo?.full_name || (userRole === 'admin' ? 'Admin' : 'Thủ thư')}
                            </p>
                            <p className="text-xs text-gray-500 m-0 capitalize">{userRole}</p>
                        </div>
                        <Avatar icon="pi pi-user" shape="circle" className="bg-blue-100 text-blue-800 cursor-pointer" />
                        <Button
                            icon="pi pi-sign-out"
                            className="p-button-text p-button-danger p-button-sm ml-2"
                            onClick={handleLogout}
                            tooltip="Đăng xuất"
                            tooltipOptions={{ position: 'bottom' }}
                        />
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-grow p-6 overflow-y-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
