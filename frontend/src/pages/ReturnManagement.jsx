import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { borrowApi, readerApi, bookApi } from '../services/api';

export default function ReturnManagement() {
    const [borrows, setBorrows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const [lookups, setLookups] = useState({ readers: {}, books: {}, copies: {} });
    
    const toast = useRef(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        console.log('Bắt đầu tải dữ liệu trả sách...');
        try {
            const [borrowData, readerData, bookData, copyData] = await Promise.all([
                borrowApi.getAll(null, 'Borrowing'),
                readerApi.getAll(),
                bookApi.getAll(),
                bookApi.getBookCopies()
            ]);

            console.log('Dữ liệu tải về:', { borrowData, readerData, bookData, copyData });

            const readerMap = {};
            if (Array.isArray(readerData)) {
                readerData.forEach(r => { readerMap[r.id] = r.full_name; });
            }

            const bookMap = {};
            if (Array.isArray(bookData)) {
                bookData.forEach(b => { bookMap[b.id] = b.name; });
            }

            const copyMap = {};
            if (Array.isArray(copyData)) {
                copyData.forEach(c => { copyMap[c.id] = c.book_id; });
            }

            setLookups({ readers: readerMap, books: bookMap, copies: copyMap });
            setBorrows(Array.isArray(borrowData) ? borrowData : []);
        } catch (err) {
            console.error('Lỗi tải dữ liệu:', err);
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Không thể tải dữ liệu: ' + err.message,
                life: 4000
            });
        } finally {
            setLoading(false);
        }
    };

    const handleReturn = async (borrow) => {
        if (!window.confirm(`Xác nhận nhận trả sách cho độc giả ${lookups.readers[borrow.reader_id]}?`)) return;

        try {
            await borrowApi.returnBook(borrow.id);
            toast.current.show({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Đã xử lý trả sách thành công',
                life: 3000
            });
            loadData(); // Refresh list
        } catch (err) {
            toast.current.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: err.message,
                life: 4000
            });
        }
    };

    const readerBodyTemplate = (rowData) => {
        const name = lookups.readers[rowData.reader_id] || 'N/A';
        return (
            <div>
                <div className="font-bold">{rowData.reader_id}</div>
                <small className="text-gray-500">{name}</small>
            </div>
        );
    };

    const bookBodyTemplate = (rowData) => {
        const bookId = lookups.copies[rowData.book_copy_id];
        const title = lookups.books[bookId] || 'N/A';
        return (
            <div>
                <div className="font-bold">{rowData.book_copy_id}</div>
                <small className="text-gray-500">{title}</small>
            </div>
        );
    };

    const dateBodyTemplate = (rowData) => {
        return new Date(rowData.borrow_date).toLocaleString('vi-VN');
    };

    const statusBodyTemplate = (rowData) => {
        return <Tag value="Đang mượn" severity="warning" />;
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <Button 
                label="Nhận trả" 
                icon="pi pi-download" 
                className="p-button-sm p-button-info" 
                onClick={() => handleReturn(rowData)} 
            />
        );
    };

    const header = (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-800 m-0">Quản lý Trả sách</h2>
            <span className="p-input-icon-left">
                <InputText
                    type="search"
                    onInput={(e) => setGlobalFilter(e.target.value)}
                    placeholder="Tìm kiếm nhanh..."
                    className="w-full md:w-80"
                />
            </span>
        </div>
    );

    return (
        <div className="bg-white rounded-lg shadow-md p-4">
            <Toast ref={toast} />
            
            <DataTable
                value={borrows}
                paginator rows={10}
                loading={loading}
                header={header}
                globalFilter={globalFilter}
                emptyMessage="Không có sách nào đang được mượn."
                className="p-datatable-sm"
            >
                <Column field="id" header="Mã Phiếu" sortable style={{ width: '10%' }} />
                <Column header="Độc giả" body={readerBodyTemplate} sortable field="reader_id" style={{ width: '25%' }} />
                <Column header="Bản sao & Tên sách" body={bookBodyTemplate} sortable field="book_copy_id" style={{ width: '30%' }} />
                <Column header="Ngày mượn" body={dateBodyTemplate} sortable field="borrow_date" style={{ width: '15%' }} />
                <Column header="Trạng thái" body={statusBodyTemplate} style={{ width: '10%' }} />
                <Column body={actionBodyTemplate} style={{ width: '10%' }} />
            </DataTable>
        </div>
    );
}
