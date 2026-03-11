# library-management
Working in "develop" branch during develop project
## Clone nhánh lần đầu về máy
```bash
git clone -b develop https://github.com/user/repo.git
cd repo
```
Để đảm bảo code không bị xung đột, dễ quản lý và hỗ trợ Review lẫn nhau, tất cả thành viên hãy tuân thủ quy trình Git Flow dưới đây.
### Cấu trúc Thư mục Chính
 * /frontend: Chứa toàn bộ mã nguồn giao diện (React/HTML...).
 * /backend: Chứa mã nguồn máy chủ, API và xử lý dữ liệu (Python...).
### Các Nhánh Quy định
 * main: Nhánh sản phẩm cuối cùng. Chỉ chứa code đã test hoàn chỉnh. Tuyệt đối không code trực tiếp trên đây.
 * develop: Nhánh tập trung code của cả đội. Mọi tính năng mới sẽ được gộp vào đây để kiểm tra.
 * feat/... hoặc fix/...: Các nhánh tính năng hoặc sửa lỗi của từng cá nhân.
### Quy trình làm việc
1. Cập nhật Code mới nhất:

Trước khi bắt đầu code tính năng mới, hãy đảm bảo bạn đang có code mới nhất của team:
```bash
git checkout develop
git pull origin develop
```
2. Tạo nhánh mới để làm việc:

Tuyệt đối không code trên develop. Hãy tạo nhánh riêng:
Cấu trúc: feat/ten-tinh-nang hoặc fix/ten-loi
```bash
git checkout -b feat/database  # Ví dụ tạo nhánh làm về database
```
3. Code và Commit:

Chia nhỏ các lần Commit để dễ theo dõi. Ghi Message rõ ràng:
```bash
git add .
git commit -m "feat: setup database schema cho User"
```
4. Đẩy code lên GitHub (Push):

Sau khi hoàn thành tính năng ở máy local, push nhánh đó lên GitHub:
```bash
git push origin feat/database
```
5. Tạo Pull Request (PR) & Review Code
 * Lên GitHub, chọn nút Compare & pull request.Thiết lập: ```base: develop``` $\leftarrow$ ```compare: feat/database```.
 * Tag ít nhất 1 thành viên vào phần Reviewers.
 * Đợi team review:
   * Nếu có góp ý: Sửa trực tiếp trên máy mình rồi push tiếp (PR sẽ tự cập nhật).
   * Nếu ổn: Manager hoặc người review sẽ nhấn Merge để gộp vào develop.
### Quy tắc đặt tên 
|Loại nhánh/Commit|Tiền tố|Ví dụ|
|-|-|-|
|Tính năng mới|feat:|feat/login-page, feat: add login validation|
|Sửa lỗi|fix:|fix/header-stuck, fix: handle null pointer|
|Tài liệu|docs:|docs/update-readme|
|Tối ưu code|refactor:|refactor: clean up api calls|
#### Lưu ý để tránh Xung đột
* Pull thường xuyên: Trước khi bắt đầu và sau khi kết thúc một buổi làm việc.
* Merge develop vào nhánh mình: Nếu nhánh ```develop``` trên GitHub có thay đổi trong khi bạn đang code, hãy merge nó vào nhánh của bạn để xử lý xung đột sớm:
```bash
git checkout feat/database
git merge develop
```
 * Không đẩy file rác: Kiểm tra kỹ file .gitignore để không push node_modules, .env, hoặc các file log cá nhân.
#### Ghi chú: Nếu gặp xung đột mà không chắc chắn cách xử lý, hãy nhắn ngay lên nhóm để cùng giải quyết, đừng cố "force push"
