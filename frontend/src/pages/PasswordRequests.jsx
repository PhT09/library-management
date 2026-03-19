import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Card } from 'primereact/card';
import { Dialog } from 'primereact/dialog';
import { Password } from 'primereact/password';
import { librarianApi, ticketApi } from '../services/api';

export default function PasswordRequests() {
    const [userRole] = useState(localStorage.getItem('userRole'));
    
    if (userRole !== 'admin') {
        return <Navigate to="/admin/books" replace />;
    }

    const [users, setUsers] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // States cho dialog
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [displayResetDialog, setDisplayResetDialog] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    
    const toast = useRef(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [usersData, ticketsData] = await Promise.all([
                librarianApi.getAll().catch(err => {
                    console.error('Librarian API Error:', err);
                    return [];
                }),
                ticketApi.getAll().catch(err => {
                    console.error('Ticket API Error:', err);
                    return [];
                })
            ]);
            
            setUsers(Array.isArray(usersData) ? usersData : []);
            setTickets(Array.isArray(ticketsData) ? ticketsData : []);
        } catch (err) {
            console.error('Unexpected error', err);
            toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleApproveTicket = async () => {
        if (!newPassword || newPassword.length < 6) {
            toast.current.show({ severity: 'warn', summary: 'Không hợp lệ', detail: 'Mật khẩu mới phải từ 6 ký tự' });
            return;
        }

        try {
            // Gọi API backend xử lý ticket cùng với mật khẩu mới
            await ticketApi.approve(selectedTicket.id, newPassword);
            
            const username = users.find(u => u.id === selectedTicket.user_id)?.username || `ID: ${selectedTicket.user_id}`;
            toast.current.show({ 
                severity: 'success', 
                summary: 'Thành công', 
                detail: `Đã cấp mật khẩu mới cho ${username} và xử lý yêu cầu!`
            });
            
            setDisplayResetDialog(false);
            setNewPassword('');
            loadData();
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Lỗi', detail: err.message });
        }
    };

    return (
        <div className="p-2">
            <Toast ref={toast} />
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-gray-800">Yêu cầu đổi mật khẩu</h1>
            </div>

            <Card className="shadow-sm pr-10 pl-10">
                <DataTable value={tickets} loading={loading} emptyMessage="Hiện tại không có yêu cầu nào." className="p-datatable-sm">
                    <Column header="Tên đăng nhập" body={(r) => users.find(u => u.id === r.user_id)?.username || `User ID: ${r.user_id}`} sortable />
                    <Column field="reason" header="Lý do yêu cầu" />
                    <Column field="created_at" header="Thời gian gửi" body={(r) => new Date(r.created_at).toLocaleString('vi-VN')} sortable />
                    <Column header="Thao tác" body={(r) => (
                        <div className="flex gap-2">
                            <Button 
                                icon="pi pi-refresh" 
                                className="p-button-sm p-button-warning" 
                                onClick={() => {
                                    setSelectedTicket(r);
                                    setNewPassword('');
                                    setDisplayResetDialog(true);
                                }} 
                                tooltip="Cấp mật khẩu mới và đóng yêu cầu"
                            />
                            <Button 
                                icon="pi pi-trash" 
                                className="p-button-sm p-button-text p-button-danger" 
                                onClick={() => {
                                    if(window.confirm('Từ chối/Xóa yêu cầu này mà không thay đổi mật khẩu?')) {
                                        ticketApi.delete(r.id).then(() => {
                                            toast.current.show({ severity: 'success', summary: 'Đã xóa', detail: 'Yêu cầu đã bị từ chối/xóa' });
                                            loadData();
                                        }).catch(e => {
                                            toast.current.show({ severity: 'error', summary: 'Lỗi', detail: e.message });
                                        });
                                    }
                                }} 
                                tooltip="Từ chối/Xóa yêu cầu"
                            />
                        </div>
                    )} />
                </DataTable>
            </Card>

            {/* Dialog Đặt lại mật khẩu */}
            <Dialog 
                header={`Reset mật khẩu cho: ${users.find(u => u.id === selectedTicket?.user_id)?.username || selectedTicket?.user_id}`} 
                visible={displayResetDialog} 
                style={{ width: '400px' }} 
                modal 
                onHide={() => setDisplayResetDialog(false)}
            >
                <div className="flex flex-col gap-4 pt-2 p-fluid">
                    <label className="font-semibold text-gray-700">Mật khẩu mới (tối thiểu 6 ký tự)</label>
                    <Password 
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        toggleMask 
                        className="w-full"
                        feedback={false}
                        placeholder="Ví dụ: password123"
                    />
                    <div className="flex justify-end gap-2 mt-2">
                        <Button label="Hủy" icon="pi pi-times" className="p-button-text p-button-secondary" onClick={() => setDisplayResetDialog(false)} />
                        <Button label="Xác nhận cấp lại" icon="pi pi-check" className="p-button-warning" onClick={handleApproveTicket} />
                    </div>
                </div>
            </Dialog>
        </div>
    );
}
