import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Dropdown } from 'primereact/dropdown';
import { bookApi } from '../../services/api';
import BookCopyManagement from './BookCopyManagement';

export default function BookTitleManagement() {
    const [books, setBooks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [displayDialog, setDisplayDialog] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');

    // State for viewing copies
    const [selectedBook, setSelectedBook] = useState(null);
    const [displayCopyDialog, setDisplayCopyDialog] = useState(false);

    const [formData, setFormData] = useState({
        id: '', name: '', author: '', publisher: '', size: '', category_id: ''
    });
    const [errors, setErrors] = useState({});

    const toast = useRef(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [booksData, catsData] = await Promise.all([
                bookApi.getAll(),
                bookApi.getCategories()
            ]);
            
            const copiesData = await bookApi.getBookCopies();

            console.log('BookTitleManagement: Loaded data', { booksData, catsData, copiesData });

            const validBooks = Array.isArray(booksData) ? booksData : [];
            const validCopies = Array.isArray(copiesData) ? copiesData : [];

            const booksWithCount = validBooks.map(b => ({
                ...b,
                copyCount: validCopies.filter(c => c.book_id === b.id).length
            }));

            setBooks(booksWithCount);
            setCategories(Array.isArray(catsData) ? catsData : []);
        } catch (err) {
            console.error('BookTitleManagement: Load error', err);
            toast.current?.show({
                severity: 'error', summary: 'Lỗi',
                detail: 'Không thể tải dữ liệu: ' + err.message, life: 4000
            });
        } finally {
            setLoading(false);
        }
    };

    const openNew = () => {
        setFormData({ id: '', name: '', author: '', publisher: '', size: '', category_id: categories[0]?.id || '' });
        setErrors({});
        setIsEditMode(false);
        setDisplayDialog(true);
    };

    const openEdit = (book) => {
        setFormData({ ...book });
        setErrors({});
        setIsEditMode(true);
        setDisplayDialog(true);
    };

    const hideDialog = () => {
        setDisplayDialog(false);
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.id.trim()) newErrors.id = 'Mã sách không được để trống';
        if (!formData.name.trim()) newErrors.name = 'Tên sách không được để trống';
        if (!formData.author.trim()) newErrors.author = 'Tác giả không được để trống';
        if (!formData.category_id) newErrors.category_id = 'Chuyên ngành không được để trống';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const saveBook = async () => {
        if (!validateForm()) return;

        setSaving(true);
        try {
            if (isEditMode) {
                await bookApi.updateBook(formData.id, {
                    name: formData.name,
                    author: formData.author,
                    publisher: formData.publisher,
                    size: formData.size,
                    category_id: formData.category_id
                });
                toast.current.show({ severity: 'success', summary: 'Thành công', detail: 'Đã cập nhật đầu sách', life: 3000 });
            } else {
                await bookApi.createBook(formData);
                toast.current.show({ severity: 'success', summary: 'Thành công', detail: 'Đã thêm đầu sách mới', life: 3000 });
            }
            setDisplayDialog(false);
            loadData();
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Lỗi', detail: err.message, life: 4000 });
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = async (book) => {
        if (!window.confirm(`Bạn có chắc muốn xóa đầu sách "${book.name}"?`)) return;

        try {
            await bookApi.deleteBook(book.id);
            toast.current.show({ severity: 'success', summary: 'Thành công', detail: 'Đã xóa đầu sách', life: 3000 });
            loadData();
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Lỗi', detail: err.message, life: 4000 });
        }
    };

    const viewCopies = (book) => {
        setSelectedBook(book);
        setDisplayCopyDialog(true);
    };

    const header = (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h3 className="text-xl font-bold text-gray-800 m-0">Quản lý Đầu sách</h3>
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
                <Button icon="pi pi-clone" className="p-button-rounded p-button-warning p-button-text" onClick={() => viewCopies(rowData)} tooltip="Xem bản sao" />
                <Button icon="pi pi-pencil" className="p-button-rounded p-button-info p-button-text" onClick={() => openEdit(rowData)} tooltip="Chỉnh sửa" />
                <Button icon="pi pi-trash" className="p-button-rounded p-button-danger p-button-text" onClick={() => confirmDelete(rowData)} tooltip="Xóa" />
            </div>
        );
    };

    const dialogFooter = (
        <div>
            <Button label="Hủy" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
            <Button label="Lưu" icon="pi pi-check" className="p-button-primary" onClick={saveBook} loading={saving} />
        </div>
    );

    const categoryBodyTemplate = (rowData) => {
        const cat = categories.find(c => c.id === rowData.category_id);
        return cat ? cat.name : rowData.category_id;
    };

    return (
        <div className="p-2">
            <Toast ref={toast} />
            <DataTable
                value={books}
                paginator rows={10}
                loading={loading}
                header={header}
                globalFilter={globalFilter}
                emptyMessage="Không tìm thấy đầu sách nào."
                className="p-datatable-sm shadow-sm"
            >
                <Column field="id" header="Mã Sách" sortable style={{ width: '10%' }} />
                <Column field="name" header="Tên sách" sortable style={{ width: '20%' }} />
                <Column field="author" header="Tác giả" sortable style={{ width: '15%' }} />
                <Column field="publisher" header="Nhà XB" style={{ width: '10%' }} />
                <Column field="size" header="Kích thước" style={{ width: '10%' }} />
                <Column field="category_id" header="Chuyên ngành" body={categoryBodyTemplate} style={{ width: '15%' }} />
                <Column field="copyCount" header="Số bản sao" style={{ width: '10%' }} className="text-center" />
                <Column body={actionBodyTemplate} style={{ width: '15%' }} />
            </DataTable>

            <Dialog
                visible={displayDialog}
                style={{ width: '500px' }}
                header={isEditMode ? "Chỉnh sửa đầu sách" : "Thêm đầu sách mới"}
                modal
                className="p-fluid"
                footer={dialogFooter}
                onHide={hideDialog}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="field md:col-span-2">
                        <label className="font-semibold mb-2 block">Mã Sách <span className="text-red-500">*</span></label>
                        <InputText
                            value={formData.id}
                            onChange={(e) => setFormData({ ...formData, id: e.target.value.toUpperCase() })}
                            disabled={isEditMode}
                            className={errors.id ? 'p-invalid' : ''}
                        />
                        {errors.id && <small className="p-error">{errors.id}</small>}
                    </div>
                    <div className="field md:col-span-2">
                        <label className="font-semibold mb-2 block">Tên sách <span className="text-red-500">*</span></label>
                        <InputText
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className={errors.name ? 'p-invalid' : ''}
                        />
                        {errors.name && <small className="p-error">{errors.name}</small>}
                    </div>
                    <div className="field">
                        <label className="font-semibold mb-2 block">Tác giả <span className="text-red-500">*</span></label>
                        <InputText
                            value={formData.author}
                            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                            className={errors.author ? 'p-invalid' : ''}
                        />
                        {errors.author && <small className="p-error">{errors.author}</small>}
                    </div>
                    <div className="field">
                        <label className="font-semibold mb-2 block">Nhà xuất bản</label>
                        <InputText
                            value={formData.publisher}
                            onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                        />
                    </div>
                    <div className="field">
                        <label className="font-semibold mb-2 block">Kích thước</label>
                        <InputText
                            value={formData.size}
                            onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                        />
                    </div>
                    <div className="field">
                        <label className="font-semibold mb-2 block">Chuyên ngành <span className="text-red-500">*</span></label>
                        <Dropdown
                            value={formData.category_id}
                            options={categories}
                            optionLabel="name"
                            optionValue="id"
                            onChange={(e) => setFormData({ ...formData, category_id: e.value })}
                            placeholder="Chọn chuyên ngành"
                            className={errors.category_id ? 'p-invalid' : ''}
                        />
                        {errors.category_id && <small className="p-error">{errors.category_id}</small>}
                    </div>
                </div>
            </Dialog>

            {/* Copies Dialog */}
            <Dialog
                visible={displayCopyDialog}
                style={{ width: '80vw' }}
                header={`Danh sách bản sao: ${selectedBook?.name}`}
                modal
                onHide={() => {
                    setDisplayCopyDialog(false);
                    loadData(); // Reload to update counts
                }}
            >
                {selectedBook && <BookCopyManagement bookId={selectedBook.id} />}
            </Dialog>
        </div>
    );
}
