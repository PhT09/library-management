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
        const raw = localStorage.getItem('userInfo');
        return raw ? JSON.parse(raw) : null;
    },
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

    /** DELETE /readers/{id} - Xóa mềm (vô hiệu hóa) độc giả */
    delete: (readerId) => request(`/readers/${readerId}`, {
        method: 'DELETE',
    }),
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
    create: (bookData) => request('/books/', {
        method: 'POST',
        body: JSON.stringify(bookData),
    }),

    /** PUT /books/{id} - Cập nhật sách */
    update: (bookId, bookData) => request(`/books/${bookId}`, {
        method: 'PUT',
        body: JSON.stringify(bookData),
    }),

    /** DELETE /books/{id} - Xóa sách */
    delete: (bookId) => request(`/books/${bookId}`, {
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
};

// ============================================================
// BORROW API - Mượn/Trả sách
// ============================================================
export const borrowApi = {
    /** GET /?reader_id=...&status=... - Lấy danh sách phiếu mượn */
    getAll: (readerId, status) => {
        const params = new URLSearchParams();
        if (readerId) params.append('reader_id', readerId);
        if (status) params.append('status', status);
        const queryStr = params.toString();
        return request(`/${queryStr ? '?' + queryStr : ''}`);
    },

    /** POST /borrow/?reader_id=...&book_copy_id=...&librarian_id=... */
    borrow: (readerId, bookCopyId, librarianId = 1) => {
        const params = new URLSearchParams({
            reader_id: readerId,
            book_copy_id: bookCopyId,
            librarian_id: librarianId,
        });
        return request(`/borrow/?${params.toString()}`, { method: 'POST' });
    },

    /** POST /return/{borrow_id} - Xác nhận trả sách */
    returnBook: (borrowId) => request(`/return/${borrowId}`, { method: 'POST' }),
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
};

// ============================================================
// REPORT API - Báo cáo thống kê
// ============================================================
export const reportApi = {
    /** GET /reports/top-books - Top sách mượn nhiều nhất */
    getTopBooks: (limit = 10) => request(`/reports/top-books?limit=${limit}`),

    /** GET /reports/unreturned-readers - Danh sách độc giả chưa trả sách */
    getUnreturnedReaders: () => request('/reports/unreturned-readers'),
};
