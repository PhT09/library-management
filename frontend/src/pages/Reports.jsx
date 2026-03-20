import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Card } from 'primereact/card';
import { Toast } from 'primereact/toast';
import { ProgressBar } from 'primereact/progressbar';
import { reportApi } from '../services/api';

export default function Reports() {
    const [topBooks, setTopBooks] = useState([]);
    const [unreturned, setUnreturned] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        allTime: true
    });

    const toast = useRef(null);

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        setLoading(true);
        try {
            const startDate = filters.allTime ? null : filters.startDate;
            const endDate = filters.allTime ? null : filters.endDate;

            const [topBooksData, unreturnedData] = await Promise.all([
                reportApi.getTopBooks(startDate, endDate),
                reportApi.getUnreturnedReaders(startDate, endDate)
            ]);

            setTopBooks(topBooksData || []);
            setUnreturned(unreturnedData || []);
        } catch (err) {
            toast.current.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Không thể tải báo cáo: ' + err.message,
                life: 4000
            });
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const applyFilters = () => {
        loadReports();
    };

    const handleExport = (type) => {
        const startDate = filters.allTime ? null : filters.startDate;
        const endDate = filters.allTime ? null : filters.endDate;
        
        if (type === 'pdf') {
            reportApi.exportPDF(startDate, endDate);
        } else {
            reportApi.exportExcel(startDate, endDate);
        }
    };

    const dateTemplate = (rowData) => {
        return rowData.borrow_date ? new Date(rowData.borrow_date).toLocaleDateString('vi-VN') : 'N/A';
    };

    const daysBorrowedTemplate = (rowData) => {
        if (!rowData.borrow_date) return 'N/A';
        const borrowDate = new Date(rowData.borrow_date);
        const today = new Date();
        const diffTime = Math.abs(today - borrowDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return `${diffDays} ngày`;
    };

    return (
        <div className="flex flex-col gap-6 p-2">
            <Toast ref={toast} />
            
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Báo cáo & Thống kê</h1>
                <div className="flex gap-2">
                    <Button 
                        label="Xuất PDF" 
                        icon="pi pi-file-pdf" 
                        className="p-button-danger" 
                        onClick={() => handleExport('pdf')} 
                    />
                    <Button 
                        label="Xuất Excel" 
                        icon="pi pi-file-excel" 
                        className="p-button-success" 
                        onClick={() => handleExport('excel')} 
                    />
                </div>
            </div>

            {/* Filter Panel */}
            <Card title="Bộ lọc báo cáo" className="shadow-sm">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="font-semibold">Phạm vi</label>
                        <div className="flex items-center gap-2 h-10 px-3 bg-gray-50 rounded border">
                            <input 
                                type="checkbox" 
                                id="allTime" 
                                checked={filters.allTime}
                                onChange={(e) => handleFilterChange('allTime', e.target.checked)}
                                className="w-4 h-4"
                            />
                            <label htmlFor="allTime" className="cursor-pointer">Tất cả thời gian</label>
                        </div>
                    </div>

                    {!filters.allTime && (
                        <>
                            <div className="flex flex-col gap-2">
                                <label className="font-semibold">Từ ngày</label>
                                <InputText 
                                    type="date" 
                                    value={filters.startDate}
                                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="font-semibold">Đến ngày</label>
                                <InputText 
                                    type="date" 
                                    value={filters.endDate}
                                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    <Button 
                        label="Áp dụng" 
                        icon="pi pi-search" 
                        onClick={applyFilters} 
                        loading={loading}
                    />
                </div>
            </Card>

            {loading && <ProgressBar mode="indeterminate" style={{ height: '4px' }} />}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Top Borrowed Books */}
                <Card title="Sách được mượn nhiều nhất" className="shadow-sm">
                    <DataTable 
                        value={topBooks} 
                        rows={5} 
                        className="p-datatable-sm"
                        emptyMessage="Không có dữ liệu thống kê."
                    >
                        <Column field="book_name" header="Tên sách" sortable />
                        <Column field="author" header="Tác giả" />
                        <Column field="borrow_count" header="Lượt mượn" sortable style={{ width: '20%' }} />
                    </DataTable>
                </Card>

                {/* Unreturned Readers */}
                <Card title="Độc giả chưa trả sách" className="shadow-sm">
                    <DataTable 
                        value={unreturned} 
                        rows={5} 
                        className="p-datatable-sm"
                        emptyMessage="Không có độc giả nào quá hạn hoặc chưa trả."
                    >
                        <Column field="reader_name" header="Họ tên" />
                        <Column field="book_name" header="Tên sách" />
                        <Column body={dateTemplate} header="Ngày mượn" />
                        <Column body={daysBorrowedTemplate} header="Đã mượn" style={{ width: '20%' }} />
                    </DataTable>
                </Card>
            </div>
        </div>
    );
}
