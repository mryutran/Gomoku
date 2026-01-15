# Gomoku Online - Cờ Caro Trực Tuyến

Chào mừng bạn đến với dự án Gomoku Online! Đây là ứng dụng cờ Caro chơi qua mạng sử dụng Firebase Realtime Database.

## Hướng dẫn thiết lập Firebase

Để ứng dụng hoạt động, bạn cần cấu hình dự án Firebase của riêng mình:

### Bước 1: Tạo Dự án Firebase
1. Truy cập [Firebase Console](https://console.firebase.google.com/).
2. Nhấn **Add project**, đặt tên (ví dụ: `Gomoku-Online`) và nhấn **Continue**.
3. (Tùy chọn) Bật/Tắt Google Analytics rồi nhấn **Create project**.

### Bước 2: Tạo Realtime Database
1. Trong menu bên trái, chọn **Build** > **Realtime Database**.
2. Nhấn **Create Database**.
3. Chọn vị trí server (nên chọn **Singapore** - `asia-southeast1` để có tốc độ tốt nhất tại Việt Nam).
4. Chọn **Start in test mode** (để có thể đọc/ghi ngay lập tức) và nhấn **Enable**.

### Bước 3: Lấy Project Settings
1. Nhấn vào biểu tượng ⚙️ (Project settings) ở menu bên trái.
2. Ở phần **Your apps**, nhấn vào biểu tượng Web (`</>`).
3. Đăng ký app với tên bất kỳ.
4. Firebase sẽ cung cấp một đoạn mã `firebaseConfig`. Hãy copy các giá trị này.

### Bước 4: Cập nhật code
Mở file `js/firebase-config.js` và thay thế các giá trị trong biến `firebaseConfig` bằng thông tin bạn vừa copy:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "YOUR_DATABASE_URL", // Chú ý URL phải khớp với region bạn chọn
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "...",
    appId: "..."
};
```

---

## Tự động Deploy lên GitHub Pages

Dự án đã được cấu hình GitHub Actions để tự động deploy:

1. Đưa code của bạn lên một repository trên GitHub.
2. Truy cập **Settings** > **Pages** của repository đó.
3. Ở phần **Build and deployment** > **Source**, chọn **GitHub Actions**.
4. Mỗi khi bạn `git push` lên branch `main`, ứng dụng sẽ tự động được update tại link GitHub Pages của bạn.

## Cách chạy Local để Test
Bạn không thể mở trực tiếp file `index.html`. Hãy dùng:
- **VS Code**: Cài extension "Live Server", chuột phải vào `index.html` chọn **Open with Live Server**.
- **Terminal**: Chạy lệnh `python3 -m http.server 8000` rồi truy cập `http://localhost:8000`.
