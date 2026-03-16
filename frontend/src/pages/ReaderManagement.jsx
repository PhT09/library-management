import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { readerApi } from '../services/api';

const GENDER_OPTIONS = [
    { label: 'Nam', value: 'Nam' },
    { label: 'Nữ', value: 'Nữ' },
    { label: 'Khác', value: 'Khác' }
];

export default function ReaderManagement() {
    // State chứa danh sách độc giả từ API
    const [readers, setReaders] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [displayDialog, setDisplayDialog] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    /**
     * Form state - Mapping với Backend schema:
     *   id        → Mã độc giả (ReaderCreate.id)
     *   full_name → Họ và tên (ReaderCreate.full_name)
     *   class_name→ Lớp/Đơn vị (ReaderCreate.class_name)
     *   dob       → Ngày sinh (ReaderCreate.dob, format: YYYY-MM-DD)
     *   gender    → Giới tính (ReaderCreate.gender)
     */
    const [formData, setFormData] = useState({
        id: '', full_name: '', class_name: '', dob: '', gender: 'Nam'
    });
    const [errors, setErrors] = useState({});

    const toast = useRef(null);

    // ============================================================
    // Load danh sách độc giả khi component mount
    // GET /readers/
    // ============================================================
    useEffect(() => {
        loadReaders();
    }, []);

    const loadReaders = async () => {
        setLoading(true);
        try {
            const data = await readerApi.getAll();
            setReaders(data);
        } catch (err) {
            toast.current.show({
                severity: 'error', summary: 'Lỗi',
                detail: 'Không thể tải danh sách độc giả: ' + err.message, life: 4000
            });
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // Mở dialog Thêm mới
    // ============================================================
    const openNew = () => {
        setFormData({ id: '', full_name: '', class_name: '', dob: '', gender: 'Nam' });
        setErrors({});
        setIsEditMode(false);
        setDisplayDialog(true);
    };

    // ============================================================
    // Mở dialog Chỉnh sửa - map dữ liệu từ row vào form
    // ============================================================
    const openEdit = (reader) => {
        setFormData({
            id: reader.id,
            full_name: reader.full_name,
            class_name: reader.class_name,
            dob: reader.dob,
            gender: reader.gender,
        });
        setErrors({});
        setIsEditMode(true);
        setDisplayDialog(true);
    };

    const hideDialog = () => {
        setDisplayDialog(false);
    };

    // ============================================================
    // Xóa độc giả: DELETE /readers/{id}
    // Backend thực hiện soft delete (set is_active = false)
    // Nếu độc giả đang mượn sách → backend trả lỗi 400
    // ============================================================
    const confirmDelete = async (reader) => {
        if (!window.confirm(`Bạn có chắc chắn muốn thu hồi thẻ độc giả ${reader.full_name} (${reader.id})?`)) {
            return;
        }
        try {
            await readerApi.delete(reader.id);
            toast.current.show({
                severity: 'success', summary: 'Thành công',
                detail: 'Đã thu hồi thẻ độc giả', life: 3000
            });
            // Reload danh sách từ server để đảm bảo đồng bộ
            loadReaders();
        } catch (err) {
            toast.current.show({
                severity: 'error', summary: 'Lỗi',
                detail: err.message, life: 4000
            });
        }
    };

    // ============================================================
    // Validate form trước khi gửi API
    // ============================================================
    const validateForm = () => {
        const newErrors = {};
        if (!formData.id.trim()) newErrors.id = 'Mã độc giả không được để trống';
        if (!formData.full_name.trim()) newErrors.full_name = 'Họ tên không được để trống';
        if (!formData.class_name.trim()) newErrors.class_name = 'Lớp không được để trống';
        if (!formData.dob) newErrors.dob = 'Ngày sinh không được để trống';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ============================================================
    // Lưu độc giả: POST /readers/ (tạo mới) hoặc PUT /readers/{id} (cập nhật)
    // Backend trả về ReaderResponse hoặc lỗi 400 nếu mã đã tồn tại
    // ============================================================
    const saveReader = async () => {
        if (!validateForm()) return;

        setSaving(true);
        try {
            if (isEditMode) {
                // PUT /readers/{id} - Chỉ gửi các field cần cập nhật (exclude id)
                const updateData = {
                    full_name: formData.full_name,
                    class_name: formData.class_name,
                    dob: formData.dob,
                    gender: formData.gender,
                };
                await readerApi.update(formData.id, updateData);
                toast.current.show({
                    severity: 'success', summary: 'Thành công',
                    detail: 'Đã cập nhật thông tin độc giả', life: 3000
                });
            } else {
                // POST /readers/ - Gửi đầy đủ fields theo ReaderCreate schema
                const createData = {
                    id: formData.id,
                    full_name: formData.full_name,
                    class_name: formData.class_name,
                    dob: formData.dob,
                    gender: formData.gender,
                };
                await readerApi.create(createData);
                toast.current.show({
                    severity: 'success', summary: 'Thành công',
                    detail: 'Đã thêm độc giả mới', life: 3000
                });
            }
            setDisplayDialog(false);
            // Reload lại danh sách từ server sau khi thêm/sửa thành công
            loadReaders();
        } catch (err) {
            toast.current.show({
                severity: 'error', summary: 'Lỗi',
                detail: err.message, life: 4000
            });
        } finally {
            setSaving(false);
        }
    };

    // ============================================================
    // Xuất CSV từ dữ liệu hiện tại
    // ============================================================
    const exportCSV = () => {
        const headers = ['Mã ĐG', 'Họ tên', 'Lớp', 'Ngày sinh', 'Giới tính', 'Trạng thái'];
        const csvData = readers.map(r =>
            [r.id, r.full_name, r.class_name, r.dob, r.gender, r.is_active ? 'Active' : 'Inactive'].join(',')
        );
        const csvContent = [headers.join(','), ...csvData].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'DanhSachDocGia.csv';
        link.click();
    };

    // ============================================================
    // Template: Trạng thái Active/Inactive (backend trả về is_active: boolean)
    // ============================================================
    const statusBodyTemplate = (rowData) => {
        return (
            <Tag
                value={rowData.is_active ? 'Hoạt động' : 'Đã thu hồi'}
                severity={rowData.is_active ? 'success' : 'danger'}
            />
        );
    };

    // ============================================================
    // DataTable Header
    // ============================================================
    const header = (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-bold text-gray-800 m-0">Quản lý Độc giả</h2>
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative">
                    <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <InputText
                        type="search"
                        onInput={(e) => setGlobalFilter(e.target.value)}
                        placeholder="Tìm kiếm..."
                        className="w-full md:w-auto pl-10"
                    />
                </div>
                <Button label="Thêm mới" icon="pi pi-plus" className="p-button-success" onClick={openNew} />
                <Button label="Xuất dữ liệu" icon="pi pi-file-excel" className="p-button-help" onClick={exportCSV} />
            </div>
        </div>
    );

    // ============================================================
    // Template: Cột hành động (Sửa, In thẻ, Xóa)
    // ============================================================
    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-2">
                <Button icon="pi pi-pencil" className="p-button-rounded p-button-info p-button-text" onClick={() => openEdit(rowData)} tooltip="Chỉnh sửa" />
                <Button icon="pi pi-print" className="p-button-rounded p-button-secondary p-button-text" tooltip="In thẻ thư viện" />
                <Button
                    icon="pi pi-trash"
                    className="p-button-rounded p-button-danger p-button-text"
                    onClick={() => confirmDelete(rowData)}
                    tooltip="Thu hồi thẻ"
                    disabled={!rowData.is_active}
                />
            </div>
        );
    };

    const dialogFooter = (
        <div>
            <Button label="Hủy" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
            <Button
                label="Lưu"
                icon="pi pi-check"
                className="p-button-primary"
                onClick={saveReader}
                loading={saving}
            />
        </div>
    );

    return (
        <div className="bg-white rounded-lg shadow p-4">
            <Toast ref={toast} />

            <DataTable
                value={readers}
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 25]}
                globalFilter={globalFilter}
                header={header}
                emptyMessage="Không tìm thấy độc giả nào."
                className="p-datatable-sm"
                loading={loading}
            >
                {/* Mapping cột với field backend: id, full_name, class_name, dob, gender, is_active */}
                <Column field="id" header="Mã độc giả" sortable style={{ width: '12%' }}></Column>
                <Column field="full_name" header="Họ tên" sortable style={{ width: '22%' }}></Column>
                <Column field="class_name" header="Lớp/Đơn vị" sortable style={{ width: '18%' }}></Column>
                <Column field="dob" header="Ngày sinh" style={{ width: '13%' }}></Column>
                <Column field="gender" header="Giới tính" style={{ width: '10%' }}></Column>
                <Column header="Trạng thái" body={statusBodyTemplate} style={{ width: '12%' }}></Column>
                <Column body={actionBodyTemplate} exportable={false} style={{ width: '13%' }}></Column>
            </DataTable>

            <Dialog
                visible={displayDialog}
                style={{ width: '450px' }}
                header={isEditMode ? "Chỉnh sửa thông tin" : "Thêm độc giả mới"}
                modal
                className="p-fluid"
                footer={dialogFooter}
                onHide={hideDialog}
            >
                <div className="flex flex-col gap-4 pt-2">
                    {/* Mã độc giả - field: id (khóa chính, không sửa được khi edit) */}
                    <div className="field">
                        <label htmlFor="readerId" className="font-semibold mb-2 block">Mã độc giả <span className="text-red-500">*</span></label>
                        <InputText
                            id="readerId"
                            value={formData.id}
                            onChange={(e) => setFormData({ ...formData, id: e.target.value.toUpperCase() })}
                            className={errors.id ? 'p-invalid' : ''}
                            placeholder="Vd: SV005"
                            disabled={isEditMode}
                        />
                        {errors.id && <small className="p-error">{errors.id}</small>}
                    </div>

                    {/* Họ và tên - field: full_name */}
                    <div className="field">
                        <label htmlFor="full_name" className="font-semibold mb-2 block">Họ và tên <span className="text-red-500">*</span></label>
                        <InputText
                            id="full_name"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            className={errors.full_name ? 'p-invalid' : ''}
                        />
                        {errors.full_name && <small className="p-error">{errors.full_name}</small>}
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Lớp/Đơn vị - field: class_name */}
                        <div className="field flex-1">
                            <label htmlFor="class_name" className="font-semibold mb-2 block">Lớp / Đơn vị <span className="text-red-500">*</span></label>
                            <InputText
                                id="class_name"
                                value={formData.class_name}
                                onChange={(e) => setFormData({ ...formData, class_name: e.target.value.toUpperCase() })}
                                className={errors.class_name ? 'p-invalid' : ''}
                            />
                            {errors.class_name && <small className="p-error">{errors.class_name}</small>}
                        </div>

                        {/* Giới tính - field: gender */}
                        <div className="field flex-1">
                            <label htmlFor="gender" className="font-semibold mb-2 block">Giới tính</label>
                            <Dropdown
                                id="gender"
                                value={formData.gender}
                                options={GENDER_OPTIONS}
                                onChange={(e) => setFormData({ ...formData, gender: e.value })}
                            />
                        </div>
                    </div>

                    {/* Ngày sinh - field: dob (format: YYYY-MM-DD) */}
                    <div className="field">
                        <label htmlFor="dob" className="font-semibold mb-2 block">Ngày sinh <span className="text-red-500">*</span></label>
                        <InputText
                            id="dob"
                            type="date"
                            value={formData.dob}
                            onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                            className={errors.dob ? 'p-invalid' : ''}
                        />
                        {errors.dob && <small className="p-error">{errors.dob}</small>}
                    </div>
                </div>
            </Dialog>
        </div>
    );
}
