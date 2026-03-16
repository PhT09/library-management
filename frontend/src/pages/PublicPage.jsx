import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { bookApi } from '../services/api';

export default function PublicPage() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [books, setBooks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    /**
     * Khi component mount: load danh sách sách + danh mục từ Backend
     * GET /books/ + GET /categories/
     */
    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            // Gọi song song 2 API để tăng tốc
            const [booksData, categoriesData] = await Promise.all([
                bookApi.getAll(),
                bookApi.getCategories(),
            ]);
            setBooks(booksData);

            // Tạo dropdown options từ danh sách categories (backend trả về { id, name, description })
            const catOptions = [
                { label: 'Tất cả', value: null },
                ...categoriesData.map(cat => ({ label: cat.name, value: cat.id })),
            ];
            setCategories(catOptions);
        } catch (err) {
            console.error('Lỗi tải dữ liệu:', err.message);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Tìm kiếm sách qua API: GET /books/search?q=...
     * API backend tìm theo tên sách, tác giả, hoặc chuyên ngành (ilike)
     */
    const handleSearch = async () => {
        setLoading(true);
        try {
            if (searchTerm.trim()) {
                const results = await bookApi.search(searchTerm);
                setBooks(results);
            } else {
                // Nếu không nhập gì, load lại toàn bộ
                const allBooks = await bookApi.getAll();
                setBooks(allBooks);
            }
        } catch (err) {
            console.error('Lỗi tìm kiếm:', err.message);
        } finally {
            setLoading(false);
        }
    };

    // Lọc thêm theo category ở phía client (backend search không filter theo category riêng)
    const filteredBooks = selectedCategory
        ? books.filter(book => book.category_id === selectedCategory)
        : books;

    /**
     * Tìm tên category từ category_id.
     * categories state có dạng [{ label, value }], value chính là category.id
     */
    const getCategoryName = (categoryId) => {
        const cat = categories.find(c => c.value === categoryId);
        return cat ? cat.label : categoryId;
    };

    /**
     * Template hiển thị từng card sách.
     * Mapping backend fields: id, name (tên sách), author, category_id, publisher, size
     */
    const itemTemplate = (book) => {
        return (
            <div key={book.id} className="col-12 sm:col-6 lg:col-4 p-2">
                <div className="p-4 border-1 surface-border border-round shadow-1 bg-white h-full flex flex-column transition-all hover:shadow-3 cursor-pointer">
                    <div className="flex justify-content-between align-items-center mb-3">
                        <span className="text-xl font-bold text-primary truncate" title={book.name}>
                            {book.name}
                        </span>
                    </div>

                    <div className="flex-grow-1 flex flex-col gap-2 text-surface-700">
                        <div className="flex items-center gap-2">
                            <i className="pi pi-user text-gray-500"></i>
                            <span><b>Tác giả:</b> {book.author}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <i className="pi pi-tags text-gray-500"></i>
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                {getCategoryName(book.category_id)}
                            </span>
                        </div>
                        {book.publisher && (
                            <div className="flex items-center gap-2">
                                <i className="pi pi-building text-gray-500"></i>
                                <span><b>NXB:</b> {book.publisher}</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
                        <span className="text-gray-500 text-sm">Mã sách:</span>
                        <span className="text-lg font-bold text-gray-800 bg-gray-100 px-3 py-1 rounded">{book.id}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <i className="pi pi-book text-blue-600 text-2xl"></i>
                    <h1 className="text-2xl font-bold text-gray-800 m-0">Library Portal</h1>
                </div>
                <div className="flex flex-col gap-2">
                    <Button 
                        label="Đăng nhập Admin" 
                        icon="pi pi-shield" 
                        className="p-button-outlined p-button-sm p-button-danger" 
                        onClick={() => navigate('/login-admin')} 
                    />
                    <Button 
                        label="Đăng nhập Thủ thư" 
                        icon="pi pi-id-card" 
                        className="p-button-outlined p-button-sm p-button-info" 
                        onClick={() => navigate('/login-librarian')} 
                    />
                </div>
            </header>

            {/* Hero Section + Search */}
            <div className="bg-blue-600 text-white py-16 px-4 text-center">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">Tra cứu tài liệu thư viện</h1>
                <p className="text-xl mb-8 opacity-90">Tìm kiếm hàng nghìn đầu sách cho việc học tập và nghiên cứu</p>

                <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-2 flex flex-col md:flex-row gap-2">
                    <div className="flex-grow p-input-icon-left w-full md:w-auto">
                        <i className="pi pi-search z-10 ml-2" />
                        <InputText
                            placeholder="Tìm kiếm theo tên sách, tác giả..."
                            className="w-full pl-10 border-none font-medium text-lg focus:ring-0"
                            style={{ boxShadow: 'none' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-gray-200">
                        <Dropdown
                            value={selectedCategory}
                            options={categories}
                            onChange={(e) => setSelectedCategory(e.value)}
                            placeholder="Tất cả chuyên ngành"
                            className="w-full border-none shadow-none text-lg flex items-center"
                            panelClassName="w-full"
                        />
                    </div>
                    <Button
                        label="Tìm kiếm"
                        className="w-full md:w-auto p-button-rounded px-6"
                        onClick={handleSearch}
                        loading={loading}
                    />
                </div>
            </div>

            {/* Results Section */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">
                    Kết quả tìm kiếm ({filteredBooks.length} tài liệu)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredBooks.length > 0 ? (
                        filteredBooks.map(book => itemTemplate(book))
                    ) : (
                        <div className="col-span-full py-12 text-center text-gray-500">
                            <i className="pi pi-search text-4xl mb-4 text-gray-300"></i>
                            <p className="text-xl">
                                {loading ? 'Đang tải dữ liệu...' : 'Không tìm thấy tài liệu phù hợp.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <footer className="bg-gray-800 text-white py-6 text-center mt-auto">
                <p>&copy; 2026 Hệ thống Quản lý Thư viện Đại học. Đồ án môn học.</p>
            </footer>
        </div>
    );
}
