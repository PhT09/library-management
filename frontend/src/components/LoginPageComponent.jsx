import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { authApi } from '../services/api';

export default function LoginPageComponent({ title, roleLabel, requiredRole, icon }) {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!username || !password) {
            setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!');
            return;
        }

        setLoading(true);
        try {
            // Bước 1: Login lấy token
            await authApi.login(username, password);

            // Bước 2: Lấy info
            const userData = await authApi.getMe();

            // Bước 3: Kiểm tra quyền truy cập (Quan trọng!)
            const currentUserRole = userData.role ? userData.role.toLowerCase() : '';
            if (requiredRole && currentUserRole !== requiredRole.toLowerCase()) {
                // Nếu đăng nhập sai trang (VD: Thủ thư vào trang Admin)
                authApi.logout(); 
                setError(`Tài khoản này không có quyền truy cập trang dành cho ${roleLabel}.`);
                return;
            }

            // Bước 4: Điều hướng
            if (userData.role === 'admin') {
                navigate('/admin/users');
            } else {
                navigate('/admin/books');
            }
        } catch (err) {
            setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <Card className="w-full max-w-md shadow-lg border-t-4" style={{ borderRadius: '12px', borderTopColor: requiredRole === 'admin' ? '#ef4444' : '#3b82f6' }}>
                <div className="text-center mb-6">
                    <i className={`${icon} ${requiredRole === 'admin' ? 'text-red-600' : 'text-blue-600'} text-5xl mb-3`}></i>
                    <h2 className="text-2xl font-bold text-gray-800 m-0">{title}</h2>
                    <p className="text-gray-500 mt-2">Dành cho {roleLabel}</p>
                </div>

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                            <i className="pi pi-exclamation-circle mr-2"></i>
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <label className="font-semibold text-gray-700">Tên đăng nhập</label>
                        <InputText
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="p-3"
                            placeholder="Nhập tên đăng nhập"
                            disabled={loading}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="font-semibold text-gray-700">Mật khẩu</label>
                        <Password
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            toggleMask
                            feedback={false}
                            inputClassName="w-full p-3"
                            placeholder="Nhập mật khẩu"
                            disabled={loading}
                        />
                    </div>

                    <div className="flex items-center justify-between text-sm mt-2">
                         <a href="#" className="text-blue-600 hover:underline" onClick={() => navigate('/forgot-password')}>Quên mật khẩu?</a>
                    </div>

                    <Button
                        type="submit"
                        label={loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                        className={`w-full p-3 mt-4 text-lg ${requiredRole === 'admin' ? 'p-button-danger' : 'p-button-info'}`}
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
