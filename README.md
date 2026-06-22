# TNTT Manager — Hệ thống quản lý Thiếu Nhi Thánh Thể

REST API backend để quản lý **Huynh Trưởng**, **Thiếu Nhi**, **Lớp học**, **Điểm danh** và **Kết quả học tập** trong một đoàn Thiếu Nhi Thánh Thể. Xây dựng bằng **Spring Boot 4.1.0** + **Java 21** + **PostgreSQL** + **JWT Authentication**.

---

## Mục lục

- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cài đặt và chạy dự án](#cài-đặt-và-chạy-dự-án)
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

---

## Cài đặt và chạy dự án

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

Sau đó đăng nhập để lấy JWT token và dùng cho các API khác.

---

## Bảo mật và phân quyền

### Luồng xác thực (JWT)

```
[1] POST /api/v1/auth/login  →  trả về JWT token
[2] Mọi request sau:         →  thêm header "Authorization: Bearer <token>"
[3] JwtAuthenticationFilter  →  giải mã token, set SecurityContext
[4] @PreAuthorize            →  kiểm tra role trước khi vào Controller
```

### Ma trận phân quyền

| Endpoint | ADMIN | EXEC | BRANCH | CLASS | GROUP | JUNIOR |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `POST /auth/login` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /users` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /leaders`, `GET /members` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST/PUT/DELETE /leaders` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `POST /classrooms`, `/enroll` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `GET /classrooms` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /attendance/session`, `/submit` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `GET /attendance/session/{id}` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `PUT /progress/evaluate` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `GET /progress` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

> **EXEC** = `EXECUTIVE_COMMITTEE`, **BRANCH** = `BRANCH_LEADER`, **CLASS** = `CLASS_LEADER`, **GROUP** = `GROUP_LEADER`, **JUNIOR** = `JUNIOR_LEADER`

Vi phạm quyền trả về `403 Forbidden`. Không có token trả về `403 Forbidden`.

### Các thành phần Security

| Class | Vai trò |
|---|---|
| `JwtTokenProvider` | Tạo / giải mã / kiểm tra JWT token |
| `JwtAuthenticationFilter` | Filter chạy trên mọi request, đọc token từ header |
| `UserDetailsServiceImpl` | Load user từ DB, gán `ROLE_` cho Spring Security |
| `SecurityConfig` | Cấu hình tổng thể, bật `@EnableMethodSecurity` |

---

## Cấu trúc dự án

```
src/main/java/com/example/tntt_Manager/
│
├── config/
│   └── SecurityConfig.java             # Cấu hình Spring Security + JWT filter
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
│   ├── AttendanceRecord.java           # Chi tiết điểm danh
│   ├── StudentProgress.java            # Kết quả học tập / lên lớp
│   ├── Sacrament.java                  # Bí tích đã lãnh nhận
│   └── enums/
│       ├── SystemRole.java             # Quyền tài khoản (ADMIN, CLASS_LEADER...)
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
│       ├── AcademicPerformance.java    # Học lực (EXCELLENT, GOOD...)
│       └── SacramentType.java          # Loại bí tích (BAPTISM, EUCHARIST...)
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
│       └── StudentProgressResponseDTO.java
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
│   └── StudentProgressController.java
│
└── exception/
    ├── ResourceNotFoundException.java
    ├── ErrorResponse.java
    └── GlobalExceptionHandler.java
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
| `id` | UUID | Khóa chính, tự sinh |
| `leader_code` | VARCHAR | Mã huynh trưởng, duy nhất |
| `christian_name` | VARCHAR | Tên thánh (nullable) |
| `full_name` | VARCHAR | Họ và tên, bắt buộc |
| `date_of_birth` | DATE | Ngày sinh |
| `gender` | VARCHAR | `MALE` / `FEMALE` |
| `phone_number` | VARCHAR(15) | Số điện thoại |
| `email` | VARCHAR | Email |
| `level` | VARCHAR | Cấp bậc huynh trưởng |
| `status` | VARCHAR | Trạng thái hoạt động |
| `position` | VARCHAR | Chức vụ trong đoàn |
| `createdat` | TIMESTAMPTZ | Tự điền khi tạo |
| `updatedat` | TIMESTAMPTZ | Tự cập nhật khi sửa |

### Member (Thiếu Nhi) — bảng `members`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | UUID | Khóa chính, tự sinh |
| `ho_va_ten` | VARCHAR | Họ và tên |
| `ten_thanh` | VARCHAR | Tên thánh (nullable) |
| `ngay_sinh` | DATE | Ngày sinh |
| `gioi_tinh` | VARCHAR | Giới tính |
| `dia_chi` | VARCHAR | Địa chỉ |
| `nganh` | VARCHAR | Ngành sinh hoạt |
| `trang_thai` | VARCHAR | Trạng thái |
| `nguon_goc` | VARCHAR | Nguồn gốc gia nhập |
| `ngay_gia_nhap` | DATE | Ngày gia nhập |
| `ghi_chu` | TEXT | Ghi chú tự do |

### StudentProgress (Kết quả học tập) — bảng `ket_qua_hoc_tap`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | UUID | Khóa chính |
| `thieu_nhi_id` | UUID (FK) | Thiếu nhi |
| `lop_hoc_id` | UUID (FK) | Lớp học |
| `diem_giao_ly` | DECIMAL(5,2) | Điểm giáo lý |
| `diem_chuyen_can` | DECIMAL(5,2) | Điểm chuyên cần |
| `hoc_luc` | VARCHAR | Học lực (`AcademicPerformance`) |
| `is_len_lop` | BOOLEAN | Đã lên lớp chưa |
| `ghi_chu` | TEXT | Ghi chú |

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
| `BRANCH_LEADER` | Trưởng ngành (Ấu/Thiếu/Nghĩa/Hiệp) | `ROLE_BRANCH_LEADER` |
| `CLASS_LEADER` | Huynh trưởng phụ trách lớp | `ROLE_CLASS_LEADER` |
| `GROUP_LEADER` | Huynh trưởng thông thường | `ROLE_GROUP_LEADER` |
| `JUNIOR_LEADER` | Dự trưởng | `ROLE_JUNIOR_LEADER` |

### Gender (Giới tính)
| Giá trị | Ý nghĩa |
|---|---|
| `MALE` | Nam |
| `FEMALE` | Nữ |

### Branch (Ngành Thiếu Nhi)
| Giá trị | Ý nghĩa |
|---|---|
| `INFANT` | Ấu nhi |
| `JUNIOR` | Thiếu nhi |
| `SENIOR` | Nghĩa sĩ |
| `ADVENTURER` | Hiệp sĩ |
| `SOLDIER` | Chiến sĩ |
| `JUNIOR_LEADER` | Dự trưởng |

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

### LeaderStatus / MemberStatus (Trạng thái)
| Giá trị | Leader | Member |
|---|:---:|:---:|
| `ACTIVE` — Đang hoạt động | ✓ | ✓ |
| `ON_LEAVE` — Tạm nghỉ | ✓ | ✓ |
| `INACTIVE` — Không hoạt động | ✓ | ✓ |
| `GRADUATED` — Đã tốt nghiệp | — | ✓ |

### MemberOrigin (Nguồn gốc Thiếu Nhi)
| Giá trị | Ý nghĩa |
|---|---|
| `NEW_MEMBER` | Thành viên mới |
| `TRANSFERRED` | Chuyển đến từ đoàn khác |
| `RETURNING` | Tái gia nhập |

### RelationshipType (Quan hệ Phụ huynh)
| Giá trị | Ý nghĩa |
|---|---|
| `FATHER` | Cha |
| `MOTHER` | Mẹ |
| `GRANDPARENT` | Ông/Bà |
| `OTHER_GUARDIAN` | Người giám hộ khác |

### AssignmentRole (Vai trò HT trong lớp)
| Giá trị | Ý nghĩa |
|---|---|
| `MAIN_TEACHER` | Trưởng lớp |
| `ASSISTANT_TEACHER` | Phó lớp / Phụ tá |

### AttendanceStatus (Trạng thái điểm danh)
| Giá trị | Ý nghĩa |
|---|---|
| `PRESENT` | Có mặt |
| `EXCUSED_ABSENCE` | Vắng có phép |
| `UNEXCUSED_ABSENCE` | Vắng không phép |

### AcademicPerformance (Học lực)
| Giá trị | Ý nghĩa |
|---|---|
| `EXCELLENT` | Giỏi |
| `GOOD` | Khá |
| `AVERAGE` | Trung bình |
| `WEAK` | Yếu |

### SacramentType (Loại bí tích)
| Giá trị | Ý nghĩa |
|---|---|
| `BAPTISM` | Rửa tội |
| `EUCHARIST` | Rước lễ lần đầu |
| `CONFIRMATION` | Thêm sức |

---

## API Reference

Base URL: `http://localhost:8080`

> Tất cả API (trừ `/auth/**` và `POST /users`) đều yêu cầu header:
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
Response:
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
> `leaderId` là tùy chọn — để `null` nếu chưa liên kết với huynh trưởng nào.

---

### Huynh Trưởng — `/api/v1/leaders`

#### Lấy danh sách (tất cả role)
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

#### Lấy danh sách theo trạng thái
```
GET /api/v1/members?status=ACTIVE&page=0&size=10
```
> Mặc định `status=ACTIVE` nếu không truyền.

#### Tìm kiếm theo tên
```
GET /api/v1/members/search?keyword=gioan&page=0&size=10
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

### Điểm danh — `/api/v1/attendance`

#### Tạo buổi điểm danh *(CLASS_LEADER trở lên)*
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

#### Nộp bảng điểm danh *(CLASS_LEADER trở lên)*
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
> Có thể nộp lại nhiều lần — hệ thống tự thay thế dữ liệu cũ. Response: `204 No Content`.

#### Xem kết quả một buổi
```
GET /api/v1/attendance/session/{sessionId}
```

---

### Kết quả học tập — `/api/v1/progress`

#### Nhập điểm / đánh giá lên lớp *(CLASS_LEADER trở lên)*
```
PUT /api/v1/progress/evaluate
```
```json
{
  "studentId": "uuid-thiếu-nhi",
  "classroomId": "uuid-lớp",
  "catechismScore": 8.5,
  "attendanceScore": 9.0,
  "remarks": "Tiến bộ tốt"
}
```

#### Xem kết quả của một thiếu nhi
```
GET /api/v1/progress?studentId=uuid&classroomId=uuid
```

---

### Quy tắc phân trang chung

Tất cả API GET danh sách đều hỗ trợ:

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

> **Production:** Đổi `ddl-auto=update` thành `validate`. Dùng Flyway để quản lý migration có kiểm soát. Đổi JWT secret thành chuỗi random an toàn.

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
  "message": "Leader not found with id: abc-123"
}
```

---

## Ghi chú kỹ thuật quan trọng

### 1. JWT stateless — không dùng session

Server không lưu session. Mỗi request phải tự mang token. Token có hiệu lực 24 giờ (`expiration-ms=86400000`).

### 2. `@PreAuthorize` và `hasAnyRole()`

`hasAnyRole('ADMIN')` trong Spring Security tự động thêm tiền tố `ROLE_`, nên so khớp đúng với `ROLE_ADMIN` mà `UserDetailsServiceImpl` gán.  
`@EnableMethodSecurity` trong `SecurityConfig` bật tính năng này.

### 3. Tìm kiếm không dấu tiếng Việt

`LeaderRepository` và `MemberRepository` dùng PostgreSQL Native Query:

```sql
WHERE unaccent(lower(full_name)) LIKE unaccent(lower(concat('%', :keyword, '%')))
```

- `lower()` — "MARIA" = "maria"
- `unaccent()` — "María" = "Maria"
- Yêu cầu extension `unaccent` đã được tạo (Bước 1)

### 4. N+1 Query và `@EntityGraph`

`MemberRepository.findByStatus()` dùng `@EntityGraph(attributePaths = "guardians")` để load Guardian cùng lúc với Member bằng một JOIN duy nhất, tránh N+1 queries.

### 5. `@Transactional(readOnly = true)`

Tất cả `ServiceImpl` đặt ở class-level để Hibernate tắt dirty-checking trên các hàm GET. Các hàm ghi override lại bằng `@Transactional` ở method-level.

### 6. Chiến lược "xóa rồi lưu lại" trong submitAttendance

```
Nộp lần 1 → lưu N record
Phát hiện nhầm → nộp lại lần 2
→ deleteBySessionId() xóa N record cũ
→ saveAll()          lưu N record mới
```

Đảm bảo idempotency: kết quả cuối luôn là lần nộp gần nhất.

### 7. BCrypt password hashing

Password không bao giờ lưu dạng plain text. `PasswordEncoder` (BCrypt) hash khi tạo user, và tự động so sánh khi đăng nhập qua `DaoAuthenticationProvider`.

### 8. UUID thay vì Long cho ID

```java
@UuidGenerator
private UUID id;
```

- Tránh lộ thông tin tuần tự (`id=1,2,3`)
- Cho phép tạo ID phía ứng dụng không cần roundtrip DB
- Phù hợp kiến trúc phân tán
