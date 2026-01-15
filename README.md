# Gomoku Online - Cờ Caro Trực Tuyến

Chào mừng bạn đến với dự án Gomoku Online! Đây là ứng dụng cờ Caro chơi qua mạng sử dụng Firebase Realtime Database.

## Hướng dẫn thiết lập Secrets trên GitHub (QUAN TRỌNG)

Để tránh lộ API Key và giải quyết cảnh báo bảo mật từ GitHub, bạn cần cấu hình các **Secrets** trong repository của mình:

1. Truy cập repository của bạn trên GitHub.
2. Chọn **Settings** > **Secrets and variables** > **Actions**.
3. Nhấn **New repository secret** và thêm từng biến sau đây với giá trị tương ứng từ project của bạn:

| Tên Secret | Giá trị mẫu (Thay bằng của bạn) |
| :--- | :--- |
| `FIREBASE_API_KEY` | `AIzaSyA8hhTyeavWEzLjE7HwYqXNbAjKrc9AlqQ` |
| `FIREBASE_AUTH_DOMAIN` | `gomoku-3f1a8.firebaseapp.com` |
| `FIREBASE_DATABASE_URL` | `https://gomoku-3f1a8-default-rtdb.asia-southeast1.firebasedatabase.app` |
| `FIREBASE_PROJECT_ID` | `gomoku-3f1a8` |
| `FIREBASE_STORAGE_BUCKET` | `gomoku-3f1a8.firebasestorage.app` |
| `FIREBASE_MESSAGING_SENDER_ID` | `539760004171` |
| `FIREBASE_APP_ID` | `1:539760004171:web:130477b3e733ac211991ce` |

---

## Hướng dẫn thiết lập Firebase

Nếu bạn chưa có project Firebase, hãy làm theo các bước sau:

### Bước 1: Tạo Dự án Firebase
1. Truy cập [Firebase Console](https://console.firebase.google.com/).
2. Nhấn **Add project**, đặt tên và nhấn **Continue**.

### Bước 2: Tạo Realtime Database
1. Trong menu bên trái, chọn **Build** > **Realtime Database**.
2. Nhấn **Create Database**.
3. Chọn vị trí server (**Singapore - asia-southeast1**).
4. Chọn **Start in test mode** và nhấn **Enable**.

### Bước 3: Lấy App Settings
1. Nhấn vào biểu tượng ⚙️ (Project settings).
2. Ở phần **Your apps**, thêm app Web (`</>`) và copy đoạn mã `firebaseConfig` để lấy các giá trị điền vào GitHub Secrets ở trên.

---

## Tự động Deploy lên GitHub Pages

1. Đưa code lên GitHub.
2. Truy cập **Settings** > **Pages**.
3. Chọn **GitHub Actions** làm source.
4. Mỗi khi bạn `git push`, code sẽ tự động được inject secrets và deploy lên web.

## Cách chạy Local để Test
Vì code hiện tại sử dụng placeholders, bạn cần tạo một file `js/firebase-config-local.js` (không push lên git) hoặc tạm thời điền key thật vào `js/firebase-config.js` để test local. Đừng quên revert lại placeholders trước khi push!
