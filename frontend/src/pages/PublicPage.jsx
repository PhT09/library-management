import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { publicApi, bookApi } from '../services/api';
import { Search, Book as BookIcon, User, Building, Layers, Shield, IdCard, Filter, XCircle, AlertCircle } from 'lucide-react';

export default function PublicPage() {
    const navigate = useNavigate();
    
    // Search & Data
    const [searchTerm, setSearchTerm] = useState('');
    const [books, setBooks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [authors, setAuthors] = useState([]);
    const [publishers, setPublishers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Filters
    const [selectedCategory, setSelectedCategory] = useState(null); // by name
    const [authorFilter, setAuthorFilter] = useState(null);
    const [publisherFilter, setPublisherFilter] = useState(null);
    
    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [booksData, categoriesData, authorsData, publishersData] = await Promise.all([
                publicApi.searchBooks(''),
                publicApi.getCategories().catch(() => []),
                publicApi.getAuthors().catch(() => []),
                publicApi.getPublishers().catch(() => []),
            ]);
            setBooks(booksData || []);

            const catOptions = [
                { label: 'Tất cả chuyên ngành', value: null },
                ...(categoriesData || []).map(cat => ({ label: cat.name, value: cat.name })),
            ];
            setCategories(catOptions);

            const authOptions = [
                { label: 'Tất cả tác giả', value: null },
                ...(authorsData || []).map(auth => {
                    const val = typeof auth === 'object' ? auth.author || auth.name : auth;
                    return { label: val, value: val };
                }).filter(o => o.value),
            ];
            setAuthors(authOptions);

            const pubOptions = [
                { label: 'Tất cả NXB', value: null },
                ...(publishersData || []).map(pub => {
                    const val = typeof pub === 'object' ? pub.publisher || pub.name : pub;
                    return { label: val, value: val };
                }).filter(o => o.value),
            ];
            setPublishers(pubOptions);
        } catch (err) {
            console.error('Lỗi tải dữ liệu:', err.message);
            setError('Không thể tải dữ liệu từ máy chủ. ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        setError(null);
        try {
            const results = await publicApi.searchBooks(searchTerm.trim());
            setBooks(results || []);
        } catch (err) {
            console.error('Lỗi tìm kiếm:', err.message);
            setError('Lỗi khi tìm kiếm: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Client-side filtering logic
    const filteredBooks = books.filter(book => {
        const matchCategory = !selectedCategory || book.category_name === selectedCategory;
        const matchAuthor = !authorFilter || book.author === authorFilter;
        const matchPublisher = !publisherFilter || book.publisher === publisherFilter;
        
        return matchCategory && matchAuthor && matchPublisher;
    });

    const resetFilters = () => {
        setSelectedCategory(null);
        setAuthorFilter(null);
        setPublisherFilter(null);
    };

    const itemTemplate = (book) => {
        const isAvailable = book.available_copies > 0;
        return (
            <div key={book.book_id} className="col-12 sm:col-6 lg:col-4 p-2 transition-all duration-300">
                <div className="p-5 border border-gray-200 rounded-xl shadow-sm bg-white h-full flex flex-col hover:shadow-lg hover:border-blue-300 group">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-gray-800 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors m-0" title={book.book_name}>
                            {book.book_name}
                        </h3>
                    </div>

                    <div className="flex-grow flex flex-col gap-3 text-gray-600 text-sm">
                        <div className="flex items-center gap-2">
                            <User size={16} className="text-gray-400" />
                            <span className="truncate"><b>Tác giả:</b> {book.author || 'Chưa cập nhật'}</span>
                        </div>
                        {book.category_name && (
                            <div className="flex items-center gap-2">
                                <Layers size={16} className="text-gray-400" />
                                <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-md font-medium">
                                    <span className="truncate"><b>Chuyên ngành: </b>{book.category_name}</span>
                                </span>
                            </div>
                        )}
                        {book.publisher && (
                            <div className="flex items-center gap-2">
                                <Building size={16} className="text-gray-400" />
                                <span className="truncate"><b>NXB:</b> {book.publisher}</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between items-center">
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-400 font-medium">Mã sách</span>
                            <span className="text-sm font-bold text-gray-700">{book.book_id}</span>
                        </div>
                        <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {isAvailable ? (
                                <>
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    Sẵn sàng ({book.available_copies})
                                </>
                            ) : (
                                <>
                                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                    Đã hết
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 px-6 py-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg text-white">
                        <BookIcon size={24} />
                    </div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent m-0">Library Portal</h1>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        label="Đăng nhập Admin" 
                        icon={<Shield size={18} className="mr-2" />} 
                        className="p-button-outlined p-button-sm p-button-danger rounded-lg font-medium" 
                        onClick={() => navigate('/login-admin')} 
                    />
                    <Button 
                        label="Đăng nhập Thủ thư" 
                        icon={<IdCard size={18} className="mr-2" />} 
                        className="p-button-outlined p-button-sm p-button-info rounded-lg font-medium" 
                        onClick={() => navigate('/login-librarian')} 
                    />
                </div>
            </header>

            {/* Hero Section */}
            <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 text-white py-20 px-4 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
                    <BookIcon size={400} className="absolute -top-20 -right-20 transform rotate-12" />
                    <Layers size={300} className="absolute top-40 -left-10 transform -rotate-12" />
                </div>
                <div className="relative z-10 max-w-4xl mx-auto">
                    <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">Tra cứu tài liệu thư viện</h1>
                    <p className="text-xl md:text-2xl mb-12 text-blue-100 font-light">Khám phá tri thức với hàng nghìn đầu sách được chọn lọc</p>

                    <div className="bg-white/10 backdrop-blur-lg p-2 rounded-2xl shadow-2xl border border-white/20 flex flex-col md:flex-row gap-2 transition-all focus-within:bg-white/20">
                        <div className="flex-grow flex items-center w-full md:w-auto relative">
                            <Search size={20} className="absolute left-5 text-white/70 pointer-events-none z-10" />
                            <InputText
                                placeholder="Tìm kiếm theo Tên sách, Tác giả..."
                                className="w-full pl-14 py-4 bg-transparent border-none font-medium text-lg focus:ring-0 text-white placeholder:text-white/60 focus:bg-white/10 rounded-xl transition-colors"
                                style={{ boxShadow: 'none' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <Button
                            label="Tìm ngay"
                            className="w-full md:w-auto px-8 py-4 bg-white text-blue-700 rounded-xl font-bold text-lg border-none hover:bg-blue-50 transition-colors shadow-none"
                            onClick={handleSearch}
                            loading={loading}
                        />
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full flex flex-col md:flex-row gap-8">
                
                {/* Sidebar Filter */}
                <div className="w-full md:w-80 flex-shrink-0">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-28">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 m-0">
                                <Filter size={20} className="text-blue-600" />
                                Bộ lọc nâng cao
                            </h2>
                            {(selectedCategory || authorFilter || publisherFilter) && (
                                <button 
                                    onClick={resetFilters}
                                    className="text-xs font-semibold text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
                                >
                                    <XCircle size={14} /> Xóa lọc
                                </button>
                            )}
                        </div>
                        
                        <div className="flex flex-col gap-6">
                            <div className="filter-group">
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <Layers size={16} className="text-gray-400" /> Chuyên ngành
                                </label>
                                <Dropdown
                                    value={selectedCategory}
                                    options={categories}
                                    onChange={(e) => setSelectedCategory(e.value)}
                                    placeholder={loading ? 'Đang tải...' : 'Chọn chuyên ngành'}
                                    disabled={loading || categories.length <= 1}
                                    className="w-full border-gray-200 rounded-lg hover:border-blue-400 focus:border-blue-500"
                                    panelClassName="text-sm"
                                    filter
                                    filterPlaceholder="Tìm chuyên ngành..."
                                    emptyMessage="Không có dữ liệu"
                                />
                            </div>

                            <div className="filter-group">
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <User size={16} className="text-gray-400" /> Tác giả
                                </label>
                                <Dropdown
                                    value={authorFilter}
                                    options={authors}
                                    onChange={(e) => setAuthorFilter(e.value)}
                                    placeholder={loading ? 'Đang tải...' : 'Chọn tác giả'}
                                    disabled={loading || authors.length <= 1}
                                    className="w-full border-gray-200 rounded-lg hover:border-blue-400 focus:border-blue-500"
                                    panelClassName="text-sm"
                                    filter
                                    filterPlaceholder="Tìm tác giả..."
                                    emptyMessage="Không có dữ liệu"
                                />
                            </div>

                            <div className="filter-group">
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <Building size={16} className="text-gray-400" /> Nhà xuất bản
                                </label>
                                <Dropdown
                                    value={publisherFilter}
                                    options={publishers}
                                    onChange={(e) => setPublisherFilter(e.value)}
                                    placeholder={loading ? 'Đang tải...' : 'Chọn NXB'}
                                    disabled={loading || publishers.length <= 1}
                                    className="w-full border-gray-200 rounded-lg hover:border-blue-400 focus:border-blue-500"
                                    panelClassName="text-sm"
                                    filter
                                    filterPlaceholder="Tìm NXB..."
                                    emptyMessage="Không có dữ liệu"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                <div className="flex-grow">
                    <div className="flex justify-between items-end mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 m-0">
                            Các đầu sách
                        </h2>
                        <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            Tổng cộng {filteredBooks.length} tài liệu
                        </span>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 flex items-start gap-3 border border-red-100">
                            <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-bold mb-1">Đã có lỗi xảy ra</h4>
                                <p className="text-sm">{error}</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredBooks.length > 0 ? (
                            filteredBooks.map(book => itemTemplate(book))
                        ) : (
                            <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-dashed border-gray-300">
                                <div className="bg-gray-50 p-4 rounded-full mb-4">
                                    <Search size={40} className="text-gray-300" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-700 mb-2">Không tìm thấy tài liệu</h3>
                                <p className="text-gray-500 max-w-sm">
                                    {loading ? 'Đang tải dữ liệu, vui lòng chờ trong giây lát...' : 'Thử thay đổi từ khóa hoặc xóa bớt các bộ lọc để xem nhiều kết quả hơn.'}
                                </p>
                                {(!loading && (selectedCategory || authorFilter || publisherFilter)) && (
                                    <Button 
                                        label="Xóa bộ lọc" 
                                        className="mt-6 p-button-outlined p-button-sm flex items-center justify-center gap-2"
                                        onClick={resetFilters}
                                    >
                                        <XCircle size={16} />
                                        <span>Xóa bộ lọc</span>
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

            </div>

            <footer className="bg-white border-t border-gray-200 text-gray-600 py-8 text-center mt-auto">
                <p className="font-medium">&copy; 2026 Hệ thống Quản lý Thư viện Đại học. Đồ án môn học.</p>
            </footer>
        </div>
    );
}
