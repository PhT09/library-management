import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { bookApi } from '../../services/api';

export default function BookCopyManagement({ bookId }) {
    const [copies, setCopies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [displayDialog, setDisplayDialog] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        id: '', book_id: bookId, condition: 'Mới', import_date: new Date().toISOString().split('T')[0], status: 'Available'
    });
    const [errors, setErrors] = useState({});

    const toast = useRef(null);

    useEffect(() => {
        loadCopies();
    }, [bookId]);

    const loadCopies = async () => {
        setLoading(true);
        try {
            const data = await bookApi.getBookCopies();
            // Filter copies for this book
            const filtered = data.filter(c => c.book_id === bookId);
            setCopies(filtered);
        } catch (err) {
            toast.current.show({
                severity: 'error', summary: 'Lỗi',
                detail: 'Không thể tải danh sách bản sao: ' + err.message, life: 4000
            });
        } finally {
            setLoading(false);
        }
    };

    const openNew = () => {
        setFormData({
            id: '',
            book_id: bookId,
            condition: 'Mới',
            import_date: new Date().toISOString().split('T')[0],
            status: 'Available'
        });
        setErrors({});
        setIsEditMode(false);
        setDisplayDialog(true);
    };

    const openEdit = (copy) => {
        setFormData({ ...copy });
        setErrors({});
        setIsEditMode(true);
        setDisplayDialog(true);
    };

    const hideDialog = () => {
        setDisplayDialog(false);
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.id.trim()) newErrors.id = 'Mã bản sao không được để trống';
        if (!formData.condition.trim()) newErrors.condition = 'Tình trạng không được để trống';
        if (!formData.import_date) newErrors.import_date = 'Ngày nhập không được để trống';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const saveCopy = async () => {
        if (!validateForm()) return;

        setSaving(true);
        try {
            if (isEditMode) {
                await bookApi.updateBookCopy(formData.id, {
                    condition: formData.condition,
                    status: formData.status
                });
                toast.current.show({ severity: 'success', summary: 'Thành công', detail: 'Đã cập nhật bản sao', life: 3000 });
            } else {
                await bookApi.createBookCopy(formData);
                toast.current.show({ severity: 'success', summary: 'Thành công', detail: 'Đã thêm bản sao mới', life: 3000 });
            }
            setDisplayDialog(false);
            loadCopies();
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Lỗi', detail: err.message, life: 4000 });
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = async (copy) => {
        if (!window.confirm(`Bạn có chắc muốn xóa bản sao "${copy.id}"?`)) return;

        try {
            await bookApi.deleteBookCopy(copy.id);
            toast.current.show({ severity: 'success', summary: 'Thành công', detail: 'Đã xóa bản sao', life: 3000 });
            loadCopies();
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Lỗi', detail: err.message, life: 4000 });
        }
    };

    const statusBodyTemplate = (rowData) => {
        const severity = rowData.status === 'Available' ? 'success' : 'warning';
        const label = rowData.status === 'Available' ? 'Sẵn sàng' : 'Đang mượn';
        return <Tag value={label} severity={severity} />;
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-2">
                <Button icon="pi pi-pencil" className="p-button-rounded p-button-info p-button-text" onClick={() => openEdit(rowData)} tooltip="Chỉnh sửa" />
                <Button
                    icon="pi pi-trash"
                    className="p-button-rounded p-button-danger p-button-text"
                    onClick={() => confirmDelete(rowData)}
                    tooltip="Xóa"
                    disabled={rowData.status !== 'Available'}
                />
            </div>
        );
    };

    const header = (
        <div className="flex justify-between items-center">
            <h4 className="m-0">Quản lý các bản sao vật lý</h4>
            <Button label="Thêm bản sao" icon="pi pi-plus" className="p-button-success p-button-sm" onClick={openNew} />
        </div>
    );

    const dialogFooter = (
        <div>
            <Button label="Hủy" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
            <Button label="Lưu" icon="pi pi-check" className="p-button-primary" onClick={saveCopy} loading={saving} />
        </div>
    );

    return (
        <div className="mt-2">
            <Toast ref={toast} />
            <DataTable
                value={copies}
                loading={loading}
                header={header}
                emptyMessage="Sách này chưa có bản sao nào."
                className="p-datatable-sm"
            >
                <Column field="id" header="Mã bản sao" sortable />
                <Column field="condition" header="Tình trạng" sortable />
                <Column field="import_date" header="Ngày nhập" sortable />
                <Column field="status" header="Trạng thái" body={statusBodyTemplate} sortable />
                <Column body={actionBodyTemplate} style={{ width: '120px' }} />
            </DataTable>

            <Dialog
                visible={displayDialog}
                style={{ width: '400px' }}
                header={isEditMode ? "Chỉnh sửa bản sao" : "Thêm bản sao mới"}
                modal
                className="p-fluid"
                footer={dialogFooter}
                onHide={hideDialog}
            >
                <div className="flex flex-col gap-4 pt-2">
                    <div className="field">
                        <label className="font-semibold mb-2 block">Mã bản sao <span className="text-red-500">*</span></label>
                        <InputText
                            value={formData.id}
                            onChange={(e) => setFormData({ ...formData, id: e.target.value.toUpperCase() })}
                            disabled={isEditMode}
                            placeholder="Vd: BS-MATH-01"
                            className={errors.id ? 'p-invalid' : ''}
                        />
                        {errors.id && <small className="p-error">{errors.id}</small>}
                    </div>
                    <div className="field">
                        <label className="font-semibold mb-2 block">Tình trạng <span className="text-red-500">*</span></label>
                        <InputText
                            value={formData.condition}
                            onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                            placeholder="Vd: Mới, Cũ, Rách"
                            className={errors.condition ? 'p-invalid' : ''}
                        />
                        {errors.condition && <small className="p-error">{errors.condition}</small>}
                    </div>
                    {!isEditMode && (
                        <div className="field">
                            <label className="font-semibold mb-2 block">Ngày nhập <span className="text-red-500">*</span></label>
                            <InputText
                                type="date"
                                value={formData.import_date}
                                onChange={(e) => setFormData({ ...formData, import_date: e.target.value })}
                                className={errors.import_date ? 'p-invalid' : ''}
                            />
                            {errors.import_date && <small className="p-error">{errors.import_date}</small>}
                        </div>
                    )}
                    {isEditMode && (
                        <div className="field">
                            <label className="font-semibold mb-2 block">Trạng thái</label>
                            <Tag value={formData.status === 'Available' ? 'Sẵn sàng' : 'Đang mượn'} severity={formData.status === 'Available' ? 'success' : 'warning'} className="w-full py-2" />
                        </div>
                    )}
                </div>
            </Dialog>
        </div>
    );
}
