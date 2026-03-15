import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { authApi } from '../services/api';

export default function LoginPage() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    /**
     * Xử lý đăng nhập:
     * 1) POST /login → nhận access_token (OAuth2 form-urlencoded)
     * 2) GET /login/test-token → nhận thông tin user (role, full_name...)
     * 3) Redirect theo role: admin → /admin/users, librarian → /admin/books
     */
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!username || !password) {
            setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!');
            return;
        }

        setLoading(true);
        try {
            // Bước 1: Gọi API login để lấy JWT token
            await authApi.login(username, password);

            // Bước 2: Gọi API lấy thông tin user hiện tại (role, full_name, ...)
            const userData = await authApi.getMe();

            // Bước 3: Điều hướng dựa trên role từ backend
            if (userData.role === 'admin') {
                navigate('/admin/users');
            } else {
                navigate('/admin/books');
            }
        } catch (err) {
            // Hiển thị lỗi từ backend (VD: "Incorrect username or password")
            setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <Card className="w-full max-w-md shadow-lg" style={{ borderRadius: '12px' }}>
                <div className="text-center mb-6">
                    <i className="pi pi-book text-blue-600 text-5xl mb-3"></i>
                    <h2 className="text-2xl font-bold text-gray-800 m-0">Đăng nhập hệ thống</h2>
                    <p className="text-gray-500 mt-2">Dành cho Cán bộ thư viện & Quản trị viên</p>
                </div>

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                            <i className="pi pi-exclamation-circle mr-2"></i>
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <label htmlFor="username" className="font-semibold text-gray-700">Tên đăng nhập</label>
                        <InputText
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="p-3"
                            placeholder="Nhập tên đăng nhập"
                            disabled={loading}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="password" className="font-semibold text-gray-700">Mật khẩu</label>
                        <Password
                            inputId="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            toggleMask
                            feedback={false}
                            className="w-full"
                            inputClassName="w-full p-3"
                            placeholder="Nhập mật khẩu"
                            disabled={loading}
                        />
                    </div>

                    <div className="flex items-center justify-between text-sm mt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                            <span className="text-gray-600">Ghi nhớ đăng nhập</span>
                        </label>
                        <a href="#" className="text-blue-600 hover:underline">Quên mật khẩu?</a>
                    </div>

                    <Button
                        type="submit"
                        label={loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                        className="w-full p-3 mt-4 text-lg"
                        disabled={loading}
                        icon={loading ? 'pi pi-spin pi-spinner' : null}
                    />

                    <div className="text-center mt-4">
                        <Button
                            type="button"
                            label="Quay lại Trang chủ"
                            icon="pi pi-arrow-left"
                            className="p-button-text p-button-sm text-gray-600"
                            onClick={() => navigate('/')}
                        />
                    </div>
                </form>
            </Card>
        </div>
    );
}
