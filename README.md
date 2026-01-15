# Gomoku Online - Cờ Caro Trực Tuyến

Chào mừng bạn đến với dự án Gomoku Online! Đây là ứng dụng cờ Caro chơi qua mạng sử dụng Firebase Realtime Database.

## Hướng dẫn thiết lập Secrets trên GitHub (QUAN TRỌNG)

Để tránh lộ API Key và bảo vệ dự án, bạn cần cấu hình các **Secrets** trong repository của mình trên GitHub. 

### Các bước thực hiện:

1. Truy cập repository của bạn trên GitHub.
2. Chọn **Settings** > **Secrets and variables** > **Actions**.
3. Nhấn **New repository secret** và thêm các biến dưới đây.

### Danh sách các Secret cần thêm:

Bạn lấy các giá trị này từ phần **Project Settings** trong Firebase Console (xem hướng dẫn bên dưới):

| Tên Secret trên GitHub | Giá trị tương ứng từ Firebase Config |
| :--- | :--- |
| `FIREBASE_API_KEY` | `apiKey` |
| `FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `FIREBASE_DATABASE_URL` | `databaseURL` |
| `FIREBASE_PROJECT_ID` | `projectId` |
| `FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `FIREBASE_APP_ID` | `appId` |

---

## Hướng dẫn lấy thông tin thiết lập Firebase

### Bước 1: Tạo Dự án Firebase
1. Truy cập [Firebase Console](https://console.firebase.google.com/).
2. Nhấn **Add project**, đặt tên và tạo dự án.

### Bước 2: Tạo Realtime Database
1. Chọn **Build** > **Realtime Database** > **Create Database**.
2. Chọn vị trí server (**Singapore - asia-southeast1**) để có tốc độ tốt nhất.
3. Chọn **Start in test mode** để có thể chạy ngay.

### Bước 3: Lấy App Settings (Config)
1. Nhấn vào biểu tượng ⚙️ (Project settings) ở menu bên trái.
2. Cuộn xuống phần **Your apps**, nếu chưa có app nào thì nhấn biểu tượng Web (`</>`) để tạo.
3. Sau khi tạo, Firebase sẽ hiển thị đoạn mã `const firebaseConfig = { ... }`.
4. Hãy copy các giá trị trong dấu ngoặc nhọn `{}` để điền vào GitHub Secrets tương ứng ở bảng trên.

---

## Tự động Deploy lên GitHub Pages

Dự án đã được thiết lập GitHub Actions. Mỗi khi bạn `git push` lên nhánh `main`, hệ thống sẽ tự động thay thế các placeholder bằng Secrets bạn đã cấu hình và deploy lên GitHub Pages.

## Cách chạy Local để Test
Vì code hiện tại sử dụng placeholders cho bảo mật, bạn không thể chạy trực tiếp nếu không điền key vào `js/firebase-config.js`. 
> [!TIP]
> Bạn có thể tạm thời điền key thật vào file để test local, nhưng **đừng commit** file đó. GitHub sẽ tự động điền key thật khi deploy production.
