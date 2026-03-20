import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';

export default function ContactPublisher() {
    const navigate = useNavigate();

    const header = (
        <div className="bg-red-600 p-4 text-white text-center rounded-t-lg">
            <i className="pi pi-shield text-4xl mb-2"></i>
            <h1 className="text-xl font-bold m-0 uppercase tracking-wider">Cảnh báo bảo mật nâng cao</h1>
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-sans">
            <Card header={header} className="w-full max-w-lg shadow-2xl border-none">
                <div className="py-2">
                    <h2 className="text-2xl font-bold text-gray-800 mb-3 text-center">Khôi phục mật quản trị viên (Admin)</h2>
                    
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <i className="pi pi-exclamation-triangle text-amber-500"></i>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-amber-700">
                                    Vì lý do an ninh tối cao, mật khẩu của tài khoản Quản trị viên (Administrator) không thể được khôi phục tự động qua hệ thống.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="text-gray-700 leading-relaxed italic">
                            Vui lòng thực hiện một trong các phương thức xác thực sau để yêu cầu cấp lại quyền truy cập:
                        </p>

                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <i className="pi pi-envelope text-blue-600 mt-1"></i>
                            <div>
                                <span className="block font-bold text-gray-800">Liên hệ qua Email hỗ trợ kỹ thuật:</span>
                                <a href="mailto:support@university-library.edu.vn" className="text-blue-600 hover:underline">support@university-library.edu.vn</a>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <i className="pi pi-phone text-blue-600 mt-1"></i>
                            <div>
                                <span className="block font-bold text-gray-800">Hotline vận hành hệ thống:</span>
                                <span className="text-gray-700">+84 24 3456 7890 (Máy lẻ 101)</span>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg text-sm">
                            <i className="pi pi-info-circle text-blue-600 mt-1"></i>
                            <div>
                                <span className="block font-bold text-gray-800 underline">Tài liệu hướng dẫn khôi phục bằng Database:</span>
                                <a href="https://docs.pht09.com/library-mng/recovery" target="_blank" className="text-blue-600 hover:underline">Hướng dẫn can thiệp trực tiếp từ cơ sở dữ liệu</a>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-4 border-t flex justify-center">
                        <Button 
                            label="Quay lại Trang Đăng nhập" 
                            icon="pi pi-arrow-left" 
                            className="p-button-outlined p-button-danger px-6"
                            onClick={() => navigate('/login')} 
                        />
                    </div>
                </div>
            </Card>
        </div>
    );
}
