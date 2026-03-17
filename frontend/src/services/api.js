/**
 * api.js - Module trung tâm xử lý tất cả API calls tới Backend.
 * 
 * Cấu trúc:
 *  - authApi: Đăng nhập, lấy thông tin user, đăng xuất
 *  - readerApi: CRUD Độc giả
 *  - bookApi: Tìm kiếm sách, lấy danh sách, CRUD sách + danh mục
 *  - borrowApi: Mượn/trả sách
 *  - librarianApi: CRUD Thủ thư (Admin only)
 *  - reportApi: Báo cáo thống kê
 * 
 * Backend chạy tại: http://localhost:8000
 */

const API_BASE = '/api';

// ============================================================
// HELPER: Hàm fetch có xử lý lỗi chung
// ============================================================

/**
 * Wrapper cho fetch API, tự động gắn Authorization header nếu có token.
 * Tự parse JSON response và throw error với message từ backend.
 */
async function request(url, options = {}) {
    const token = localStorage.getItem('access_token');

    const defaultHeaders = {};
    // Chỉ set Content-Type nếu body không phải FormData/URLSearchParams
    if (options.body && typeof options.body === 'string') {
        defaultHeaders['Content-Type'] = 'application/json';
    }
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    });

    // Xử lý response không thành công
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.detail || `Lỗi ${response.status}: ${response.statusText}`;
        const error = new Error(message);
        error.status = response.status;
        throw error;
    }

    // Nếu response trống (204 No Content) thì return null
    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

// ============================================================
// AUTH API - Đăng nhập / Xác thực
// ============================================================
export const authApi = {
    /**
     * Đăng nhập: POST /login (form-urlencoded theo OAuth2PasswordRequestForm)
     * @returns {{ access_token: string, token_type: string }}
     */
    login: async (username, password) => {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString(),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || 'Sai tên đăng nhập hoặc mật khẩu!');
        }

        const data = await response.json();
        // Lưu token vào localStorage ngay sau khi đăng nhập thành công
        localStorage.setItem('access_token', data.access_token);
        return data;
    },

    /**
     * Lấy thông tin user hiện tại từ token: GET /login/test-token
     * @returns {{ id, username, full_name, role, is_active }}
     */
    getMe: async () => {
        const data = await request('/login/test-token');
        // Lưu thông tin user vào localStorage để các component khác dùng
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('userInfo', JSON.stringify(data));
        return data;
    },

    /** Đăng xuất: xóa tất cả dữ liệu auth khỏi localStorage */
    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userInfo');
    },

    /** Kiểm tra đã đăng nhập chưa */
    isAuthenticated: () => !!localStorage.getItem('access_token'),

    /** Lấy thông tin user đã cache trong localStorage */
    getUserInfo: () => {
        try {
            const raw = localStorage.getItem('userInfo');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            console.error('Error parsing userInfo:', e);
            return null;
        }
    },

    /** Tìm kiếm user (dùng cho luồng quên mật khẩu) */
    searchUser: (query) => request(`/librarians/?full_name=${encodeURIComponent(query)}`),
};

// ============================================================
// READER API - Quản lý Độc giả
// ============================================================
export const readerApi = {
    /** GET /readers/ - Lấy danh sách tất cả độc giả */
    getAll: () => request('/readers/'),

    /** POST /readers/ - Tạo mới độc giả */
    create: (readerData) => request('/readers/', {
        method: 'POST',
        body: JSON.stringify(readerData),
    }),

    /** PUT /readers/{id} - Cập nhật thông tin độc giả */
    update: (readerId, readerData) => request(`/readers/${readerId}`, {
        method: 'PUT',
        body: JSON.stringify(readerData),
    }),

    /** GET /readers/{id} - Lấy thông tin chi tiết độc giả */
    getById: (readerId) => request(`/readers/${readerId}`),

    /** DELETE /readers/{id} - Xóa mềm (vô hiệu hóa) độc giả */
    delete: (readerId) => request(`/readers/${readerId}`, {
        method: 'DELETE',
    }),
    
    /** Export: GET /readers/export */
    exportExcel: (search) => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        params.append('file_format', 'excel');
        
        // Cần truy cập token nếu /api yêu cầu
        const token = localStorage.getItem('access_token');
        const url = `${API_BASE}/readers/export?${params.toString()}`;
        
        // Lưu ý: với GET download file qua browser window.open, ta không truyền default headers (Bearer token) đc
        // Tốt nhất backend nên verify bằng cookie hoặc pass qua query param, nhưng mock ở đây đơn giản:
        // Đính kèm token vô link nếu hệ thống cần
        fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.blob()).then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = "Danh_sach_doc_gia.xlsx";
            document.body.appendChild(a);
            a.click();
            a.remove();
        });
    },
};

// ============================================================
// BOOK API - Quản lý Sách & Danh mục
// ============================================================
export const bookApi = {
    /** GET /books/ - Lấy danh sách tất cả sách */
    getAll: () => request('/books/'),

    /** GET /books/search?q=... - Tìm kiếm sách theo tên, tác giả, chuyên ngành */
    search: (query) => request(`/books/search?q=${encodeURIComponent(query)}`),

    /** POST /books/ - Tạo mới sách */
    createBook: (bookData) => request('/books/', {
        method: 'POST',
        body: JSON.stringify(bookData),
    }),

    /** PUT /books/{id} - Cập nhật sách */
    updateBook: (bookId, bookData) => request(`/books/${bookId}`, {
        method: 'PUT',
        body: JSON.stringify(bookData),
    }),

    /** DELETE /books/{id} - Xóa sách */
    deleteBook: (bookId) => request(`/books/${bookId}`, {
        method: 'DELETE',
    }),

    // --- Categories ---

    /** GET /categories/ - Lấy danh sách chuyên ngành */
    getCategories: () => request('/categories/'),

    /** POST /categories/ - Tạo mới chuyên ngành */
    createCategory: (catData) => request('/categories/', {
        method: 'POST',
        body: JSON.stringify(catData),
    }),

    /** PUT /categories/{id} - Cập nhật chuyên ngành */
    updateCategory: (catId, catData) => request(`/categories/${catId}`, {
        method: 'PUT',
        body: JSON.stringify(catData),
    }),

    /** DELETE /categories/{id} - Xóa chuyên ngành */
    deleteCategory: (catId) => request(`/categories/${catId}`, {
        method: 'DELETE',
    }),

    // --- Book Copies ---

    /** GET /book-copies/ - Lấy danh sách tất cả bản sao sách */
    getBookCopies: () => request('/book-copies/'),

    /** POST /book-copies/ - Tạo mới bản sao sách */
    createBookCopy: (copyData) => request('/book-copies/', {
        method: 'POST',
        body: JSON.stringify(copyData),
    }),

    /** PUT /book-copies/{id} - Cập nhật bản sao sách */
    updateBookCopy: (copyId, copyData) => request(`/book-copies/${copyId}`, {
        method: 'PUT',
        body: JSON.stringify(copyData),
    }),

    /** DELETE /book-copies/{id} - Xóa bản sao sách */
    deleteBookCopy: (copyId) => request(`/book-copies/${copyId}`, {
        method: 'DELETE',
    }),
};

// ============================================================
// BORROW API - Mượn/Trả sách
// ============================================================
export const borrowApi = {
    /** GET /borrows/ - Lấy danh sách phiếu mượn */
    getAll: (readerId, status) => {
        const params = new URLSearchParams();
        if (readerId) params.append('reader_id', readerId);
        if (status) params.append('status', status);
        const queryStr = params.toString();
        return request(`/borrows/${queryStr ? '?' + queryStr : ''}`);
    },

    /** POST /borrows/ - Lập phiếu mượn sách */
    borrow: (readerId, bookCopyId, librarianId = 1) => {
        const params = new URLSearchParams({
            reader_id: readerId,
            book_copy_id: bookCopyId,
            librarian_id: librarianId,
        });
        return request(`/borrows/?${params.toString()}`, { method: 'POST' });
    },

    /** POST /borrows/return/{borrow_id} - Xác nhận trả sách */
    returnBook: (borrowId) => request(`/borrows/return/${borrowId}`, { method: 'POST' }),
};

// ============================================================
// LIBRARIAN API - Quản lý Thủ thư (Admin only, cần Bearer token)
// ============================================================
export const librarianApi = {
    /** GET /librarians/ */
    getAll: () => request('/librarians/'),

    /** POST /librarians/ */
    create: (userData) => request('/librarians/', {
        method: 'POST',
        body: JSON.stringify(userData),
    }),

    /** PUT /librarians/{id} */
    update: (librarianId, userData) => request(`/librarians/${librarianId}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
    }),

    /** DELETE /librarians/{id}?target_librarian_id=... */
    delete: (librarianId, targetLibrarianId) =>
        request(`/librarians/${librarianId}?target_librarian_id=${targetLibrarianId}`, {
            method: 'DELETE',
        }),

    /** Đặt lại mật khẩu (dùng API PUT hiện có) */
    resetPassword: (librarianId, newPassword) => request(`/librarians/${librarianId}`, {
        method: 'PUT',
        body: JSON.stringify({ password: newPassword }),
    }),
};

// ============================================================
// TICKET API - Quản lý yêu cầu khôi phục mật khẩu (MOCKED via LocalStorage)
// ============================================================
export const ticketApi = {
    /** Lấy danh sách ticket từ localStorage */
    getAll: () => {
        return new Promise((resolve) => {
            const tickets = JSON.parse(localStorage.getItem('mock_password_tickets') || '[]');
            resolve(tickets);
        });
    },

    /** Tạo ticket mới */
    create: (username, reason) => {
        return new Promise((resolve) => {
            const tickets = JSON.parse(localStorage.getItem('mock_password_tickets') || '[]');
            const newTicket = {
                id: Date.now(),
                username,
                reason,
                created_at: new Date().toISOString()
            };
            tickets.unshift(newTicket); // Thêm vào đầu danh sách
            localStorage.setItem('mock_password_tickets', JSON.stringify(tickets));
            resolve(newTicket);
        });
    },

    /** Phê duyệt: chỉ giả lập thành công */
    approve: (ticketId) => {
        return new Promise((resolve) => {
            // Xóa ticket sau khi phê duyệt
            const tickets = JSON.parse(localStorage.getItem('mock_password_tickets') || '[]');
            const filtered = tickets.filter(t => t.id !== ticketId);
            localStorage.setItem('mock_password_tickets', JSON.stringify(filtered));
            resolve({ message: "Password reset successful (Mocked)" });
        });
    },

    /** Xóa ticket */
    delete: (ticketId) => {
        return new Promise((resolve) => {
            const tickets = JSON.parse(localStorage.getItem('mock_password_tickets') || '[]');
            const filtered = tickets.filter(t => t.id !== ticketId);
            localStorage.setItem('mock_password_tickets', JSON.stringify(filtered));
            resolve({ message: "Ticket deleted (Mocked)" });
        });
    },
};

// ============================================================
// REPORT API - Báo cáo thống kê
// ============================================================
export const reportApi = {
    /** GET /reports/top-books - Top sách mượn nhiều nhất */
    getTopBooks: (startDate, endDate, limit = 10) => {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        params.append('limit', limit);
        return request(`/reports/top-books?${params.toString()}`);
    },

    /** GET /reports/unreturned-readers - Danh sách độc giả chưa trả sách */
    getUnreturnedReaders: (startDate, endDate) => {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        return request(`/reports/unreturned-readers?${params.toString()}`);
    },

    /** Export PDF: GET /reports/export/pdf?... */
    exportPDF: (startDate, endDate) => {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        window.open(`${API_BASE}/reports/export/pdf?${params.toString()}`, '_blank');
    },

    /** Export Excel: GET /reports/export/excel?... */
    exportExcel: (startDate, endDate) => {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        window.open(`${API_BASE}/reports/export/excel?${params.toString()}`, '_blank');
    }
};
