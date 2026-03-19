import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Password } from 'primereact/password';
import { Dropdown } from 'primereact/dropdown';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { librarianApi } from '../services/api';
import { AlignCenter } from 'lucide-react';

export default function UserManagement() {
    const [userRole] = useState(localStorage.getItem('userRole'));
    
    // Bảo vệ lớp cuối: Nếu không phải Admin, đuổi về trang sách ngay lập tức
    if (userRole !== 'admin') {
        return <Navigate to="/admin/books" replace />;
    }

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
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
            const usersData = await librarianApi.getAll().catch(err => {
                console.error('Librarian API Error:', err);
                return [];
            });
            
            console.log('UserManagement: Loaded data', { usersData });
            
            setUsers(Array.isArray(usersData) ? usersData : []);
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



    // Templates
    const statusBody = (rowData) => <Tag value={rowData.is_active ? 'Active' : 'Inactive'} severity={rowData.is_active ? 'success' : 'danger'} />;
    
    const roleBody = (rowData) => <Tag value={rowData.role.toUpperCase()} severity={rowData.role === 'admin' ? 'info' : 'warning'} />;

    const actionBody = (rowData) => (
        <div className="flex justify-center gap-2">
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

            <Card className="shadow-sm pr-10 pl-10">
                <DataTable value={users} loading={loading} paginator rows={10} className="p-datatable-sm" dataKey="id">
                    <Column field="id" header="ID" style={{ width: '5%' }} />
                    <Column field="username" header="Username" sortable />
                    <Column field="full_name" header="Họ và Tên" sortable />
                    <Column header="Trạng thái" body={statusBody} style={{ width: '10%' }} align="center" />
                    <Column header="Hành động" body={actionBody} style={{ width: '10%' }} align="center" />
                </DataTable>
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
