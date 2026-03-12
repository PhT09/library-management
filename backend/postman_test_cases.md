# Hướng Dẫn Test (User Acceptance Testing) bằng Postman

Dưới đây là **Các Kịch bản Kiểm thử (Test Cases)** được viết theo luồng sử dụng thực tế của 1 Thư viện. Bạn hãy làm lần lượt từng bài test trên Postman (Phương thức `POST`, điền JSON vào tab `Body -> raw -> JSON`).

*Lưu ý: Mọi API đều dùng chung địa chỉ gốc là: `http://127.0.0.1:8000`*

---

## GIAI ĐOẠN 1: KHỞI TẠO DỮ LIỆU BAN ĐẦU

### Test Case 1: Tạo Thẻ Độc giả (Sinh viên đến đăng ký thẻ)
**1. Method:** `POST`  
**2. URL:** `http://127.0.0.1:8000/readers/`  
**3. Body (JSON):**
```json
{
  "id": "SV001",
  "full_name": "Nguyễn Văn A",
  "class_name": "KTPM 01",
  "dob": "2002-05-15",
  "gender": "Nam"
}
```
**-> Kết quả (PASS):** Trả về data y hệt. Thử bấm Send lần 2 nó sẽ báo lỗi `400: Mã Độc giả đã tồn tại!`.

### Test Case 2: Tạo Chuyên ngành Sách
**1. Method:** `POST`  
**2. URL:** `http://127.0.0.1:8000/categories/`  
**3. Body (JSON):**
```json
{
  "id": "CNTT",
  "name": "Công Nghệ Thông Tin",
  "description": "Giáo trình và tài liệu cho ngành IT"
}
```

### Test Case 3: Thêm mã sách mới (Chỉ là cái vỏ bọc/thông tin chung)
**1. Method:** `POST`  
**2. URL:** `http://127.0.0.1:8000/books/`  
**3. Body (JSON):**
```json
{
  "id": "B001",
  "name": "Lập trình C++ Cơ bản",
  "publisher": "NXB Giáo Dục",
  "size": "A4",
  "author": "Phạm Văn Ất",
  "category_id": "CNTT"
}
```

### Test Case 4: Nhập Kho Bản sao sách (Cầm cuốn sách vật lý dán mã vạch nhập kho)
*Lưu ý: Bạn vừa mới yêu cầu, tôi đã viết nhanh API này bổ sung vào code rồi, giờ bạn test được ngay!*

**1. Method:** `POST`  
**2. URL:** `http://127.0.0.1:8000/book-copies/`  
**3. Body (JSON):**
```json
{
  "id": "C-1001",
  "book_id": "B001",
  "condition": "Mới",
  "import_date": "2024-03-12"
}
```
*(Lúc này, cuốn sách có mã vạch C-1001 chính thức có trên kệ và ở trạng thái "Available")*

---

## GIAI ĐOẠN 2: LUỒNG NGHIỆP VỤ MƯỢN / TRẢ SÁCH

### Test Case 5: Độc giả mượn sách thành công
Nguyễn Văn A mang cuốn sách quét mã mượn.
**1. Method:** `POST`  
**2. URL:** `http://127.0.0.1:8000/borrow/?reader_id=SV001&book_copy_id=C-1001`  
*(Cái này nó nằm trên URL luôn, không cần viết Body)*  
**-> Kết quả (PASS):** Thông báo `"Tạo phiếu mượn thành công!"` và ID của phiếu mượn (Ví dụ `borrow_id: 1`). Cuốn sách C-1001 đã bị chuyển thành `Borrowed` trong kho.

### Test Case 6: Cố tình vi phạm luật "Chỉ mượn 1 cuốn/lần"
Nguyễn Văn A (SV001) tham lam, lấy thêm cuốn C-1002 (Giả sử bạn đã tạo thêm 1 cuốn) để mượn tiếp trong khi cuốn cũ chưa trả.
**1. Method:** `POST`  
**2. URL:** `http://127.0.0.1:8000/borrow/?reader_id=SV001&book_copy_id=C-1001` (Cứ bấm lại thêm 1 lần nữa cái Test Case 5)
**-> Kết quả (PASS):** Hệ thống báo lỗi `"Độc giả này đang mượn 1 cuốn chưa trả. Vui lòng trả sách trước khi mượn mới!"`. => Logic hoàn hảo!

### Test Case 7: Trả sách về thư viện
Nguyễn Văn A mang sách lên bàn Thủ thư xin trả lại. (Thủ thư cầm thẻ xem mã Phiếu mượn là `1`).
**1. Method:** `POST`  
**2. URL:** `http://127.0.0.1:8000/return/1` *(Số 1 ở đây chính là mã borrow_id sinh ra từ lúc nãy)*
**-> Kết quả (PASS):** Hệ thống báo `"Xác nhận trả sách thành công, đã xếp lại vào kho!"`. Giờ Nguyễn Văn A đã sạch nợ, có thể mượn cuốn khác thỏa thích.
