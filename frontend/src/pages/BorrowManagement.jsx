import React, { useState, useRef } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Toast } from 'primereact/toast';
import { Message } from 'primereact/message';
import { Divider } from 'primereact/divider';
import { readerApi, bookApi, borrowApi, authApi } from '../services/api';

export default function BorrowManagement() {
    const [readerId, setReaderId] = useState('');
    const [copyId, setCopyId] = useState('');
    const [readerInfo, setReaderInfo] = useState(null);
    const [copyInfo, setCopyInfo] = useState(null);
    const [loadingReader, setLoadingReader] = useState(false);
    const [loadingCopy, setLoadingCopy] = useState(false);
    const [creating, setCreating] = useState(false);
    const [activeBorrow, setActiveBorrow] = useState(null);

    const toast = useRef(null);

    // Tìm kiếm độc giả
    const handleReaderSearch = async () => {
        if (!readerId.trim()) return;
        setLoadingReader(true);
        setReaderInfo(null);
        setActiveBorrow(null);
        try {
            const reader = await readerApi.getById(readerId.toUpperCase());
            setReaderInfo(reader);
            
            // Sau khi tìm thấy độc giả, kiểm tra xem họ có đang mượn sách không
            const borrows = await borrowApi.getAll(readerId.toUpperCase(), 'Borrowing');
            if (borrows && borrows.length > 0) {
                setActiveBorrow(borrows[0]);
            }
        } catch (err) {
            toast.current.show({ 
                severity: 'error', 
                summary: 'Lỗi', 
                detail: 'Không tìm thấy độc giả: ' + err.message, 
                life: 3000 
            });
        } finally {
            setLoadingReader(false);
        }
    };

    // Tìm kiếm bản sao sách
    const handleCopySearch = async () => {
        if (!copyId.trim()) return;
        setLoadingCopy(true);
        setCopyInfo(null);
        try {
            // Backend không có endpoint getByCopyId, phải getAll và filter
            const allCopies = await bookApi.getBookCopies();
            const copy = allCopies.find(c => c.id === copyId.toUpperCase());
            
            if (!copy) throw new Error('Mã bản sao không tồn tại');
            
            // Lấy thông tin đầu sách tương ứng
            const allBooks = await bookApi.getAll();
            const book = allBooks.find(b => b.id === copy.book_id);
            
            setCopyInfo({ ...copy, bookInfo: book });
        } catch (err) {
            toast.current.show({ 
                severity: 'error', 
                summary: 'Lỗi', 
                detail: err.message, 
                life: 3000 
            });
        } finally {
            setLoadingCopy(false);
        }
    };

    // Tạo phiếu mượn
    const handleCreateBorrow = async () => {
        if (!readerInfo || !copyInfo) {
            toast.current.show({ 
                severity: 'warn', 
                summary: 'Cảnh báo', 
                detail: 'Vui lòng nhập đầy đủ Mã độc giả và Mã bản sao hợp lệ', 
                life: 3000 
            });
            return;
        }

        if (activeBorrow) {
            toast.current.show({ 
                severity: 'error', 
                summary: 'Không cho phép', 
                detail: 'Độc giả này đang mượn sách chưa trả. Mỗi người chỉ được mượn 1 cuốn tại một thời điểm.', 
                life: 5000 
            });
            return;
        }

        if (copyInfo.status !== 'Available') {
            toast.current.show({ 
                severity: 'error', 
                summary: 'Không cho phép', 
                detail: 'Bản sao sách này hiện không sẵn sàng (Đã được mượn hoặc đang xử lý)', 
                life: 3000 
            });
            return;
        }

        setCreating(true);
        try {
            const userInfo = authApi.getUserInfo();
            const librarianId = userInfo?.id || 1;

            await borrowApi.borrow(readerInfo.id, copyInfo.id, librarianId);
            
            toast.current.show({ 
                severity: 'success', 
                summary: 'Thành công', 
                detail: 'Đã lập phiếu mượn sách thành công', 
                life: 3000 
            });
            
            // Reset form
            setReaderId('');
            setCopyId('');
            setReaderInfo(null);
            setCopyInfo(null);
            setActiveBorrow(null);
        } catch (err) {
            toast.current.show({ 
                severity: 'error', 
                summary: 'Lỗi', 
                detail: err.message, 
                life: 4000 
            });
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4">
            <Toast ref={toast} />
            
            <div className="flex items-center gap-2 mb-6">
                <i className="pi pi-arrow-right-arrow-left text-blue-600 text-3xl"></i>
                <h2 className="text-3xl font-bold text-gray-800 m-0">Quản lý Mượn sách</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Form nhập liệu */}
                <Card title="Thông tin mượn mới" className="shadow-md">
                    <div className="flex flex-col gap-6">
                        <div className="field">
                            <label htmlFor="readerId" className="font-bold block mb-2">Mã Độc giả</label>
                            <div className="p-inputgroup">
                                <InputText 
                                    id="readerId" 
                                    value={readerId} 
                                    onChange={(e) => setReaderId(e.target.value)} 
                                    onBlur={handleReaderSearch}
                                    placeholder="Vd: SV001"
                                    className="uppercase"
                                />
                                <Button icon="pi pi-search" onClick={handleReaderSearch} loading={loadingReader} />
                            </div>
                        </div>

                        <div className="field">
                            <label htmlFor="copyId" className="font-bold block mb-2">Mã Bản sao Sách</label>
                            <div className="p-inputgroup">
                                <InputText 
                                    id="copyId" 
                                    value={copyId} 
                                    onChange={(e) => setCopyId(e.target.value)} 
                                    onBlur={handleCopySearch}
                                    placeholder="Vd: BS-MATH-01"
                                    className="uppercase"
                                />
                                <Button icon="pi pi-search" onClick={handleCopySearch} loading={loadingCopy} />
                            </div>
                        </div>

                        <Divider />

                        <Button 
                            label="Lập Phiếu Mượn" 
                            icon="pi pi-check-circle" 
                            className="p-button-lg p-button-success w-full" 
                            onClick={handleCreateBorrow}
                            loading={creating}
                            disabled={!readerInfo || !copyInfo || !!activeBorrow || copyInfo.status !== 'Available'}
                        />
                    </div>
                </Card>

                {/* Hiển thị thông tin kiểm tra */}
                <div className="flex flex-col gap-4">
                    {/* Thông tin độc giả */}
                    <Card title="Thông tin Độc giả" className="shadow-sm">
                        {readerInfo ? (
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Họ tên:</span>
                                    <span className="font-bold">{readerInfo.full_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Lớp:</span>
                                    <span className="font-bold">{readerInfo.class_name}</span>
                                </div>
                                
                                {activeBorrow ? (
                                    <Message 
                                        severity="error" 
                                        text={`Không đủ điều kiện (Đang mượn: ${activeBorrow.book_copy_id})`} 
                                        className="mt-2 w-full justify-start"
                                    />
                                ) : (
                                    <Message 
                                        severity="success" 
                                        text="Đủ điều kiện mượn sách" 
                                        className="mt-2 w-full justify-start"
                                    />
                                )}
                            </div>
                        ) : (
                            <div className="text-gray-400 italic text-center py-4">
                                Vui lòng nhập Mã độc giả để kiểm tra
                            </div>
                        )}
                    </Card>

                    {/* Thông tin sách */}
                    <Card title="Thông tin Sách" className="shadow-sm">
                        {copyInfo ? (
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Tên sách:</span>
                                    <span className="font-bold text-right ml-2">{copyInfo.bookInfo?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Tác giả:</span>
                                    <span className="font-bold">{copyInfo.bookInfo?.author}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Tình trạng:</span>
                                    <span className="font-bold">{copyInfo.condition}</span>
                                </div>
                                
                                {copyInfo.status === 'Available' ? (
                                    <Message 
                                        severity="success" 
                                        text="Sách sẵn sàng cho mượn" 
                                        className="mt-2 w-full justify-start"
                                    />
                                ) : (
                                    <Message 
                                        severity="warn" 
                                        text="Sách đã được mượn hoặc không sẵn sàng" 
                                        className="mt-2 w-full justify-start"
                                    />
                                )}
                            </div>
                        ) : (
                            <div className="text-gray-400 italic text-center py-4">
                                Vui lòng nhập Mã bản sao để kiểm tra
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
