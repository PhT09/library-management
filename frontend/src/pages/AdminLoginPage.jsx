import React from 'react';
import LoginPageComponent from '../components/LoginPageComponent';

export default function AdminLoginPage() {
    return (
        <LoginPageComponent 
            title="Đăng nhập Admin" 
            roleLabel="Quản trị viên" 
            requiredRole="admin"
            icon="pi pi-shield"
        />
    );
}
