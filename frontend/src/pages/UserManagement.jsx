import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { TabView, TabPanel } from 'primereact/tabview';
import { Password } from 'primereact/password';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { librarianApi, ticketApi } from '../services/api';

export default function UserManagement() {
    const [userRole] = useState(localStorage.getItem('userRole'));
    
    // Bảo vệ lớp cuối: Nếu không phải Admin, đuổi về trang sách ngay lập tức
    if (userRole !== 'admin') {
        return <Navigate to="/admin/books" replace />;
    }

    const [users, setUsers] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [displayResetDialog, setDisplayResetDialog] = useState(false);
    const [displayDeleteDialog, setDisplayDeleteDialog] = useState(false);
    const [displayCreateDialog, setDisplayCreateDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [targetLibrarian, setTargetLibrarian] = useState(null);
    const [newUser, setNewUser] = useState({ username: '', password: '', full_name: '' });
    
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
            
            console.log('UserManagement: Loaded data', { usersData, ticketsData });
            
            setUsers(Array.isArray(usersData) ? usersData : []);
            setTickets(Array.isArray(ticketsData) ? ticketsData : []);
        } catch (err) {
            console.error('UserManagement: Unexpected error', err);
            toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async () => {
        if (!newUser.username || !newUser.password || !newUser.full_name) {
            toast.current.show({ severity: 'warn', summary: 'Thiếu thông tin', detail: 'Vui lòng nhập đầy đủ thông tin tài khoản' });
            return;
        }
        try {
            await librarianApi.create(newUser);
            toast.current.show({ severity: 'success', summary: 'Thành công', detail: 'Đã tạo tài khoản thủ thư mới' });
            setDisplayCreateDialog(false);
            setNewUser({ username: '', password: '', full_name: '' });
            loadData();
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Lỗi', detail: err.message });
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword) return;
        try {
            await librarianApi.resetPassword(selectedUser.id, newPassword);
            toast.current.show({ severity: 'success', summary: 'Thành công', detail: `Đã reset mật khẩu cho ${selectedUser.username}` });
            setDisplayResetDialog(false);
            setNewPassword('');
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Lỗi', detail: err.message });
        }
    };

    const handleDeleteUser = async () => {
        if (!targetLibrarian) {
            toast.current.show({ severity: 'warn', summary: 'Cảnh báo', detail: 'Vui lòng chọn thủ thư tiếp nhận dữ liệu' });
            return;
        }
        try {
            await librarianApi.delete(selectedUser.id, targetLibrarian.id);
            toast.current.show({ severity: 'success', summary: 'Thành công', detail: 'Đã xóa tài khoản và chuyển giao dữ liệu' });
            setDisplayDeleteDialog(false);
            loadData();
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Lỗi', detail: err.message });
        }
    };

    const handleApproveTicket = async (ticket) => {
        try {
            // Tìm ID của user dựa trên username trong ticket
            const targetUser = users.find(u => u.username === ticket.username);
            
            if (targetUser) {
                // Thực hiện reset mật khẩu thực sự về mặc định '123456'
                await librarianApi.update(targetUser.id, { 
                    password: 'password123',
                    is_active: true 
                });
            }

            // Gọi API ticket để xóa/phê duyệt ticket (đã mock qua localStorage)
            await ticketApi.approve(ticket.id);
            
            toast.current.show({ 
                severity: 'success', 
                summary: 'Thành công', 
                detail: targetUser 
                    ? `Đã reset mật khẩu cho ${ticket.username} về 'password123' và xóa ticket.` 
                    : `Đã xóa ticket cho ${ticket.username} (Không tìm thấy ID người dùng để reset mật khẩu).`
            });
            loadData();
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Lỗi', detail: err.message });
        }
    };

    // Templates
    const statusBody = (rowData) => <Tag value={rowData.is_active ? 'Active' : 'Inactive'} severity={rowData.is_active ? 'success' : 'danger'} />;
    
    const roleBody = (rowData) => <Tag value={rowData.role.toUpperCase()} severity={rowData.role === 'admin' ? 'info' : 'warning'} />;

    const actionBody = (rowData) => (
        <div className="flex gap-2">
            <Button icon="pi pi-key" className="p-button-rounded p-button-text p-button-warning" onClick={() => { setSelectedUser(rowData); setDisplayResetDialog(true); }} tooltip="Reset Password" />
            <Button icon="pi pi-trash" className="p-button-rounded p-button-text p-button-danger" 
                onClick={() => { setSelectedUser(rowData); setDisplayDeleteDialog(true); }} 
                disabled={rowData.role === 'admin'}
                tooltip="Delete Account" 
            />
        </div>
    );

    return (
        <div className="p-2">
            <Toast ref={toast} />
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-gray-800">Quản trị Hệ thống</h1>
                <Button label="Thêm mới Thủ thư" icon="pi pi-user-plus" onClick={() => setDisplayCreateDialog(true)} />
            </div>

            {tickets.length > 0 && (
                <div className="mb-4">
                    <Message 
                        severity="error" 
                        style={{ width: '100%', justifyContent: 'flex-start', borderWidth: '0 0 0 6px' }}
                        content={(
                            <div className="flex align-items-center">
                                <i className="pi pi-bell text-xl mr-3"></i>
                                <span className="font-bold text-lg">CẢNH BÁO: Bạn có {tickets.length} yêu cầu khôi phục mật khẩu mới!</span>
                                <Button label="Xem ngay" className="p-button-link p-0 ml-3 font-bold" onClick={() => setActiveIndex(1)} />
                            </div>
                        )}
                    />
                </div>
            )}

            <Card className="shadow-sm">
                <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
                    <TabPanel header="Danh sách Nhân viên" leftIcon="pi pi-users mr-2">
                        <DataTable value={users} loading={loading} paginator rows={10} className="p-datatable-sm" dataKey="id">
                            <Column field="id" header="ID" style={{ width: '5%' }} />
                            <Column field="username" header="Username" sortable />
                            <Column field="full_name" header="Họ và Tên" sortable />
                            <Column field="role" header="Vai trò" body={roleBody} style={{ width: '10%' }} />
                            <Column header="Trạng thái" body={statusBody} style={{ width: '10%' }} />
                            <Column header="Hành động" body={actionBody} style={{ width: '15%' }} />
                        </DataTable>
                    </TabPanel>

                    <TabPanel 
                        header={
                            <div className="flex align-items-center">
                                <span className="mr-2">Yêu cầu đổi mật khẩu</span>
                                {tickets.length > 0 && <Tag value={tickets.length} severity="danger" rounded />}
                            </div>
                        } 
                        leftIcon="pi pi-ticket mr-2"
                    >
                        <DataTable value={tickets} loading={loading} emptyMessage="Hiện tại không có yêu cầu nào." className="p-datatable-sm">
                            <Column field="username" header="Tên đăng nhập" sortable />
                            <Column field="reason" header="Lý do yêu cầu" />
                            <Column field="created_at" header="Thời gian gửi" body={(r) => new Date(r.created_at).toLocaleString('vi-VN')} sortable />
                            <Column header="Thao tác" body={(r) => (
                                <div className="flex gap-2">
                                    <Button 
                                        label="Reset Mật khẩu" 
                                        icon="pi pi-refresh" 
                                        className="p-button-sm p-button-warning" 
                                        onClick={() => handleApproveTicket(r)} 
                                        tooltip="Reset về mật khẩu mặc định và xóa yêu cầu này"
                                    />
                                    <Button 
                                        icon="pi pi-trash" 
                                        className="p-button-sm p-button-text p-button-danger" 
                                        onClick={() => {
                                            if(window.confirm('Xóa yêu cầu này mà không reset mật khẩu?')) {
                                                ticketApi.delete(r.id).then(loadData);
                                            }
                                        }} 
                                    />
                                </div>
                            )} />
                        </DataTable>
                    </TabPanel>
                </TabView>
            </Card>

            {/* Dialog Create User */}
            <Dialog header="Thêm tài khoản Thủ thư" visible={displayCreateDialog} style={{ width: '450px' }} modal onHide={() => setDisplayCreateDialog(false)}>
                <div className="flex flex-col gap-4 pt-2 p-fluid">
                    <div className="flex flex-col gap-2">
                        <label className="font-semibold">Họ và Tên</label>
                        <InputText value={newUser.full_name} onChange={(e) => setNewUser({...newUser, full_name: e.target.value})} placeholder="Nhập tên đầy đủ" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="font-semibold">Tên đăng nhập (Username)</label>
                        <InputText value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})} placeholder="VD: librarian_01" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="font-semibold">Mật khẩu</label>
                        <Password value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} toggleMask placeholder="Nhập mật khẩu mặc định" />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button label="Hủy" className="p-button-text" onClick={() => setDisplayCreateDialog(false)} />
                        <Button label="Lưu tài khoản" icon="pi pi-save" onClick={handleCreateUser} />
                    </div>
                </div>
            </Dialog>

            {/* Dialog Reset Password */}
            <Dialog header={`Reset mật khẩu cho: ${selectedUser?.username}`} visible={displayResetDialog} style={{ width: '400px' }} modal onHide={() => setDisplayResetDialog(false)}>
                <div className="flex flex-col gap-4 pt-2 p-fluid">
                    <label className="font-semibold">Mật khẩu mới</label>
                    <Password value={newPassword} onChange={(e) => setNewPassword(e.target.value)} toggleMask className="w-full" />
                    <Button label="Xác nhận Reset" icon="pi pi-check" className="p-button-warning" onClick={handleResetPassword} />
                </div>
            </Dialog>

            {/* Dialog Delete User */}
            <Dialog header="Xóa tài khoản Thủ thư" visible={displayDeleteDialog} style={{ width: '450px' }} modal onHide={() => setDisplayDeleteDialog(false)}>
                <div className="flex flex-col gap-4 pt-2 p-fluid">
                    <Message severity="warn" text="Yêu cầu bàn giao dữ liệu sách mượn trước khi xóa!" />
                    <label className="font-semibold">Thủ thư tiếp nhận bàn giao</label>
                    <Dropdown 
                        value={targetLibrarian} 
                        options={users.filter(u => u.id !== selectedUser?.id && u.role !== 'admin')} 
                        onChange={(e) => setTargetLibrarian(e.value)} 
                        optionLabel="full_name" 
                        placeholder="Chọn thủ thư tiếp quản"
                    />
                    <div className="flex justify-end gap-2 mt-4">
                        <Button label="Hủy" className="p-button-text" onClick={() => setDisplayDeleteDialog(false)} />
                        <Button label="Xác nhận Xóa" icon="pi pi-trash" className="p-button-danger" onClick={handleDeleteUser} />
                    </div>
                </div>
            </Dialog>
        </div>
    );
}
