import React from 'react';
import LoginPageComponent from '../components/LoginPageComponent';

export default function LibrarianLoginPage() {
    return (
        <LoginPageComponent 
            title="Đăng nhập Thủ thư" 
            roleLabel="Cán bộ Thư viện" 
            requiredRole="librarian"
            icon="pi pi-id-card"
        />
    );
}
