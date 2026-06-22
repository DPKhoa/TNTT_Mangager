# TNTT Manager — Hệ thống quản lý Thiếu Nhi Thánh Thể

Ứng dụng full-stack để quản lý **Huynh Trưởng**, **Thiếu Nhi**, **Lớp học**, **Điểm danh**, **Bí Tích** và **Kết quả học tập** trong một đoàn Thiếu Nhi Thánh Thể (Xứ đoàn Cho Quan).

**Backend:** Spring Boot 4.1 + Java 21 + PostgreSQL + JWT  
**Frontend:** React 19 + Vite 5 + TailwindCSS v4

---

## Mục lục

- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cài đặt Backend](#cài-đặt-backend)
- [Cài đặt Frontend](#cài-đặt-frontend)
- [Bảo mật và phân quyền](#bảo-mật-và-phân-quyền)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Sơ đồ luồng xử lý](#sơ-đồ-luồng-xử-lý)
- [Các Entity và quan hệ dữ liệu](#các-entity-và-quan-hệ-dữ-liệu)
- [Danh sách Enum](#danh-sách-enum)
- [API Reference](#api-reference)
- [Cấu hình Database](#cấu-hình-database)
- [Xử lý lỗi toàn cục](#xử-lý-lỗi-toàn-cục)
- [Ghi chú kỹ thuật quan trọng](#ghi-chú-kỹ-thuật-quan-trọng)

---

## Công nghệ sử dụng

### Backend

| Thành phần | Công nghệ |
|---|---|
| Ngôn ngữ | Java 21 |
| Framework | Spring Boot 4.1.0 |
| Bảo mật | Spring Security 6 + JWT (JJWT 0.12.6) |
| ORM | Spring Data JPA + Hibernate |
| Database | PostgreSQL |
| Connection Pool | HikariCP |
| Giảm boilerplate | Lombok |
| Validation | Jakarta Bean Validation |
| Build tool | Maven |

### Frontend

| Thành phần | Công nghệ |
|---|---|
| UI Framework | React 19 |
| Build tool | Vite 5 |
| CSS | TailwindCSS v4 (`@tailwindcss/vite`) |
| Routing | React Router DOM v7 |
| HTTP Client | Axios |
| Icons | Lucide React |
| Auth state | React Context API |

---

## Cài đặt Backend

### Yêu cầu

- Java 21+
- Maven 3.8+
- PostgreSQL 14+

### Bước 1 — Tạo database

Mở psql hoặc pgAdmin và chạy:

```sql
CREATE DATABASE tntt_manager;
\c tntt_manager

-- Bắt buộc: extension tìm kiếm không dấu tiếng Việt
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Nên có: tăng tốc tìm kiếm LIKE với GIN index
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

> **Lưu ý:** Dự án dùng `@Enumerated(EnumType.STRING)` — Hibernate tự tạo cột VARCHAR cho tất cả Enum. Không cần tạo PostgreSQL custom type thủ công.

### Bước 2 — Cấu hình kết nối

Mở `src/main/resources/application.properties` và chỉnh lại:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/tntt_manager
spring.datasource.username=postgres
spring.datasource.password=your_password

app.jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
app.jwt.expiration-ms=86400000
```

> **JWT Secret:** Phải là chuỗi Base64 của ít nhất 32 byte (256-bit). Thay bằng chuỗi ngẫu nhiên của riêng bạn trước khi deploy.

### Bước 3 — Chạy ứng dụng

```bash
mvn spring-boot:run
```

Ứng dụng khởi động tại `http://localhost:8080`.  
Hibernate tự động tạo/cập nhật schema nhờ `ddl-auto=update`.

### Bước 4 — Tạo tài khoản đầu tiên

Vì chưa có user nào trong DB, gọi API tạo user (endpoint này không cần token):

```http
POST http://localhost:8080/api/v1/users
Content-Type: application/json

{
  "username": "admin",
  "password": "123456",
  "role": "ADMIN"
}
```

---

## Cài đặt Frontend

### Yêu cầu

- Node.js 20.17+ (hoặc 22.12+)

> **Lưu ý Node.js:** Vite 5 yêu cầu Node ≥ 18.0. Vite 8 yêu cầu Node ≥ 20.19 — dự án dùng Vite 5 để tương thích rộng hơn.

### Bước 1 — Cài dependencies

```bash
cd tntt-frontend
npm install
```

### Bước 2 — Chạy dev server

```bash
npm run dev
```

Frontend chạy tại `http://localhost:5173`.

### Cấu hình TailwindCSS v4

Dự án dùng plugin Vite thay vì PostCSS plugin (đây là cách tiếp cận chính thức của TailwindCSS v4 với Vite):

```js
// vite.config.js
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
export default { plugins: [tailwindcss(), react()] };
```

```css
/* src/index.css */
@import "tailwindcss";
```

```js
// postcss.config.js — chỉ giữ autoprefixer
export default { plugins: { autoprefixer: {} } };
```

---

## Bảo mật và phân quyền

### Luồng xác thực (JWT)

```
[1] POST /api/v1/auth/login     →  trả về JWT token
[2] Frontend lưu token vào localStorage
[3] Mọi request sau:            →  Axios interceptor tự gắn "Authorization: Bearer <token>"
[4] JwtAuthenticationFilter     →  giải mã token, set SecurityContext
[5] @PreAuthorize               →  kiểm tra role trước khi vào Controller
```

### Luồng React Auth

```
[Khởi động app]  →  AuthContext đọc token từ localStorage
                 →  isTokenValid() kiểm tra exp
                 →  nếu hợp lệ: tự động đăng nhập
                 →  nếu hết hạn: logout(), chuyển về /login

[ProtectedRoute] →  nếu !isAuthenticated → <Navigate to="/login" />
                 →  nếu isAuthenticated  → hiển thị trang
```

### Ma trận phân quyền

| Endpoint | ADMIN | EXEC | BRANCH | CLASS | GROUP | JUNIOR |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `POST /auth/login` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /users` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /leaders`, `GET /members`, `GET /classrooms` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /sacraments`, `GET /progress` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST/PUT/DELETE /leaders` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `POST /classrooms`, `/enroll` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `POST /attendance/session`, `/submit` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `PUT /progress/evaluate` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

> **EXEC** = `EXECUTIVE_COMMITTEE` · **BRANCH** = `BRANCH_LEADER` · **CLASS** = `CLASS_LEADER` · **GROUP** = `GROUP_LEADER` · **JUNIOR** = `JUNIOR_LEADER`

Vi phạm quyền trả về `403 Forbidden`. Không có token cũng trả về `403 Forbidden`.

### Các thành phần Security (Backend)

| Class | Vai trò |
|---|---|
| `JwtTokenProvider` | Tạo / giải mã / kiểm tra JWT token |
| `JwtAuthenticationFilter` | Filter chạy trên mọi request, đọc token từ header |
| `UserDetailsServiceImpl` | Load user từ DB, gán `ROLE_` prefix cho Spring Security |
| `SecurityConfig` | Cấu hình tổng thể, bật `@EnableMethodSecurity`, cấu hình CORS |

### CORS

`SecurityConfig` cho phép các origin sau:

```
http://localhost:3000   (Create React App)
http://localhost:5173   (Vite)
```

---

## Cấu trúc dự án

### Backend

```
src/main/java/com/example/tntt_Manager/
│
├── config/
│   └── SecurityConfig.java             # Spring Security + JWT filter + CORS
│
├── security/
│   ├── JwtTokenProvider.java           # Tạo, giải mã, kiểm tra JWT
│   ├── JwtAuthenticationFilter.java    # Filter xác thực JWT mỗi request
│   └── UserDetailsServiceImpl.java     # Load user từ DB cho Spring Security
│
├── entity/
│   ├── Leader.java                     # Huynh Trưởng
│   ├── Member.java                     # Thiếu Nhi
│   ├── Guardian.java                   # Phụ huynh / người giám hộ
│   ├── User.java                       # Tài khoản đăng nhập
│   ├── Classroom.java                  # Lớp học
│   ├── ClassEnrollment.java            # Phân lớp thiếu nhi
│   ├── ClassAssignment.java            # Phân công huynh trưởng
│   ├── AttendanceSession.java          # Buổi điểm danh
│   ├── AttendanceRecord.java           # Chi tiết điểm danh từng em
│   ├── StudentProgress.java            # Kết quả học tập / lên lớp
│   ├── Sacrament.java                  # Bí tích đã lãnh nhận
│   └── enums/
│       ├── SystemRole.java
│       ├── Gender.java
│       ├── Branch.java
│       ├── LeaderLevel.java
│       ├── LeaderPosition.java
│       ├── LeaderStatus.java
│       ├── MemberOrigin.java
│       ├── MemberStatus.java
│       ├── RelationshipType.java
│       ├── AssignmentRole.java
│       ├── AttendanceStatus.java
│       ├── AcademicPerformance.java
│       └── SacramentType.java
│
├── repository/
│   ├── UserRepository.java
│   ├── LeaderRepository.java
│   ├── MemberRepository.java
│   ├── ClassroomRepository.java
│   ├── ClassEnrollmentRepository.java
│   ├── ClassAssignmentRepository.java
│   ├── AttendanceSessionRepository.java
│   ├── AttendanceRecordRepository.java
│   ├── StudentProgressRepository.java
│   └── SacramentRepository.java
│
├── dto/
│   ├── request/
│   │   ├── LoginRequestDTO.java
│   │   ├── CreateUserRequestDTO.java
│   │   ├── LeaderRequestDTO.java
│   │   ├── MemberRequestDTO.java
│   │   ├── GuardianRequestDTO.java
│   │   ├── ClassroomRequestDTO.java
│   │   ├── EnrollmentRequestDTO.java
│   │   ├── AttendanceSessionRequestDTO.java
│   │   ├── AttendanceRecordSubmitDTO.java
│   │   ├── BulkAttendanceSubmitDTO.java
│   │   ├── EvaluateRequestDTO.java
│   │   └── SacramentRequestDTO.java
│   └── response/
│       ├── AuthResponseDTO.java
│       ├── UserResponseDTO.java
│       ├── LeaderResponseDTO.java
│       ├── MemberResponseDTO.java
│       ├── GuardianResponseDTO.java
│       ├── ClassroomResponseDTO.java
│       ├── ClassEnrollmentResponseDTO.java
│       ├── AttendanceSessionResponseDTO.java
│       ├── AttendanceReportResponseDTO.java
│       ├── StudentProgressResponseDTO.java
│       └── SacramentResponseDTO.java
│
├── service/
│   ├── UserService.java
│   ├── LeaderService.java
│   ├── MemberService.java
│   ├── ClassroomService.java
│   ├── AttendanceService.java
│   ├── StudentProgressService.java
│   └── impl/
│       ├── UserServiceImpl.java
│       ├── LeaderServiceImpl.java
│       ├── MemberServiceImpl.java
│       ├── ClassroomServiceImpl.java
│       ├── AttendanceServiceImpl.java
│       └── StudentProgressServiceImpl.java
│
├── controller/
│   ├── AuthController.java
│   ├── UserController.java
│   ├── LeaderController.java
│   ├── MemberController.java
│   ├── ClassroomController.java
│   ├── AttendanceController.java
│   ├── StudentProgressController.java
│   └── SacramentController.java
│
└── exception/
    ├── ResourceNotFoundException.java
    ├── ErrorResponse.java
    └── GlobalExceptionHandler.java
```

### Frontend

```
tntt-frontend/
├── public/
├── src/
│   ├── api/
│   │   └── axiosClient.js          # Axios instance + JWT interceptor
│   ├── context/
│   │   └── AuthContext.jsx         # Global auth state (login/logout/isAuthenticated)
│   ├── components/
│   │   ├── MainLayout.jsx          # Sidebar + Topbar + <Outlet />
│   │   ├── ProtectedRoute.jsx      # Redirect về /login nếu chưa đăng nhập
│   │   └── Toast.jsx               # Toast notification (success/error, auto-dismiss)
│   ├── pages/
│   │   ├── Login.jsx               # Màn hình đăng nhập (split-screen)
│   │   ├── Dashboard.jsx           # Trang chủ (stat cards placeholder)
│   │   ├── Attendance.jsx          # Điểm danh (chọn lớp → bảng thiếu nhi → nộp)
│   │   ├── Students.jsx            # Danh sách thiếu nhi (tìm kiếm + modal bí tích)
│   │   └── StudentProgress.jsx     # Nhập điểm cuối năm (live preview + lưu)
│   ├── App.jsx                     # Cấu hình routing
│   ├── main.jsx                    # Entry point (bọc AuthProvider)
│   └── index.css                   # @import "tailwindcss"
├── vite.config.js
├── postcss.config.js
└── package.json
```

---

## Sơ đồ luồng xử lý

### Luồng request thông thường (có token)

```
[Client gửi HTTP Request + Authorization: Bearer <token>]
         │
         ▼
  ┌──────────────────────────┐
  │  JwtAuthenticationFilter │  Giải mã token → set SecurityContext
  └────────────┬─────────────┘
               │
               ▼
  ┌──────────────────────────┐
  │  @PreAuthorize check     │  Kiểm tra role → 403 nếu không đủ quyền
  └────────────┬─────────────┘
               │
               ▼
  ┌──────────────────────────┐
  │       Controller         │  Validate đầu vào (@Valid), gọi Service
  └────────────┬─────────────┘
               │
               ▼
  ┌──────────────────────────┐
  │        Service           │  Xử lý logic nghiệp vụ, map Entity ↔ DTO
  └────────────┬─────────────┘
               │
               ▼
  ┌──────────────────────────┐
  │       Repository         │  Truy vấn PostgreSQL qua Spring Data JPA
  └────────────┬─────────────┘
               │
               ▼ (chiều ngược lại)
  Entity → DTO → JSON → [Client nhận HTTP Response]
```

### Luồng Điểm Danh (Frontend)

```
Chọn năm học → tải lớp học (GET /classrooms?year=...)
      │
      ▼
Chọn lớp + ngày → [Bắt đầu điểm danh]
      │
      ▼  (song song - Promise.all)
POST /attendance/session  +  GET /members?status=ACTIVE&size=500
      │
      ▼
Bảng điểm danh: click PRESENT / EXCUSED_ABSENCE / UNEXCUSED_ABSENCE
      │
      ▼
[Nộp bảng] → POST /attendance/submit → 204 No Content
```

### Luồng Nhập Điểm (Frontend)

```
Chọn lớp → tải danh sách thiếu nhi
      │
      ▼
Nhập điểm Giáo lý (0–10) + Chuyên cần (0–10)
      │
      ▼  (live preview - tính toán trong JS)
TB = Giáo lý × 0.7 + Chuyên cần × 0.3  →  hiển thị dự kiến (mờ)
      │
      ▼
[Lưu điểm] → PUT /progress/evaluate → 204
           → GET /progress?studentId=&classroomId=
           → hiển thị kết quả chính thức: badge xếp loại + lên/ở lại lớp
```

---

## Các Entity và quan hệ dữ liệu

### User (Tài khoản) — bảng `users`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | UUID | Khóa chính, tự sinh |
| `username` | VARCHAR | Tên đăng nhập, duy nhất |
| `password_hash` | VARCHAR | Mật khẩu đã BCrypt hash |
| `role` | VARCHAR | Quyền hệ thống (`SystemRole`) |
| `huynh_truong_id` | UUID (FK) | Liên kết với `leader`, có thể null |

### Leader (Huynh Trưởng) — bảng `leader`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | UUID | Khóa chính |
| `leader_code` | VARCHAR | Mã huynh trưởng, duy nhất |
| `christian_name` | VARCHAR | Tên thánh (nullable) |
| `full_name` | VARCHAR | Họ và tên |
| `date_of_birth` | DATE | Ngày sinh |
| `gender` | VARCHAR | `MALE` / `FEMALE` |
| `level` | VARCHAR | Cấp bậc huynh trưởng |
| `status` | VARCHAR | Trạng thái hoạt động |
| `position` | VARCHAR | Chức vụ trong đoàn |

### Member (Thiếu Nhi) — bảng `members`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | UUID | Khóa chính |
| `ho_va_ten` | VARCHAR | Họ và tên |
| `ten_thanh` | VARCHAR | Tên thánh (nullable) |
| `ngay_sinh` | DATE | Ngày sinh |
| `gioi_tinh` | VARCHAR | Giới tính |
| `nganh` | VARCHAR | Ngành sinh hoạt (`Branch`) |
| `trang_thai` | VARCHAR | Trạng thái (`MemberStatus`) |
| `nguon_goc` | VARCHAR | Nguồn gốc gia nhập |
| `ngay_gia_nhap` | DATE | Ngày gia nhập |

### Sacrament (Bí Tích) — bảng `bi_tich`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | UUID | Khóa chính |
| `thieu_nhi_id` | UUID (FK) | Thiếu nhi nhận bí tích |
| `loai_bi_tich` | VARCHAR | Loại bí tích (`SacramentType`) |
| `ngay_nhan` | DATE | Ngày nhận |
| `ten_thanh_bo_mang` | VARCHAR | Bổn mạng (nullable) |
| `linh_muc_ban` | VARCHAR | Linh mục ban phép (nullable) |
| `noi_nhan` | VARCHAR | Nơi nhận (nullable) |

### StudentProgress (Kết quả học tập) — bảng `ket_qua_hoc_tap`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | UUID | Khóa chính |
| `thieu_nhi_id` | UUID (FK) | Thiếu nhi |
| `lop_hoc_id` | UUID (FK) | Lớp học |
| `diem_giao_ly` | DECIMAL(5,2) | Điểm giáo lý (0–10) |
| `diem_chuyen_can` | DECIMAL(5,2) | Điểm chuyên cần (0–10) |
| `hoc_luc` | VARCHAR | Học lực (`AcademicPerformance`) |
| `is_len_lop` | BOOLEAN | Được lên lớp hay không |
| `ghi_chu` | TEXT | Nhận xét của huynh trưởng |

### Quan hệ giữa các Entity

```
User ──(1:1)──► Leader
                  │
                  └──(1:N)──► ClassAssignment ◄──(N:1)── Classroom
                                                               │
Member ──(1:N)──► Guardian           ClassEnrollment ◄──(N:1)─┘
  │                                       ▲
  ├──(1:N)──► ClassEnrollment ────────────┘
  │
  ├──(1:N)──► AttendanceRecord ◄──(N:1)── AttendanceSession ──(N:1)──► Classroom
  │
  ├──(1:N)──► StudentProgress ──(N:1)──► Classroom
  │
  └──(1:N)──► Sacrament
```

---

## Danh sách Enum

### SystemRole (Quyền tài khoản)

| Giá trị | Ý nghĩa | Spring Security role |
|---|---|---|
| `ADMIN` | Quản trị hệ thống | `ROLE_ADMIN` |
| `EXECUTIVE_COMMITTEE` | Ban điều hành xứ đoàn | `ROLE_EXECUTIVE_COMMITTEE` |
| `BRANCH_LEADER` | Trưởng ngành | `ROLE_BRANCH_LEADER` |
| `CLASS_LEADER` | Huynh trưởng phụ trách lớp | `ROLE_CLASS_LEADER` |
| `GROUP_LEADER` | Huynh trưởng thông thường | `ROLE_GROUP_LEADER` |
| `JUNIOR_LEADER` | Dự trưởng | `ROLE_JUNIOR_LEADER` |

### Branch (Ngành Thiếu Nhi)

| Giá trị | Ý nghĩa |
|---|---|
| `INFANT` | Ấu nhi |
| `JUNIOR` | Thiếu nhi |
| `SENIOR` | Nghĩa sĩ |
| `ADVENTURER` | Hiệp sĩ |
| `SOLDIER` | Chiến sĩ |
| `JUNIOR_LEADER` | Dự trưởng |

### AcademicPerformance (Học lực)

| Giá trị | Ý nghĩa | Ngưỡng điểm TB | Lên lớp |
|---|---|---|:---:|
| `EXCELLENT` | Xuất sắc | ≥ 8.5 | ✅ |
| `GOOD` | Giỏi | ≥ 7.0 | ✅ |
| `AVERAGE` | Khá | ≥ 5.0 | ✅ |
| `WEAK` | Yếu | < 5.0 | ❌ |

> **Công thức:** `TB = Giáo lý × 0.7 + Chuyên cần × 0.3`

### SacramentType (Loại Bí Tích)

| Giá trị | Ý nghĩa |
|---|---|
| `BAPTISM` | Rửa Tội |
| `FIRST_COMMUNION` | Rước Lễ Lần Đầu |
| `SOLEMN_COMMUNION` | Rước Lễ Trọng Thể (Bao Đồng) |
| `CONFIRMATION` | Thêm Sức |

### AttendanceStatus (Trạng thái điểm danh)

| Giá trị | Ý nghĩa |
|---|---|
| `PRESENT` | Có mặt |
| `EXCUSED_ABSENCE` | Vắng có phép |
| `UNEXCUSED_ABSENCE` | Vắng không phép |

### LeaderLevel (Cấp bậc Huynh Trưởng)

| Giá trị | Ý nghĩa |
|---|---|
| `PROBATIONARY_LEADER` | Huynh trưởng tập sự |
| `CERTIFIED_LEADER` | Huynh trưởng chính thức |

### LeaderPosition (Chức vụ Huynh Trưởng)

| Giá trị | Ý nghĩa |
|---|---|
| `PARISH_CHIEF` | Trưởng ban giáo xứ |
| `PARISH_DEPUTY_EXTERNAL` | Phó ban ngoại vụ |
| `PARISH_DEPUTY_INTERNAL` | Phó ban nội vụ |
| `SECRETARY` | Thư ký |
| `TREASURER` | Thủ quỹ |
| `SPECIALIST` | Chuyên viên |
| `BRANCH_LEADER` | Trưởng ngành |
| `BRANCH_DEPUTY` | Phó ngành |
| `CLASS_LEADER` | Trưởng lớp |
| `ASSISTANT_SUPERVISOR` | Trợ tá giám sát |
| `ASSISTANT_AIDE` | Trợ tá phụ |
| `GROUP_LEADER` | Trưởng nhóm |

### RelationshipType (Quan hệ Phụ huynh)

| Giá trị | Ý nghĩa |
|---|---|
| `FATHER` | Bố |
| `MOTHER` | Mẹ |
| `GRANDPARENT` | Ông / Bà |
| `OTHER_GUARDIAN` | Người giám hộ khác |

### AssignmentRole (Vai trò HT trong lớp)

| Giá trị | Ý nghĩa |
|---|---|
| `MAIN_TEACHER` | Trưởng lớp |
| `ASSISTANT_TEACHER` | Phó lớp / Phụ tá |

---

## API Reference

Base URL: `http://localhost:8080`

> Tất cả API (trừ `POST /auth/login` và `POST /users`) đều yêu cầu header:
> ```
> Authorization: Bearer <jwt_token>
> ```

---

### Xác thực — `/api/v1/auth`

#### Đăng nhập

```
POST /api/v1/auth/login
```
```json
{
  "username": "admin",
  "password": "123456"
}
```
Response `200 OK`:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "tokenType": "Bearer"
}
```

---

### Tài khoản — `/api/v1/users`

#### Tạo tài khoản mới *(không cần token)*

```
POST /api/v1/users
```
```json
{
  "username": "truonglop_maria",
  "password": "matkhau123",
  "role": "CLASS_LEADER",
  "leaderId": "uuid-của-huynh-trưởng"
}
```
> `leaderId` là tùy chọn — để `null` nếu chưa liên kết với huynh trưởng.

---

### Huynh Trưởng — `/api/v1/leaders`

#### Lấy danh sách phân trang

```
GET /api/v1/leaders?page=0&size=10
```

#### Tìm kiếm theo tên / tên thánh

```
GET /api/v1/leaders/search?keyword=maria&page=0&size=10
```

#### Tạo mới *(ADMIN, EXECUTIVE_COMMITTEE)*

```
POST /api/v1/leaders
```
```json
{
  "leaderCode": "HT-001",
  "christianName": "Têrêxa",
  "fullName": "Nguyễn Thị Hoa",
  "dateOfBirth": "1995-03-15",
  "gender": "FEMALE",
  "phoneNumber": "0912345678",
  "email": "hoa.nguyen@gmail.com",
  "level": "CERTIFIED_LEADER",
  "status": "ACTIVE",
  "position": "CLASS_LEADER"
}
```

#### Cập nhật *(ADMIN, EXECUTIVE_COMMITTEE)*

```
PUT /api/v1/leaders/{id}
```

#### Xóa *(ADMIN, EXECUTIVE_COMMITTEE)*

```
DELETE /api/v1/leaders/{id}
```

---

### Thiếu Nhi — `/api/v1/members`

#### Lấy danh sách theo trạng thái (phân trang)

```
GET /api/v1/members?status=ACTIVE&page=0&size=12
```
> Mặc định `status=ACTIVE` nếu không truyền.

#### Tìm kiếm theo tên (phân trang)

```
GET /api/v1/members/search?keyword=gioan&page=0&size=12
```

Response `Page<MemberResponseDTO>`:
```json
{
  "content": [
    {
      "id": "uuid",
      "fullName": "Nguyễn Văn An",
      "saintName": "Gioan",
      "dateOfBirth": "2010-05-20",
      "gender": "MALE",
      "branch": "JUNIOR",
      "status": "ACTIVE",
      "guardians": [ ... ]
    }
  ],
  "totalElements": 48,
  "totalPages": 4,
  "number": 0,
  "size": 12
}
```

#### Tạo mới

```
POST /api/v1/members
```

#### Cập nhật

```
PUT /api/v1/members/{id}
```

#### Xóa

```
DELETE /api/v1/members/{id}
```

#### Thêm phụ huynh

```
POST /api/v1/members/{memberId}/guardians
```

---

### Lớp học — `/api/v1/classrooms`

#### Tạo lớp *(ADMIN, EXECUTIVE_COMMITTEE, BRANCH_LEADER)*

```
POST /api/v1/classrooms
```
```json
{
  "className": "Lớp Têrêxa",
  "academicYear": "2024-2025",
  "division": "JUNIOR"
}
```

#### Lấy danh sách theo năm học

```
GET /api/v1/classrooms?year=2024-2025
```

#### Xếp thiếu nhi vào lớp *(ADMIN, EXECUTIVE_COMMITTEE, BRANCH_LEADER)*

```
POST /api/v1/classrooms/enroll
```
```json
{
  "memberId": "uuid-của-thiếu-nhi",
  "classroomId": "uuid-của-lớp",
  "enrollmentDate": "2024-09-01"
}
```

---

### Điểm Danh — `/api/v1/attendance`

#### Tạo buổi điểm danh *(GROUP_LEADER trở lên)*

```
POST /api/v1/attendance/session
```
```json
{
  "classroomId": "uuid-của-lớp",
  "sessionDate": "2024-12-01",
  "description": "Buổi sinh hoạt tháng 12"
}
```

#### Nộp bảng điểm danh *(GROUP_LEADER trở lên)*

```
POST /api/v1/attendance/submit
```
```json
{
  "sessionId": "uuid-buổi-điểm-danh",
  "records": [
    { "studentId": "uuid-1", "status": "PRESENT",           "remarks": null },
    { "studentId": "uuid-2", "status": "EXCUSED_ABSENCE",   "remarks": "Báo phép qua điện thoại" },
    { "studentId": "uuid-3", "status": "UNEXCUSED_ABSENCE", "remarks": null }
  ]
}
```
> Idempotent: Nộp lại nhiều lần được — hệ thống xóa record cũ và lưu mới. Response: `204 No Content`.

#### Xem kết quả một buổi

```
GET /api/v1/attendance/session/{sessionId}
```

---

### Bí Tích — `/api/v1/sacraments`

#### Lấy danh sách bí tích của một thiếu nhi

```
GET /api/v1/sacraments?studentId=uuid
```

Response `List<SacramentResponseDTO>`:
```json
[
  {
    "id": "uuid",
    "sacramentType": "BAPTISM",
    "receivedDate": "2010-04-15",
    "patronSaint": "Gioan",
    "celebrant": "Cha Giuse Nguyễn Văn A",
    "place": "Nhà thờ Chợ Quán"
  },
  {
    "id": "uuid",
    "sacramentType": "FIRST_COMMUNION",
    "receivedDate": "2018-06-10",
    "patronSaint": null,
    "celebrant": "Cha Phêrô Trần Văn B",
    "place": "Nhà thờ Chợ Quán"
  }
]
```
> Danh sách không phân trang — trả về tất cả bí tích của một thiếu nhi. Frontend sắp xếp theo `receivedDate` để hiển thị dạng timeline.

---

### Kết Quả Học Tập — `/api/v1/progress`

#### Nhập điểm / đánh giá lên lớp *(CLASS_LEADER trở lên)*

```
PUT /api/v1/progress/evaluate
```
```json
{
  "studentId":       "uuid-thiếu-nhi",
  "classroomId":     "uuid-lớp",
  "catechismScore":  8.5,
  "attendanceScore": 9.0,
  "remarks":         "Tiến bộ tốt trong năm học"
}
```
Response: `204 No Content`

> Hệ thống tự tính TB và xếp loại. Nếu chưa có record thì tạo mới, nếu đã có thì cập nhật.

#### Xem kết quả của một thiếu nhi trong một lớp

```
GET /api/v1/progress?studentId=uuid&classroomId=uuid
```

Response `StudentProgressResponseDTO`:
```json
{
  "id": "uuid",
  "studentId": "uuid",
  "studentFullName": "Nguyễn Văn An",
  "classroomId": "uuid",
  "classroomName": "Lớp Têrêxa",
  "academicYear": "2024-2025",
  "catechismScore": 8.5,
  "attendanceScore": 9.0,
  "performance": "EXCELLENT",
  "promoted": true,
  "remarks": "Tiến bộ tốt",
  "updatedAt": "2025-06-01T10:00:00Z"
}
```

---

### Quy tắc phân trang chung

| Tham số | Mặc định | Ý nghĩa |
|---|---|---|
| `page` | `0` | Số trang (bắt đầu từ 0) |
| `size` | `10` | Số bản ghi mỗi trang |

Response dạng `Page<T>`:
```json
{
  "content": [ ... ],
  "totalElements": 42,
  "totalPages": 5,
  "number": 0,
  "size": 10,
  "first": true,
  "last": false
}
```

---

## Cấu hình Database

File: `src/main/resources/application.properties`

```properties
# DataSource
spring.datasource.url=jdbc:postgresql://localhost:5432/tntt_manager
spring.datasource.username=postgres
spring.datasource.password=123456

# HikariCP
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=2
spring.datasource.hikari.connection-timeout=20000
spring.datasource.hikari.idle-timeout=300000
spring.datasource.hikari.max-lifetime=1800000

# JPA
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.open-in-view=false

# JWT
app.jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
app.jwt.expiration-ms=86400000
```

> **Production:** Đổi `ddl-auto=update` → `validate`. Dùng Flyway để quản lý migration. Thay JWT secret bằng chuỗi random an toàn (min 256-bit).

---

## Xử lý lỗi toàn cục

`GlobalExceptionHandler` (`@RestControllerAdvice`) bắt lỗi tập trung:

| Loại lỗi | HTTP Status | Nguyên nhân |
|---|---|---|
| `MethodArgumentNotValidException` | `400 Bad Request` | Dữ liệu không vượt validation |
| `IllegalArgumentException` | `400 Bad Request` | Username trùng, logic sai |
| `ResourceNotFoundException` | `404 Not Found` | Không tìm thấy bản ghi |
| `AccessDeniedException` | `403 Forbidden` | Không đủ quyền |
| `RuntimeException` | `500 Internal Server Error` | Lỗi không xác định |

Tất cả response lỗi trả về cùng cấu trúc:
```json
{
  "timestamp": "2026-06-22T07:30:00.123Z",
  "status": 404,
  "message": "Member not found with id: abc-123"
}
```

---

## Ghi chú kỹ thuật quan trọng

### 1. JWT stateless — không dùng session

Server không lưu session. Mỗi request phải tự mang token. Token hết hạn sau 24 giờ (`expiration-ms=86400000`). Frontend tự detect token hết hạn qua `AuthContext.isTokenValid()` và logout người dùng.

### 2. `@PreAuthorize` và `hasAnyRole()`

`hasAnyRole('ADMIN')` trong Spring Security tự động thêm tiền tố `ROLE_`, nên so khớp đúng với `ROLE_ADMIN` mà `UserDetailsServiceImpl` gán.  
`@EnableMethodSecurity` trong `SecurityConfig` bật tính năng này.

### 3. Tìm kiếm không dấu tiếng Việt

`LeaderRepository` và `MemberRepository` dùng PostgreSQL Native Query:

```sql
WHERE unaccent(lower(full_name)) LIKE unaccent(lower(concat('%', :keyword, '%')))
```

- `lower()` — không phân biệt hoa/thường
- `unaccent()` — "Nguyễn" khớp với "nguyen"
- Yêu cầu extension `unaccent` đã được tạo (xem Bước 1)

### 4. N+1 Query và `@EntityGraph`

`MemberRepository.findByStatus()` dùng `@EntityGraph(attributePaths = "guardians")` để JOIN Guardian cùng lúc với Member, tránh N+1 queries.

### 5. `@Transactional(readOnly = true)`

Tất cả `ServiceImpl` đặt ở class-level để Hibernate tắt dirty-checking trên các hàm GET. Các hàm ghi override lại bằng `@Transactional` ở method-level.

### 6. Idempotency trong submitAttendance

```
Nộp lần 1 → lưu N record
Phát hiện nhầm → nộp lại lần 2
→ deleteBySessionId()  xóa N record cũ
→ saveAll()            lưu N record mới
```

Kết quả cuối luôn là lần nộp gần nhất.

### 7. BCrypt password hashing

Password không bao giờ lưu dạng plain text. `PasswordEncoder` (BCrypt) hash khi tạo user qua `POST /users`, và tự so sánh khi đăng nhập qua `DaoAuthenticationProvider`.

**Không insert user thủ công vào DB** — password sẽ không được hash và đăng nhập sẽ thất bại với lỗi "Bad credentials".

### 8. Live preview xếp loại (Frontend)

`StudentProgress.jsx` tính toán xếp loại dự kiến trong JavaScript ngay khi huynh trưởng nhập điểm, không cần gọi API. Kết quả thật (từ server) chỉ hiển thị sau khi bấm "Lưu điểm".

### 9. UUID thay vì Long cho ID

```java
@UuidGenerator
private UUID id;
```

- Tránh lộ thông tin tuần tự (`id=1,2,3`)
- Cho phép tạo ID phía ứng dụng không cần roundtrip DB
- Phù hợp kiến trúc phân tán
