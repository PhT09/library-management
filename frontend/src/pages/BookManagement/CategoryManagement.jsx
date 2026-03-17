import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { bookApi } from '../../services/api';

export default function CategoryManagement() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [displayDialog, setDisplayDialog] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');

    const [formData, setFormData] = useState({
        id: '', name: '', description: ''
    });
    const [errors, setErrors] = useState({});

    const toast = useRef(null);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setLoading(true);
        try {
            const data = await bookApi.getCategories();
            setCategories(data);
        } catch (err) {
            toast.current.show({
                severity: 'error', summary: 'Lỗi',
                detail: 'Không thể tải danh sách chuyên ngành: ' + err.message, life: 4000
            });
        } finally {
            setLoading(false);
        }
    };

    const openNew = () => {
        setFormData({ id: '', name: '', description: '' });
        setErrors({});
        setIsEditMode(false);
        setDisplayDialog(true);
    };

    const openEdit = (category) => {
        setFormData({ ...category });
        setErrors({});
        setIsEditMode(true);
        setDisplayDialog(true);
    };

    const hideDialog = () => {
        setDisplayDialog(false);
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.id.trim()) newErrors.id = 'Mã chuyên ngành không được để trống';
        if (!formData.name.trim()) newErrors.name = 'Tên chuyên ngành không được để trống';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const saveCategory = async () => {
        if (!validateForm()) return;

        setSaving(true);
        try {
            if (isEditMode) {
                await bookApi.updateCategory(formData.id, {
                    name: formData.name,
                    description: formData.description
                });
                toast.current.show({ severity: 'success', summary: 'Thành công', detail: 'Đã cập nhật chuyên ngành', life: 3000 });
            } else {
                await bookApi.createCategory(formData);
                toast.current.show({ severity: 'success', summary: 'Thành công', detail: 'Đã thêm chuyên ngành mới', life: 3000 });
            }
            setDisplayDialog(false);
            loadCategories();
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Lỗi', detail: err.message, life: 4000 });
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = async (category) => {
        if (!window.confirm(`Bạn có chắc muốn xóa chuyên ngành "${category.name}"?`)) return;

        try {
            await bookApi.deleteCategory(category.id);
            toast.current.show({ severity: 'success', summary: 'Thành công', detail: 'Đã xóa chuyên ngành', life: 3000 });
            loadCategories();
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Lỗi', detail: err.message, life: 4000 });
        }
    };

    const header = (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h3 className="text-xl font-bold text-gray-800 m-0">Quản lý Chuyên ngành</h3>
            <div className="flex gap-3">
                <span className="p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText
                        type="search"
                        onInput={(e) => setGlobalFilter(e.target.value)}
                        placeholder="Tìm kiếm..."
                    />
                </span>
                <Button label="Thêm mới" icon="pi pi-plus" className="p-button-success" onClick={openNew} />
            </div>
        </div>
    );

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-2">
                <Button icon="pi pi-pencil" className="p-button-rounded p-button-info p-button-text" onClick={() => openEdit(rowData)} tooltip="Chỉnh sửa" />
                <Button icon="pi pi-trash" className="p-button-rounded p-button-danger p-button-text" onClick={() => confirmDelete(rowData)} tooltip="Xóa" />
            </div>
        );
    };

    const dialogFooter = (
        <div>
            <Button label="Hủy" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
            <Button label="Lưu" icon="pi pi-check" className="p-button-primary" onClick={saveCategory} loading={saving} />
        </div>
    );

    return (
        <div className="p-2">
            <Toast ref={toast} />
            <DataTable
                value={categories}
                paginator rows={5}
                loading={loading}
                header={header}
                globalFilter={globalFilter}
                emptyMessage="Không tìm thấy chuyên ngành nào."
                className="p-datatable-sm shadow-sm"
            >
                <Column field="id" header="Mã Chuyên ngành" sortable style={{ width: '20%' }} />
                <Column field="name" header="Tên Chuyên ngành" sortable style={{ width: '30%' }} />
                <Column field="description" header="Mô tả" style={{ width: '35%' }} />
                <Column body={actionBodyTemplate} style={{ width: '15%' }} />
            </DataTable>

            <Dialog
                visible={displayDialog}
                style={{ width: '450px' }}
                header={isEditMode ? "Chỉnh sửa chuyên ngành" : "Thêm chuyên ngành mới"}
                modal
                className="p-fluid"
                footer={dialogFooter}
                onHide={hideDialog}
            >
                <div className="flex flex-col gap-4 pt-2">
                    <div className="field">
                        <label className="font-semibold mb-2 block">Mã Chuyên ngành <span className="text-red-500">*</span></label>
                        <InputText
                            value={formData.id}
                            onChange={(e) => setFormData({ ...formData, id: e.target.value.toUpperCase() })}
                            disabled={isEditMode}
                            className={errors.id ? 'p-invalid' : ''}
                        />
                        {errors.id && <small className="p-error">{errors.id}</small>}
                    </div>
                    <div className="field">
                        <label className="font-semibold mb-2 block">Tên Chuyên ngành <span className="text-red-500">*</span></label>
                        <InputText
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className={errors.name ? 'p-invalid' : ''}
                        />
                        {errors.name && <small className="p-error">{errors.name}</small>}
                    </div>
                    <div className="field">
                        <label className="font-semibold mb-2 block">Mô tả</label>
                        <InputTextarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                        />
                    </div>
                </div>
            </Dialog>
        </div>
    );
}
