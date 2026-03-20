import React, { useState } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import CategoryManagement from './BookManagement/CategoryManagement';
import BookTitleManagement from './BookManagement/BookTitleManagement';

export default function BookManagement() {
    const [activeIndex, setActiveIndex] = useState(0);

    return (
        <div className="card shadow-sm border-round overflow-hidden">
            <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
                <TabPanel header="Chuyên ngành" leftIcon="pi pi-list mr-2">
                    <CategoryManagement />
                </TabPanel>
                <TabPanel header="Đầu sách & Bản sao" leftIcon="pi pi-book mr-2">
                    <BookTitleManagement />
                </TabPanel>
                {/* 
                  Tab 1: Categories -> CategoryManagement
                  Tab 2: Books & Copies -> BookTitleManagement
                */}
            </TabView>
        </div>
    );
}
