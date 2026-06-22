# Tài liệu Kiến trúc Front-end — TNTT Manager

> **Dự án:** Hệ thống Quản lý Xứ đoàn Thiếu Nhi Thánh Thể Chợ Quán  
> **Stack:** React 19 · Vite 5 · TailwindCSS v4 · React Router DOM v7 · Axios  
> **Tác giả:** Nguyễn Anh Khoa  
> **Mục đích tài liệu:** Giải thích kiến trúc, tư duy thiết kế, và chuẩn bị phỏng vấn

---

## Mục lục

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Giải thích chi tiết từng thành phần](#2-giải-thích-chi-tiết-từng-thành-phần)
   - 2.1 [axiosClient.js — Networking Layer](#21-axiosclientjs--networking-layer)
   - 2.2 [AuthContext.jsx — Global State Management](#22-authcontextjsx--global-state-management)
   - 2.3 [ProtectedRoute.jsx — Route Guard](#23-protectedroutejsx--route-guard)
   - 2.4 [MainLayout.jsx — UI Shell Structure](#24-mainlayoutjsx--ui-shell-structure)
   - 2.5 [Login.jsx — Authentication View](#25-loginjsx--authentication-view)
   - 2.6 [Attendance.jsx — Weekly Attendance Grid](#26-attendancejsx--weekly-attendance-grid)
   - 2.7 [Students.jsx — Search & Detail Ledger](#27-studentsjsx--search--detail-ledger)
   - 2.8 [StudentProgress.jsx — Gradebook & Scholastic Validation](#28-studentprogressjsx--gradebook--scholastic-validation)
3. [Bộ câu hỏi phỏng vấn bỏ túi](#3-bộ-câu-hỏi-phỏng-vấn-bỏ-túi)

---

## 1. Tổng quan kiến trúc

### 1.1 Mô hình Single Page Application (SPA)

Ứng dụng này được xây dựng theo mô hình **SPA (Single Page Application)** — trình duyệt chỉ tải HTML một lần duy nhất khi mở ứng dụng. Mọi điều hướng, render UI, và lấy dữ liệu sau đó đều diễn ra **trong bộ nhớ của trình duyệt**, không cần reload trang.

#### So sánh SPA với Web truyền thống (Server-side Rendering)

| Tiêu chí | Web truyền thống (SSR) | SPA (React) |
|---|---|---|
| Mỗi lần chuyển trang | Server trả về toàn bộ HTML mới | JavaScript render UI mới, không tải lại |
| Lượng dữ liệu trao đổi | Toàn bộ trang HTML (nặng) | Chỉ dữ liệu JSON thuần (nhẹ) |
| Trải nghiệm người dùng | Nhấp nháy / trắng trang giữa các trang | Mượt mà, cảm giác như app native |
| Phân tách vai trò | Server làm cả UI lẫn logic | Backend chỉ cấp API; Frontend tự xử lý UI |
| Phù hợp với | Website nội dung, blog, thương mại điện tử | Dashboard, công cụ quản lý, ứng dụng nội bộ |

Dự án TNTT Manager là công cụ quản lý nội bộ dùng hàng ngày bởi Huynh Trưởng — SPA là lựa chọn tối ưu vì ưu tiên tốc độ tương tác và trải nghiệm mượt mà hơn SEO hay lần tải đầu tiên.

---

### 1.2 Sơ đồ luồng dữ liệu (Data Flow Diagram)

```
┌──────────────────────────────────────────────────────────────────────┐
│                          TRÌNH DUYỆT (Browser)                        │
│                                                                        │
│  ┌─────────────┐    navigate    ┌──────────────────────────────────┐  │
│  │  URL / Link  │ ────────────► │  React Router DOM v7             │  │
│  └─────────────┘                │  (Client-side Routing)           │  │
│                                 └────────────┬─────────────────────┘  │
│                                              │ render                  │
│                                              ▼                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                    React Component Tree                           │ │
│  │                                                                   │ │
│  │  AuthContext (Global State: user, isAuthenticated)                │ │
│  │    └── ProtectedRoute (Route Guard: chặn nếu chưa login)         │ │
│  │          └── MainLayout (Shell: Sidebar + Navbar + Outlet)        │ │
│  │                └── [Page Component] (Attendance / Students / ...) │ │
│  │                        │                                          │ │
│  │                        │ gọi axiosClient.get/post/put             │ │
│  └────────────────────────┼──────────────────────────────────────── ┘ │
│                           │                                            │
└───────────────────────────┼────────────────────────────────────────── ┘
                            │
              ┌─────────────▼─────────────────┐
              │       axiosClient.js           │
              │  (Axios Instance + Interceptor)│
              │                               │
              │  1. Đọc token từ localStorage  │
              │  2. Gắn Authorization header   │
              │  3. Gửi HTTPS request          │
              └─────────────┬─────────────────┘
                            │  HTTP/JSON
                            ▼
              ┌─────────────────────────────────┐
              │    Spring Boot Backend (8080)    │
              │                                 │
              │  SecurityFilter → @PreAuthorize  │
              │  Controller → Service → JPA      │
              │  → PostgreSQL Database           │
              └─────────────────────────────────┘
```

**Giải thích luồng đi của một request điển hình:**

1. Huynh Trưởng click "Bắt đầu điểm danh" trong `Attendance.jsx`
2. Component gọi `axiosClient.post('/attendance/session', payload)`
3. **Request Interceptor** của Axios tự động đọc `localStorage.getItem('accessToken')` và gắn vào header: `Authorization: Bearer eyJhbGci...`
4. Request bay đến `POST http://localhost:8080/api/v1/attendance/session`
5. `JwtAuthenticationFilter` của Spring Boot giải mã token, xác nhận danh tính
6. `@PreAuthorize` kiểm tra quyền (GROUP_LEADER trở lên mới được tạo buổi)
7. Controller xử lý, lưu DB, trả về `AttendanceSessionResponseDTO` (JSON)
8. Axios nhận response, trả về `data` cho component
9. Component cập nhật state → React re-render UI

---

### 1.3 Phân tầng kiến trúc Front-end (Layered Architecture)

```
┌─────────────────────────────────────────────┐
│           PRESENTATION LAYER                 │
│  pages/: Login, Dashboard, Attendance,       │
│           Students, StudentProgress          │
│  components/: MainLayout, Toast, ...         │
├─────────────────────────────────────────────┤
│           STATE MANAGEMENT LAYER             │
│  context/AuthContext.jsx                     │
│  (useState, useEffect, Context API)          │
├─────────────────────────────────────────────┤
│           ROUTING LAYER                      │
│  App.jsx + react-router-dom v7               │
│  components/ProtectedRoute.jsx               │
├─────────────────────────────────────────────┤
│           NETWORKING LAYER                   │
│  api/axiosClient.js                          │
│  (Axios instance + request interceptor)      │
└─────────────────────────────────────────────┘
```

Mỗi tầng có **một trách nhiệm duy nhất** — đây là nguyên tắc **Separation of Concerns (SoC)**, giúp code dễ bảo trì, dễ test, và dễ mở rộng.

---

## 2. Giải thích chi tiết từng thành phần

---

### 2.1 `axiosClient.js` — Networking Layer

#### Vấn đề cần giải quyết

Trong một ứng dụng có JWT, mọi API call (trừ login) đều cần header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

Nếu viết thủ công trong mỗi component, ta sẽ có code lặp khắp nơi và dễ quên. Đây là **Boilerplate Code** cần được trừu tượng hóa (abstracted).

#### Giải pháp: Axios Instance + Request Interceptor

```javascript
// src/api/axiosClient.js
import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosClient;
```

#### Phân tích tư duy thiết kế

**`axios.create()`** tạo ra một **instance riêng** — không phải Axios mặc định toàn cục. Điều này cho phép mỗi dự án cấu hình `baseURL`, `timeout`, header mặc định riêng mà không ảnh hưởng lẫn nhau.

**`interceptors.request.use()`** là cơ chế **Middleware** của Axios. Trước khi mọi request được gửi đi, hàm callback này được gọi để **biến đổi (mutate) config**. Việc đọc token từ `localStorage` ở đây thay vì lúc khởi tạo là quan trọng — vì token có thể chưa tồn tại khi app khởi động (người dùng chưa đăng nhập), nhưng luôn tồn tại tại thời điểm một request được gửi (nếu đã qua ProtectedRoute).

**Điểm mấu chốt khi phỏng vấn:** File này là **Single Source of Truth** cho mọi HTTP communication trong ứng dụng. Mọi component chỉ cần `import axiosClient` và gọi `.get()`, `.post()`, `.put()` — không cần quan tâm đến auth header.

---

### 2.2 `AuthContext.jsx` — Global State Management

#### Vấn đề cần giải quyết

Thông tin đăng nhập (`user`, `isAuthenticated`) cần được dùng ở nhiều nơi: `ProtectedRoute` kiểm tra, `MainLayout` hiển thị tên, `Login` sau khi thành công. Truyền props qua nhiều tầng component là **Prop Drilling** — cực kỳ khó bảo trì.

#### Giải pháp: React Context API

```
AuthContext (nguồn sự thật duy nhất - Single Source of Truth)
     │
     ├── ProtectedRoute.jsx  →  đọc isAuthenticated
     ├── MainLayout.jsx      →  đọc user.username
     └── Login.jsx           →  gọi hàm login()
```

#### Các cơ chế quan trọng

**1. Giải mã JWT không cần thư viện (Manual JWT Decode)**

```javascript
function decodeJwt(token) {
  const payload = token.split('.')[1];          // Lấy phần giữa (payload)
  const decoded = atob(payload);                // Base64 decode
  return JSON.parse(decoded);                   // Parse thành Object
}
```

JWT có cấu trúc `header.payload.signature`. Phần `payload` chứa `sub` (username), `exp` (thời gian hết hạn) ở dạng Base64. Ta decode để đọc thông tin người dùng mà không cần gọi thêm API `/me`.

**2. Kiểm tra token hết hạn**

```javascript
function isTokenValid(token) {
  try {
    const { exp } = decodeJwt(token);
    return exp * 1000 > Date.now();  // exp là Unix timestamp (giây), Date.now() là millisecond
  } catch {
    return false;
  }
}
```

**3. Auto-login Persistence (Phục hồi phiên đăng nhập)**

```javascript
useEffect(() => {
  const token = localStorage.getItem('accessToken');
  if (token && isTokenValid(token)) {
    const decoded = decodeJwt(token);
    setUser({ username: decoded.sub });
    setIsAuthenticated(true);
  }
}, []);   // [] = chỉ chạy một lần khi app khởi động
```

Khi người dùng **F5 (refresh)** trình duyệt, toàn bộ state React bị reset. Không có cơ chế này, người dùng phải login lại mỗi lần refresh. `useEffect` với dependency rỗng chạy **một lần duy nhất** sau lần render đầu tiên — thời điểm lý tưởng để đọc localStorage và phục hồi trạng thái.

**Điểm mấu chốt khi phỏng vấn:** Đây là pattern **Session Hydration** — "bơm nước" lại trạng thái phiên từ storage vào bộ nhớ React sau mỗi lần trang được load.

---

### 2.3 `ProtectedRoute.jsx` — Route Guard

#### Vấn đề cần giải quyết

Nếu người dùng gõ thẳng `http://localhost:5173/attendance` vào thanh địa chỉ, React Router sẽ render ngay trang Attendance mà **không kiểm tra đăng nhập**. Đây là lỗ hổng bảo mật UI nghiêm trọng.

#### Giải pháp: Wrapper Component (Higher-Order Pattern)

```jsx
// src/components/ProtectedRoute.jsx
export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
```

#### Cách sử dụng trong App.jsx

```jsx
<Route
  path="/"
  element={
    <ProtectedRoute>      {/* Lớp bảo vệ */}
      <MainLayout />      {/* Nội dung được bảo vệ */}
    </ProtectedRoute>
  }
>
  <Route index element={<Dashboard />} />
  <Route path="attendance" element={<Attendance />} />
</Route>
```

#### Phân tích tư duy thiết kế

**`<Navigate replace />`** thực hiện **redirect** về `/login`. Prop `replace` thay thế entry hiện tại trong browser history stack thay vì push — tránh trường hợp người dùng nhấn nút Back lại trang bị chặn.

**Tính trừu tượng:** Bằng cách bọc tất cả route nội bộ trong một `ProtectedRoute` duy nhất (ở level `MainLayout`), mọi trang con tự động được bảo vệ — không cần kiểm tra riêng lẻ từng route.

**Lưu ý bảo mật quan trọng:** `ProtectedRoute` chỉ bảo vệ **UI**. Bảo mật thật sự vẫn nằm ở **Backend** — `JwtAuthenticationFilter` và `@PreAuthorize` của Spring Security. Ngay cả khi ai đó bypass được ProtectedRoute, mọi API call vẫn sẽ bị từ chối `403 Forbidden`.

---

### 2.4 `MainLayout.jsx` — UI Shell Structure

#### Khái niệm "Shell Architecture"

`MainLayout` là **Shell** — khung chứa bất biến của toàn bộ giao diện sau khi đăng nhập. Sidebar và Navbar luôn cố định; chỉ có vùng nội dung giữa thay đổi theo route.

```
┌──────────────────────────────────────────────┐
│  NAVBAR (fixed top: user info + logout)       │
├──────────┬───────────────────────────────────┤
│          │                                   │
│ SIDEBAR  │         <Outlet />                │
│ (fixed   │    (vùng render trang con)        │
│  left)   │                                   │
│          │                                   │
└──────────┴───────────────────────────────────┘
```

#### Cơ chế `<Outlet />` của React Router

`<Outlet />` là **slot** — vị trí placeholder mà React Router dùng để render component tương ứng với route con đang active. Ví dụ:

- URL `/attendance` → `<Outlet />` render `<Attendance />`
- URL `/students` → `<Outlet />` render `<Students />`

Sidebar và Navbar **không bị unmount** khi chuyển trang — chỉ nội dung trong `<Outlet />` thay đổi. Đây là lý do chuyển trang cảm giác tức thì, mượt mà.

#### NavLink và Active State

```jsx
<NavLink
  to="/attendance"
  className={({ isActive }) =>
    isActive ? 'bg-red-50 text-red-700' : 'text-gray-600 hover:bg-gray-50'
  }
>
  {({ isActive }) => (
    <>
      <ClipboardCheck className={isActive ? 'text-red-600' : 'text-gray-400'} />
      Điểm Danh
    </>
  )}
</NavLink>
```

`NavLink` của React Router tự động nhận biết route nào đang active và inject `isActive` vào render function. Điều này loại bỏ việc phải tự so sánh `window.location.pathname` thủ công.

---

### 2.5 `Login.jsx` — Authentication View

#### Luồng xác thực đầy đủ

```
[User nhập username + password]
         │
         ▼
[POST /api/v1/auth/login]
         │
    ┌────┴────┐
    │ Success  │ ──► nhận { accessToken }
    │ 200 OK   │     → lưu vào localStorage
    └─────────┘     → gọi login(token) của AuthContext
                    → AuthContext set isAuthenticated = true
                    → navigate('/') — chuyển về Dashboard
         │
    ┌────┴────┐
    │ Failure  │ ──► 401 Unauthorized
    │ Error    │     → hiển thị error message
    └─────────┘     → không lưu gì cả
```

#### Chi tiết xử lý UX

**Loading State:** Button đổi thành spinner khi đang gửi request — tránh double-submit nếu người dùng click nhiều lần.

**Error Handling:** `catch` block bắt cả lỗi mạng lẫn lỗi 4xx. Thông báo lỗi hiển thị dưới form và **tự xóa khi người dùng bắt đầu gõ** — tránh làm rối mắt khi người dùng đang sửa thông tin.

**Password Toggle:** Ô password có nút ẩn/hiện mật khẩu bằng cách đổi `type="password"` ↔ `type="text"`. Đây là UX pattern phổ biến giúp người dùng kiểm tra lỗi gõ.

**Thiết kế giao diện:** Split-screen — nửa trái là brand panel màu đỏ đậm (màu TNTT), nửa phải là form trắng. Trên mobile, panel trái ẩn đi để ưu tiên form. Đây là pattern phổ biến trong các hệ thống quản lý (admin dashboard).

---

### 2.6 `Attendance.jsx` — Weekly Attendance Grid

Đây là trang phức tạp nhất trong ứng dụng với nhiều kỹ thuật quan trọng.

#### State Machine: 2 Phase

Trang hoạt động theo mô hình **State Machine** với 2 trạng thái rõ ràng:

```
SETUP Phase                          MARKING Phase
─────────────────                    ─────────────────────────────
[Chọn năm học]                       [Bảng danh sách thiếu nhi]
[Chọn lớp học]         ────────►     [Nút 3 trạng thái mỗi dòng]
[Chọn ngày]                          [Ô ghi chú có điều kiện]
[Bắt đầu điểm danh]                  [Nút Nộp bảng]
```

Việc tách thành 2 phase rõ ràng thay vì hiển thị mọi thứ cùng lúc giúp Huynh Trưởng không bị choáng ngợp và giảm lỗi thao tác.

#### Tối ưu hóa khởi tạo: `Promise.all`

```javascript
const [sessionRes, membersRes] = await Promise.all([
  axiosClient.post('/attendance/session', { classroomId, sessionDate, description }),
  axiosClient.get('/members', { params: { status: 'ACTIVE', size: 500 } }),
]);
```

**Vấn đề nếu gọi tuần tự:**
```
POST /session  →  đợi 300ms  →  GET /members  →  đợi 200ms  →  Tổng: 500ms
```

**Với `Promise.all` (song song):**
```
POST /session  ─────────► 300ms ┐
GET /members   ─────────► 200ms ┘  →  Chỉ đợi max(300, 200) = 300ms
```

Giảm thời gian chờ khi khởi tạo buổi điểm danh từ ~500ms xuống còn ~300ms.

#### Tối ưu hóa nộp bảng: Bulk Submit Pattern

```javascript
const records = members.map((m) => ({
  studentId:  m.id,
  status:     attendance[m.id]?.status ?? 'PRESENT',
  remarks:    attendance[m.id]?.remarks || null,
}));

await axiosClient.post('/attendance/submit', { sessionId, records });
```

**Vấn đề nếu submit từng em một:**
- Lớp 30 em → 30 HTTP requests riêng lẻ
- Mỗi request có overhead: TCP handshake, JWT verify, DB transaction
- Tổng thời gian: 30 × ~100ms = **3 giây**

**Bulk Submit:**
- Gom tất cả thành 1 payload JSON duy nhất
- 1 HTTP request, 1 JWT verify, 1 DB transaction (`saveAll`)
- Tổng thời gian: **~150ms**

Đây là pattern **Batch Processing** — cực kỳ phổ biến trong các hệ thống quản lý trường học, chấm công, kho hàng.

#### Quản lý State điểm danh

```javascript
// Khởi tạo: mặc định tất cả PRESENT
const initial = Object.fromEntries(
  members.map((m) => [m.id, { status: 'PRESENT', remarks: '' }])
);

// Cập nhật một em
function updateStatus(memberId, status) {
  setAttendance((prev) => ({
    ...prev,
    [memberId]: { ...prev[memberId], status },
  }));
}
```

Dùng `Object` với key là `memberId` thay vì `Array` để tra cứu O(1) thay vì O(n). Với 200 thiếu nhi, hiệu năng khác biệt rõ rệt khi click liên tục.

---

### 2.7 `Students.jsx` — Search & Detail Ledger

#### Debounced Search (Tìm kiếm có độ trễ)

```javascript
const debounceRef = useRef(null);

useEffect(() => {
  clearTimeout(debounceRef.current);
  debounceRef.current = setTimeout(() => {
    fetchMembers(keyword, page);
  }, keyword ? 400 : 0);

  return () => clearTimeout(debounceRef.current);
}, [keyword, page]);
```

**Vấn đề nếu không debounce:**
- Người dùng gõ "Nguyen Van An" → 13 ký tự → 13 API calls
- Server xử lý 13 queries đồng thời, responses về không theo thứ tự (race condition)
- UI có thể hiển thị kết quả của từ khóa cũ

**Debounce giải quyết:**
- Mỗi lần gõ → reset timer 400ms
- Chỉ gửi request khi người dùng **dừng gõ** 400ms
- 13 ký tự → 1 API call (ký tự cuối cùng)

`useRef` được dùng thay vì `useState` để lưu timer ID vì ta **không muốn re-render** khi timer thay đổi — đây là chi tiết quan trọng thể hiện hiểu sâu về React.

#### API Composition trong Modal

```javascript
async function openModal(member) {
  setSelectedMember(member);    // Hiển thị modal ngay lập tức (dữ liệu từ list)
  setLoadingSacraments(true);   // Skeleton loading cho section bí tích

  const { data } = await axiosClient.get('/sacraments', {
    params: { studentId: member.id }
  });
  setSacraments(data ?? []);
  setLoadingSacraments(false);
}
```

**Pattern "Progressive Disclosure":** Modal mở ngay lập tức với dữ liệu đã có (tên, ngành, trạng thái từ danh sách), trong khi dữ liệu phụ (bí tích) được tải song song. Người dùng không cảm thấy chờ đợi.

Đây trái ngược với việc chờ TẤT CẢ dữ liệu trước khi hiển thị modal — cách đó khiến UX bị giật.

#### Sacrament Timeline

Danh sách bí tích từ API được **sắp xếp lại theo ngày** trước khi render:

```javascript
const sortedSacraments = [...sacraments].sort(
  (a, b) => new Date(a.receivedDate) - new Date(b.receivedDate)
);
```

Lý do dùng spread `[...sacraments]` trước khi sort: `Array.sort()` **mutate** mảng gốc. Mutating state trực tiếp là lỗi React phổ biến gây bug khó tìm.

#### Server-side Pagination

```javascript
const { data } = await axiosClient.get(endpoint, {
  params: { page, size: PAGE_SIZE }  // PAGE_SIZE = 12
});
setMembers(data.content ?? []);
setTotalPages(data.totalPages ?? 0);
```

Không tải toàn bộ 200+ thiếu nhi về client rồi mới lọc. Server trả về đúng 12 bản ghi cần thiết, kèm metadata phân trang. Khi URL thay đổi `page`, `useEffect` tự động gọi lại API với trang mới.

---

### 2.8 `StudentProgress.jsx` — Gradebook & Scholastic Validation

#### Live Preview: Tính điểm trước khi lưu

```javascript
function calcPreview(catScore, attScore) {
  const avg = parseFloat(catScore) * 0.7 + parseFloat(attScore) * 0.3;
  if (avg >= 8.5) return { performance: 'EXCELLENT', promoted: true,  avg };
  if (avg >= 7.0) return { performance: 'GOOD',      promoted: true,  avg };
  if (avg >= 5.0) return { performance: 'AVERAGE',   promoted: true,  avg };
  return           { performance: 'WEAK',      promoted: false, avg };
}
```

Hàm này chạy **hoàn toàn trong JavaScript**, không gọi API. Mỗi lần Huynh Trưởng sửa điểm, kết quả dự kiến hiển thị ngay lập tức (mờ, màu xám) để họ biết đang "tới gần" kết quả nào. Sau khi lưu, kết quả thật từ server hiển thị đậm, rõ ràng.

Đây là pattern **Optimistic UI** một phần — giảm cảm giác chờ đợi và tăng sự tự tin của người dùng khi thao tác.

#### Evaluate & Fetch Pattern (PUT → GET)

```javascript
async function handleEvaluate() {
  // Bước 1: Lưu lên server (PUT trả về 204 No Content)
  await axiosClient.put('/progress/evaluate', {
    studentId, classroomId, catechismScore, attendanceScore, remarks
  });

  // Bước 2: Lấy kết quả đã xử lý từ server (bao gồm performance, promoted)
  const { data } = await axiosClient.get('/progress', {
    params: { studentId, classroomId }
  });

  // Bước 3: Cập nhật UI với kết quả chính thức
  updateRow(memberId, { result: data, evaluating: false });
}
```

**Tại sao cần GET sau PUT?**

Backend là nơi duy nhất biết **công thức chính xác** (`avg = cat*0.7 + att*0.3`) và ngưỡng xếp loại. Nếu backend thay đổi công thức (ví dụ: thêm điểm hạnh kiểm), frontend không cần sửa code — chỉ cần GET là lấy được kết quả đúng. Đây là nguyên tắc **Single Source of Truth for Business Logic**.

#### Per-row Isolated State

```javascript
// rowStates là object, key = memberId
const [rowStates, setRowStates] = useState({});

function updateRow(memberId, fields) {
  setRowStates((prev) => ({
    ...prev,
    [memberId]: { ...prev[memberId], ...fields },
  }));
}
```

Mỗi dòng thiếu nhi có state độc lập (điểm, ghi chú, đang lưu hay không, kết quả). Khi một dòng đang lưu, các dòng khác vẫn tương tác bình thường. Cách dùng **functional updater** `(prev) => ({ ...prev, ... })` đảm bảo không mất state của các dòng khác khi update đồng thời.

#### Local Filter (Lọc phía client)

```javascript
const filteredMembers = members.filter((m) =>
  m.fullName.toLowerCase().includes(localFilter.toLowerCase()) ||
  (m.saintName ?? '').toLowerCase().includes(localFilter.toLowerCase())
);
```

Vì đã tải toàn bộ danh sách thiếu nhi active (≤500 em) vào memory, việc lọc theo tên diễn ra **tức thì** không cần gọi API. Trường hợp này client-side filter hợp lý hơn server-side vì dữ liệu đã sẵn có.

---

## 3. Bộ câu hỏi phỏng vấn bỏ túi

---

### Câu hỏi 1: "Em quản lý JWT Token trong ứng dụng React như thế nào? Tại sao lưu ở localStorage mà không phải Cookie?"

**Gợi ý trả lời ăn điểm:**

> "Em lưu JWT vào `localStorage` và quản lý việc đính kèm token tập trung ở `axiosClient.js` thông qua `request interceptor`. Cách này đảm bảo mọi API call tự động có token mà không cần viết lặp code trong từng component.
>
> Về việc chọn `localStorage` thay vì `httpOnly Cookie`: trong dự án nội bộ này, em ưu tiên sự đơn giản trong triển khai. Tuy nhiên em biết rằng trên production, `httpOnly Cookie` an toàn hơn vì JavaScript không đọc được — tránh được tấn công **XSS (Cross-Site Scripting)** đánh cắp token. Đổi lại, Cookie phải xử lý thêm **CSRF (Cross-Site Request Forgery)** bằng CSRF token hoặc `SameSite=Strict`.
>
> Dự án cũng có thêm lớp kiểm tra `isTokenValid()` trong `AuthContext` để kiểm tra thời gian hết hạn (`exp`) của token khi người dùng F5 trang, tránh dùng token đã hết hạn."

**Từ khóa cần nhắc:** `localStorage`, `httpOnly Cookie`, `XSS`, `CSRF`, `interceptor`, `exp claim`, `session hydration`.

---

### Câu hỏi 2: "Tại sao em dùng Bulk Submit thay vì submit từng học sinh? Hãy giải thích trade-off."

**Gợi ý trả lời ăn điểm:**

> "Với lớp 30-50 thiếu nhi, nếu submit từng em một, ta cần 30-50 HTTP round-trips riêng lẻ. Mỗi request đều có overhead: TCP connection, JWT verification, database transaction. Tổng thời gian có thể lên đến 3-5 giây — một UX rất tệ.
>
> Với Bulk Submit, em gom tất cả records thành một `Array<AttendanceRecord>` duy nhất trong payload JSON rồi gửi một request. Server nhận, chạy một transaction với `saveAll()`, hoàn thành trong khoảng 150ms.
>
> Trade-off là: nếu có lỗi (ví dụ một record bị validation fail), toàn bộ batch bị rollback. Em xử lý bằng cách validate phía frontend trước khi submit — đảm bảo tất cả trạng thái đã được chọn. Backend cũng thiết kế idempotent: nộp lại sẽ xóa record cũ và lưu record mới, không bị duplicate.
>
> Pattern này em học được từ các hệ thống chấm công, import Excel — đây là cách chuẩn để xử lý bulk operations."

**Từ khóa cần nhắc:** `batch processing`, `HTTP round-trip overhead`, `database transaction`, `idempotency`, `rollback`, `client-side validation`.

---

### Câu hỏi 3: "ProtectedRoute của em hoạt động như thế nào? Nó có thực sự bảo mật không?"

**Gợi ý trả lời ăn điểm:**

> "ProtectedRoute là một wrapper component đọc `isAuthenticated` từ `AuthContext`. Nếu giá trị là `false`, nó render `<Navigate to='/login' replace />` thay vì render `children` — chặn hoàn toàn việc hiển thị trang được bảo vệ.
>
> Tuy nhiên, em nhận thức rõ rằng đây chỉ là **UI-level protection**. Một người dùng kỹ thuật có thể dùng DevTools để sửa state hoặc gọi API bằng cURL với token giả mạo. ProtectedRoute không ngăn được điều này.
>
> Bảo mật thật sự nằm ở **backend**: Spring Security kiểm tra JWT trên mọi request qua `JwtAuthenticationFilter`, và `@PreAuthorize` kiểm tra role trước khi vào controller. Dù bypass được React, mọi request đến server vẫn bị xác thực và phân quyền.
>
> Nguyên tắc em tuân theo là: **'Never trust the client'** — frontend là convenience, backend là enforcement."

**Từ khóa cần nhắc:** `UI-level protection`, `server-side enforcement`, `JWT verification`, `@PreAuthorize`, `defense in depth`, `'Never trust the client'`.

---

### Câu hỏi 4: "Giải thích tại sao em dùng Debounce trong thanh tìm kiếm?"

**Gợi ý trả lời ăn điểm:**

> "Nếu không có debounce, mỗi ký tự người dùng gõ vào sẽ trigger một API call. Gõ 'Nguyen Van An' tạo ra 13 requests gần như đồng thời. Điều này gây 3 vấn đề:
>
> 1. **Server overload:** 13 queries đến database, mỗi queries có thể `LIKE` scan trên toàn bảng.
> 2. **Race condition:** Responses về không theo thứ tự. Kết quả của request thứ 5 có thể về sau request thứ 13, khiến UI hiển thị kết quả sai.
> 3. **Lãng phí tài nguyên:** 12/13 requests là vô ích vì người dùng vẫn đang gõ.
>
> Debounce 400ms nghĩa là: chỉ gửi request sau khi người dùng **dừng gõ** 400 milliseconds. 13 ký tự chỉ tạo ra 1 request duy nhất — request của ký tự cuối cùng.
>
> Em dùng `useRef` để lưu timer ID thay vì `useState` vì cập nhật ref không trigger re-render — đây là chi tiết quan trọng tránh vòng lặp render vô tận."

**Từ khóa cần nhắc:** `debounce`, `race condition`, `useRef vs useState`, `server load`, `input optimization`, `setTimeout cleanup`.

---

### Câu hỏi 5: "Em giải thích Context API vs Redux. Tại sao chọn Context?"

**Gợi ý trả lời ăn điểm:**

> "Redux là giải pháp state management mạnh mẽ với DevTools tốt, middleware hỗ trợ side effects (Redux Thunk, Redux Saga), và phù hợp cho ứng dụng có state rất phức tạp, nhiều module cùng update.
>
> Nhưng dự án này chỉ có một state global thực sự cần share: thông tin đăng nhập (`user`, `isAuthenticated`). Redux sẽ là **over-engineering** — thêm boilerplate (action, reducer, store) mà không mang lại giá trị tương xứng.
>
> React Context API đủ dùng cho use case này: một Provider ở top-level, các consumer dùng `useContext()`. Không cần thư viện bên ngoài, bundle size nhỏ hơn, code đơn giản hơn.
>
> Em theo nguyên tắc: **chọn công cụ phù hợp với vấn đề**, không chọn công cụ phức tạp nhất có thể. Nếu ứng dụng mở rộng với nhiều state phức tạp hơn, em sẽ xem xét Zustand (lightweight) trước khi nghĩ đến Redux."

**Từ khóa cần nhắc:** `over-engineering`, `Context API`, `Redux`, `Zustand`, `bundle size`, `use case`, `right tool for the right job`.

---

## Phụ lục: Cấu trúc file tham khảo nhanh

```
src/
├── api/
│   └── axiosClient.js         ← Axios instance + request interceptor
├── context/
│   └── AuthContext.jsx        ← Global auth state + session hydration
├── components/
│   ├── MainLayout.jsx         ← Shell: Sidebar + Navbar + <Outlet />
│   ├── ProtectedRoute.jsx     ← Route guard: redirect nếu chưa login
│   └── Toast.jsx              ← Notification: success/error, auto-dismiss
└── pages/
    ├── Login.jsx              ← POST /auth/login, lưu token, navigate
    ├── Dashboard.jsx          ← Stat cards placeholder
    ├── Attendance.jsx         ← 2-phase: setup → marking → bulk submit
    ├── Students.jsx           ← Debounced search + pagination + modal
    └── StudentProgress.jsx    ← Live preview + per-row evaluation
```

---

*Tài liệu này được viết để giải thích kiến trúc và tư duy thiết kế, không phải mô tả chức năng đơn thuần. Hiểu được "tại sao" quan trọng hơn biết "cái gì" trong phỏng vấn kỹ thuật.*
