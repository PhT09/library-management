import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { authApi, ticketApi } from '../services/api';

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [userType, setUserType] = useState(null); // 'admin' | 'librarian'
    const [username, setUsername] = useState('');
    const [reason, setReason] = useState('Quên mật khẩu');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSendTicket = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await ticketApi.create(username, reason);
            setSuccess(true);
        } catch (err) {
            setError(err.message || 'Không thể gửi yêu cầu lúc này.');
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        if (success) {
            return (
                <div className="text-center py-4">
                    <i className="pi pi-check-circle text-green-500 text-6xl mb-4"></i>
                    <h2 className="text-2xl font-bold mb-2">Đã gửi yêu cầu!</h2>
                    <p className="text-gray-600 mb-6 px-4">
                        Yêu cầu khôi phục mật khẩu của bạn đã được gửi đến hệ thống. 
                        Vui lòng chờ Admin phê duyệt.
                    </p>
                    <Button label="Quay lại Đăng nhập" icon="pi pi-arrow-left" onClick={() => navigate('/')} className="w-full" />
                </div>
            );
        }

        if (!userType) {
            return (
                <div className="flex flex-col gap-4">
                    <p className="text-gray-600 text-center mb-4">Để cấp lại mật khẩu, vui lòng chọn vai trò của bạn:</p>
                    <Button label="Tôi là Thủ thư" icon="pi pi-id-card" onClick={() => setUserType('librarian')} className="p-button-info p-3" />
                    <Button label="Tôi là Quản trị viên (Admin)" icon="pi pi-shield" onClick={() => setUserType('admin')} className="p-button-danger p-3" />
                    <Button label="Hủy" type="button" className="p-button-text text-gray-600" onClick={() => navigate('/')} />
                </div>
            );
        }

        if (userType === 'admin') {
            return (
                <div className="text-center">
                    <i className="pi pi-exclamation-triangle text-red-500 text-5xl mb-4"></i>
                    <h3 className="text-xl font-bold mb-2 text-red-600">Dành cho Quản trị viên</h3>
                    <p className="text-gray-700 mb-6 px-2 text-sm">
                        Vì lý do bảo mật, tài khoản Admin không thể tự khôi phục. 
                        Vui lòng liên hệ Nhà phát hành: <br/> <strong>support@publisher.com</strong>
                    </p>
                    <Button label="Quay lại" icon="pi pi-arrow-left" onClick={() => setUserType(null)} className="p-button-text w-full" />
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-4">
                <div className="text-center mb-2">
                    <i className="pi pi-id-card text-blue-500 text-5xl mb-2"></i>
                    <h3 className="text-xl font-bold text-blue-600">Yêu cầu cấp lại mật khẩu</h3>
                </div>
                
                <form onSubmit={handleSendTicket} className="flex flex-col gap-4 p-fluid">
                    {error && <Message severity="error" text={error} />}
                    <div className="flex flex-col gap-2">
                        <label className="font-semibold text-sm">Tên đăng nhập (Username)</label>
                        <InputText value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="VD: thuthu_01" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="font-semibold text-sm">Lý do/Ghi chú</label>
                        <InputText value={reason} onChange={(e) => setReason(e.target.value)} placeholder="VD: Quên mật khẩu hoặc bị mất tài khoản" />
                    </div>
                    <Button label="Gửi Ticket cho Admin" icon="pi pi-send" loading={loading} className="mt-2" />
                    <Button label="Quay lại" type="button" onClick={() => setUserType(null)} className="p-button-text" />
                </form>
            </div>
        );
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <Card className="w-full max-w-md shadow-lg" title={!userType ? "Quên mật khẩu?" : ""}>
                {renderContent()}
            </Card>
        </div>
    );
}
