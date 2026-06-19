# TNTT Manager — Hệ thống quản lý Thiếu Nhi Thánh Thể

Ứng dụng REST API backend để quản lý **Huynh Trưởng**, **Thiếu Nhi**, **Lớp học** và **Điểm danh** trong một đoàn Thiếu Nhi Thánh Thể. Xây dựng bằng **Spring Boot 4.1.0** + **Java 21** + **PostgreSQL**.

---

## Mục lục

- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cài đặt và chạy dự án](#cài-đặt-và-chạy-dự-án)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Sơ đồ luồng xử lý](#sơ-đồ-luồng-xử-lý)
- [Các Entity và quan hệ dữ liệu](#các-entity-và-quan-hệ-dữ-liệu)
- [Danh sách Enum](#danh-sách-enum)
- [API Reference](#api-reference)
- [Cấu hình Database](#cấu-hình-database)
- [Xử lý lỗi toàn cục](#xử-lý-lỗi-toàn-cục)
- [Ghi chú kỹ thuật quan trọng](#ghi-chú-kỹ-thuật-quan-trọng)
- [Lịch sử đổi tên (Vietnamese → English)](#lịch-sử-đổi-tên-vietnamese--english)

---

## Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Ngôn ngữ | Java 21 |
| Framework | Spring Boot 4.1.0 |
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

### Bước 1 — Tạo database, kích hoạt extension và tạo PostgreSQL Enum Type

Mở psql hoặc pgAdmin và chạy:

```sql
CREATE DATABASE tntt_manager;
\c tntt_manager

-- Bắt buộc: extension để tìm kiếm không dấu tiếng Việt
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Tùy chọn nhưng nên có: tăng tốc tìm kiếm LIKE với GIN index
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

> **Tại sao cần `unaccent`?** PostgreSQL mặc định so sánh chuỗi theo byte, tức là "Hoa" và "Hòa" là khác nhau. Extension `unaccent` giúp bỏ dấu trước khi so sánh, cho phép tìm "hoa" ra được "Hòa", "Hóa", "Hoà"...

**Bắt buộc: Tạo các PostgreSQL Custom Enum Type trước khi khởi động app**

Dự án dùng `@JdbcTypeCode(SqlTypes.NAMED_ENUM)` để ánh xạ Enum Java sang PostgreSQL custom type. Hibernate **không tự tạo** các type này — phải tạo thủ công một lần duy nhất:

```sql
-- Enum cho Leader
CREATE TYPE gender          AS ENUM ('MALE', 'FEMALE');
CREATE TYPE leaderlevel     AS ENUM ('PROBATIONARY_LEADER', 'CERTIFIED_LEADER');
CREATE TYPE leaderstatus    AS ENUM ('ACTIVE', 'ON_LEAVE', 'INACTIVE');
CREATE TYPE leaderposition  AS ENUM (
    'PARISH_CHIEF', 'PARISH_DEPUTY_EXTERNAL', 'PARISH_DEPUTY_INTERNAL',
    'SECRETARY', 'TREASURER', 'SPECIALIST',
    'BRANCH_LEADER', 'BRANCH_DEPUTY', 'CLASS_LEADER',
    'ASSISTANT_SUPERVISOR', 'ASSISTANT_AIDE', 'GROUP_LEADER'
);

-- Enum cho Classroom / ClassAssignment
CREATE TYPE branch          AS ENUM ('SOLDIER', 'INFANT', 'JUNIOR', 'SENIOR', 'ADVENTURER', 'JUNIOR_LEADER');
CREATE TYPE assignmentrole  AS ENUM ('MAIN_TEACHER', 'ASSISTANT_TEACHER');

-- Enum cho AttendanceRecord
CREATE TYPE attendancestatus AS ENUM ('PRESENT', 'EXCUSED_ABSENCE', 'UNEXCUSED_ABSENCE');
```

> **Quy tắc đặt tên:** Tên PostgreSQL type = tên class Java Enum viết thường, không dấu gạch dưới.
> Ví dụ: `LeaderLevel` → `leaderlevel`, `AssignmentRole` → `assignmentrole`.

### Bước 2 — Cấu hình kết nối

Mở `src/main/resources/application.yml` và chỉnh lại thông tin database của bạn:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/tntt_manager
    username: postgres
    password: "your_password"
```

### Bước 3 — Chạy ứng dụng

```bash
mvn spring-boot:run
```

Ứng dụng sẽ khởi động tại `http://localhost:8080`.
Hibernate tự động tạo/cập nhật bảng nhờ cấu hình `ddl-auto: update` — không cần chạy SQL tạo bảng thủ công.

---

## Cấu trúc dự án

```
src/main/java/com/example/tntt_Manager/
│
├── TNTManagerApplication.java          # Entry point — hàm main()
│
├── entity/                             # Tầng Entity — ánh xạ trực tiếp sang bảng DB
│   ├── Leader.java                     # Huynh Trưởng
│   ├── Member.java                     # Thiếu Nhi
│   ├── Guardian.java                   # Phụ huynh / người giám hộ
│   ├── User.java                       # Tài khoản đăng nhập hệ thống
│   ├── Classroom.java                  # Lớp học (lop_hoc)
│   ├── ClassEnrollment.java            # Phân lớp thiếu nhi (phan_lop)
│   ├── ClassAssignment.java            # Phân công huynh trưởng (phan_cong_lop)
│   ├── AttendanceSession.java          # Buổi điểm danh (buoi_diem_danh)
│   ├── AttendanceRecord.java           # Chi tiết điểm danh (chi_tiet_diem_danh)
│   └── enums/
│       ├── Gender.java
│       ├── Branch.java
│       ├── LeaderLevel.java
│       ├── LeaderPosition.java
│       ├── LeaderStatus.java
│       ├── MemberOrigin.java
│       ├── MemberStatus.java
│       ├── RelationshipType.java
│       ├── SystemRole.java
│       ├── AssignmentRole.java         # Vai trò HT trong lớp (trưởng lớp / phụ tá)
│       └── AttendanceStatus.java       # Trạng thái điểm danh
│
├── repository/
│   ├── LeaderRepository.java
│   ├── MemberRepository.java
│   ├── UserRepository.java
│   ├── ClassroomRepository.java
│   ├── ClassEnrollmentRepository.java
│   ├── ClassAssignmentRepository.java
│   ├── AttendanceSessionRepository.java
│   └── AttendanceRecordRepository.java
│
├── dto/
│   ├── request/
│   │   ├── LeaderRequestDTO.java
│   │   ├── MemberRequestDTO.java
│   │   ├── GuardianRequestDTO.java
│   │   ├── LoginRequestDTO.java
│   │   ├── ClassroomRequestDTO.java
│   │   ├── EnrollmentRequestDTO.java
│   │   ├── AttendanceSessionRequestDTO.java
│   │   ├── AttendanceRecordSubmitDTO.java
│   │   └── BulkAttendanceSubmitDTO.java
│   └── response/
│       ├── LeaderResponseDTO.java
│       ├── MemberResponseDTO.java
│       ├── GuardianResponseDTO.java
│       ├── ClassroomResponseDTO.java
│       ├── ClassEnrollmentResponseDTO.java
│       ├── AttendanceSessionResponseDTO.java
│       └── AttendanceReportResponseDTO.java
│
├── service/
│   ├── LeaderService.java
│   ├── MemberService.java
│   ├── ClassroomService.java
│   ├── AttendanceService.java
│   └── impl/
│       ├── LeaderServiceImpl.java
│       ├── MemberServiceImpl.java
│       ├── ClassroomServiceImpl.java
│       └── AttendanceServiceImpl.java
│
├── controller/
│   ├── LeaderController.java
│   ├── MemberController.java
│   ├── ClassroomController.java
│   └── AttendanceController.java
│
└── exception/
    ├── ResourceNotFoundException.java
    ├── ErrorResponse.java
    └── GlobalExceptionHandler.java
```

---

## Sơ đồ luồng xử lý

Mỗi HTTP request đi qua 4 tầng theo thứ tự sau:

```
[Client gửi HTTP Request]
         │
         ▼
  ┌─────────────────┐
  │   Controller    │  Nhận request, validate đầu vào (@Valid), gọi Service
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │     Service     │  Xử lý logic nghiệp vụ, map Entity ↔ DTO
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │   Repository    │  Truy vấn database qua Spring Data JPA
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │   PostgreSQL    │  Lưu trữ và trả về dữ liệu
  └────────┬────────┘
           │
           ▼ (chiều ngược lại)
  Entity → DTO → JSON → [Client nhận HTTP Response]
```

**Tại sao phải tách nhiều tầng như vậy?**
- **Controller** không nên chứa logic — nếu cần đổi giao thức (HTTP → gRPC), chỉ cần viết lại Controller, không đụng Service.
- **Service** không biết đến HTTP — logic nghiệp vụ độc lập, dễ test.
- **Repository** không biết đến DTO — chỉ làm việc với Entity, dễ tái sử dụng.
- **DTO** bảo vệ Entity khỏi bị lộ ra ngoài (ví dụ: không để lộ `passwordHash`).

---

## Các Entity và quan hệ dữ liệu

### Leader (Huynh Trưởng) — bảng `leader`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | UUID | Khóa chính, tự sinh |
| `leader_code` | VARCHAR | Mã huynh trưởng, duy nhất |
| `christian_name` | VARCHAR | Tên thánh (nullable) |
| `full_name` | VARCHAR | Họ và tên, bắt buộc |
| `date_of_birth` | DATE | Ngày sinh |
| `gender` | ENUM | `MALE` / `FEMALE` |
| `phone_number` | VARCHAR(15) | Số điện thoại |
| `email` | VARCHAR | Email |
| `level` | ENUM | Cấp bậc huynh trưởng |
| `status` | ENUM | Trạng thái hoạt động |
| `position` | ENUM | Chức vụ trong đoàn |
| `createdat` | TIMESTAMPTZ | Tự điền khi tạo mới |
| `updatedat` | TIMESTAMPTZ | Tự cập nhật khi sửa |

### Member (Thiếu Nhi) — bảng `members`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | UUID | Khóa chính, tự sinh |
| `ho_va_ten` | VARCHAR | Họ và tên |
| `ten_thanh` | VARCHAR | Tên thánh (nullable) |
| `ngay_sinh` | DATE | Ngày sinh |
| `gioi_tinh` | ENUM | Giới tính |
| `dia_chi` | VARCHAR | Địa chỉ |
| `nganh` | ENUM | Ngành sinh hoạt |
| `trang_thai` | ENUM | Trạng thái |
| `nguon_goc` | ENUM | Nguồn gốc gia nhập |
| `ngay_gia_nhap` | DATE | Ngày gia nhập |
| `ghi_chu` | TEXT | Ghi chú tự do |

### Guardian (Phụ huynh) — bảng `guardians`

Mỗi thiếu nhi có thể có **nhiều** phụ huynh. Quan hệ `ManyToOne` từ Guardian về Member (một thiếu nhi ← nhiều phụ huynh).

### User (Tài khoản) — bảng `users`

Mỗi `User` liên kết `OneToOne` với một `Leader`. Một huynh trưởng có thể có (hoặc chưa có) tài khoản đăng nhập.

### Classroom (Lớp học) — bảng `lop_hoc`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | UUID | Khóa chính, tự sinh |
| `ten_lop` | VARCHAR | Tên lớp |
| `nam_hoc` | VARCHAR | Năm học (VD: "2024-2025") |
| `nganh` | ENUM `branch` | Ngành sinh hoạt của lớp |
| `createdat` | TIMESTAMPTZ | Tự điền khi tạo mới |
| `updatedat` | TIMESTAMPTZ | Tự cập nhật khi sửa |

### ClassEnrollment (Phân lớp) — bảng `phan_lop`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | UUID | Khóa chính, tự sinh |
| `student_id` | UUID (FK) | Trỏ về bảng `members` |
| `lop_hoc_id` | UUID (FK) | Trỏ về bảng `lop_hoc` |
| `ngay_phan_lop` | DATE | Ngày phân lớp |

### ClassAssignment (Phân công HT) — bảng `phan_cong_lop`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | UUID | Khóa chính, tự sinh |
| `huynh_truong_id` | UUID (FK) | Trỏ về bảng `leader` |
| `lop_hoc_id` | UUID (FK) | Trỏ về bảng `lop_hoc` |
| `vai_tro` | ENUM `assignmentrole` | Trưởng lớp hoặc Phụ tá |
| `ngay_phan_cong` | DATE | Ngày phân công |

### AttendanceSession (Buổi điểm danh) — bảng `buoi_diem_danh`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | UUID | Khóa chính, tự sinh |
| `ngay_diem_danh` | DATE | Ngày tổ chức buổi sinh hoạt |
| `ghi_chu` | VARCHAR | Mô tả buổi học (nullable) |
| `lop_hoc_id` | UUID (FK) | Trỏ về bảng `lop_hoc` |
| `createdat` | TIMESTAMPTZ | Tự điền khi tạo mới |
| `updatedat` | TIMESTAMPTZ | Tự cập nhật khi sửa |

### AttendanceRecord (Chi tiết điểm danh) — bảng `chi_tiet_diem_danh`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | UUID | Khóa chính, tự sinh |
| `buoi_diem_danh_id` | UUID (FK) | Trỏ về bảng `buoi_diem_danh` |
| `thieu_nhi_id` | UUID (FK) | Trỏ về bảng `members` |
| `trang_thai` | ENUM `attendancestatus` | Có mặt / Vắng phép / Vắng không phép |
| `ghi_chu_rieng` | VARCHAR | Ghi chú riêng cho học sinh (nullable) |

### Quan hệ giữa các Entity

```
User ──(1:1)──► Leader
                  │
                  └──(1:N)──► ClassAssignment ◄──(N:1)── Classroom
                                                               │
Member ──(1:N)──► Guardian           ClassEnrollment ◄──(N:1)─┘
  │                                       ▲
  └──(1:N)──► ClassEnrollment ────────────┘
  │
  └──(1:N)──► AttendanceRecord ◄──(N:1)── AttendanceSession ──(N:1)──► Classroom
```

---

## Danh sách Enum

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
| Giá trị | Ý nghĩa | Leader | Member |
|---|---|---|---|
| `ACTIVE` | Đang hoạt động | ✓ | ✓ |
| `ON_LEAVE` | Tạm nghỉ | ✓ | ✓ |
| `INACTIVE` | Không hoạt động | ✓ | ✓ |
| `GRADUATED` | Đã tốt nghiệp | — | ✓ |

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

### SystemRole (Quyền tài khoản)
| Giá trị | Ý nghĩa |
|---|---|
| `ADMIN` | Quản trị hệ thống |
| `EXECUTIVE_COMMITTEE` | Ban chấp hành |
| `BRANCH_LEADER` | Trưởng ngành |
| `CLASS_LEADER` | Trưởng lớp |
| `GROUP_LEADER` | Trưởng nhóm |
| `JUNIOR_LEADER` | Dự trưởng |

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

---

## API Reference

Base URL: `http://localhost:8080`

### Huynh Trưởng — `/api/v1/leaders`

#### Lấy danh sách tất cả huynh trưởng (có phân trang, sắp xếp theo tên A→Z)
```
GET /api/v1/leaders?page=0&size=10
```

#### Tìm kiếm huynh trưởng theo tên hoặc tên thánh (không phân biệt dấu, hoa/thường)
```
GET /api/v1/leaders/search?keyword=maria&page=0&size=10
```

#### Tạo mới huynh trưởng
```
POST /api/v1/leaders
Content-Type: application/json

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
  "position": "BRANCH_LEADER"
}
```

#### Cập nhật huynh trưởng
```
PUT /api/v1/leaders/{id}
Content-Type: application/json

{ ... (body giống POST) ... }
```

#### Xóa huynh trưởng
```
DELETE /api/v1/leaders/{id}
```

---

### Thiếu Nhi — `/api/v1/members`

#### Lấy danh sách thiếu nhi theo trạng thái
```
GET /api/v1/members?status=ACTIVE&page=0&size=10
```
> Mặc định `status=ACTIVE` nếu không truyền tham số.

#### Tìm kiếm thiếu nhi theo tên hoặc tên thánh
```
GET /api/v1/members/search?keyword=gioan&page=0&size=10
```

#### Tạo mới thiếu nhi
```
POST /api/v1/members
Content-Type: application/json
```

#### Cập nhật thiếu nhi
```
PUT /api/v1/members/{id}
Content-Type: application/json
```

#### Xóa thiếu nhi
```
DELETE /api/v1/members/{id}
```

#### Thêm phụ huynh cho một thiếu nhi
```
POST /api/v1/members/{memberId}/guardians
Content-Type: application/json
```

---

### Lớp học — `/api/v1/classrooms`

#### Tạo lớp học mới
```
POST /api/v1/classrooms
Content-Type: application/json

{
  "className": "Lớp Têrêxa",
  "academicYear": "2024-2025",
  "division": "JUNIOR"
}
```

#### Lấy danh sách lớp theo năm học
```
GET /api/v1/classrooms?year=2024-2025
```

#### Xếp một thiếu nhi vào lớp
```
POST /api/v1/classrooms/enroll
Content-Type: application/json

{
  "memberId": "uuid-của-thiếu-nhi",
  "classroomId": "uuid-của-lớp-học",
  "enrollmentDate": "2024-09-01"
}
```
> `enrollmentDate` là tùy chọn — mặc định là ngày hôm nay nếu không truyền.

---

### Điểm danh — `/api/v1/attendance`

#### Tạo buổi điểm danh mới cho một lớp
```
POST /api/v1/attendance/session
Content-Type: application/json

{
  "classroomId": "uuid-của-lớp-học",
  "sessionDate": "2024-12-01",
  "description": "Buổi sinh hoạt tháng 12"
}
```

#### Nộp bảng điểm danh cả lớp
```
POST /api/v1/attendance/submit
Content-Type: application/json

{
  "sessionId": "uuid-của-buổi-điểm-danh",
  "records": [
    { "studentId": "uuid-1", "status": "PRESENT",            "remarks": null },
    { "studentId": "uuid-2", "status": "EXCUSED_ABSENCE",    "remarks": "Báo phép qua điện thoại" },
    { "studentId": "uuid-3", "status": "UNEXCUSED_ABSENCE",  "remarks": null }
  ]
}
```
> Có thể nộp lại nhiều lần — hệ thống tự xóa dữ liệu cũ và lưu mới.  
> Response: HTTP `204 No Content`.

#### Xem kết quả điểm danh của một buổi
```
GET /api/v1/attendance/session/{sessionId}
```

---

### Quy tắc phân trang chung

Tất cả API GET danh sách đều hỗ trợ tham số:

| Tham số | Mặc định | Ý nghĩa |
|---|---|---|
| `page` | `0` | Số trang (bắt đầu từ 0) |
| `size` | `10` | Số bản ghi mỗi trang |

Response trả về dạng `Page<T>` gồm:

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

File cấu hình: `src/main/resources/application.yml`

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/tntt_manager
    username: postgres
    password: "123456"
    hikari:
      maximum-pool-size: 10     # Tối đa 10 connection đồng thời
      minimum-idle: 2           # Duy trì tối thiểu 2 connection sẵn sàng
      connection-timeout: 20000 # Chờ lấy connection tối đa 20 giây
      idle-timeout: 300000      # Connection nhàn rỗi quá 5 phút sẽ bị đóng
      max-lifetime: 1800000     # Mỗi connection sống tối đa 30 phút rồi được làm mới

  jpa:
    hibernate:
      ddl-auto: update          # Tự tạo/cập nhật schema khi khởi động
    show-sql: true              # In SQL ra console (tắt ở production)
    open-in-view: false         # Tắt anti-pattern OSIV để tránh giữ DB session quá lâu
```

> **Lưu ý production:** Đổi `ddl-auto: update` thành `validate` khi deploy thật. Dùng công cụ migration như Flyway để quản lý thay đổi schema có kiểm soát.

---

## Xử lý lỗi toàn cục

`GlobalExceptionHandler` (dùng `@RestControllerAdvice`) bắt lỗi tập trung thay vì để từng Controller tự xử lý:

| Loại lỗi | HTTP Status | Nguyên nhân |
|---|---|---|
| `MethodArgumentNotValidException` | `400 Bad Request` | Dữ liệu đầu vào không vượt qua validation (`@NotBlank`, `@Email`...) |
| `ResourceNotFoundException` | `404 Not Found` | Không tìm thấy bản ghi theo `id` |
| `RuntimeException` (chung) | `500 Internal Server Error` | Lỗi không xác định |

Tất cả response lỗi đều trả về cùng một cấu trúc JSON:

```json
{
  "timestamp": "2026-06-19T07:30:00.123Z",
  "status": 404,
  "message": "Leader not found with id: abc-123"
}
```

---

## Ghi chú kỹ thuật quan trọng

### 1. Tìm kiếm không dấu tiếng Việt

`LeaderRepository` và `MemberRepository` đều dùng PostgreSQL Native Query với `unaccent` + `lower`:

```sql
WHERE unaccent(lower(full_name || ' ' || coalesce(christian_name, '')))
      LIKE unaccent(lower(concat('%', :keyword, '%')))
```

- `lower()` — Chuyển về chữ thường → "MARIA" = "maria"
- `unaccent()` — Bỏ dấu → "María" = "Maria" = "maria"
- `coalesce(christian_name, '')` — Nếu tên thánh là NULL thì dùng chuỗi rỗng, tránh cả expression bị NULL
- `countQuery` riêng biệt — Bắt buộc khi dùng `Page` + `nativeQuery = true`, Spring cần câu đếm để tính `totalPages`

### 2. Tối ưu N+1 với @EntityGraph

`MemberRepository.findByStatus()` dùng `@EntityGraph(attributePaths = "guardians")`:

```java
@EntityGraph(attributePaths = "guardians")
Page<Member> findByStatus(MemberStatus status, Pageable pageable);
```

**Không có annotation này:** lấy 10 Member → 10 câu SELECT riêng để lấy Guardian của từng Member = **11 câu query**.
**Có annotation này:** Hibernate dùng `LEFT JOIN FETCH` → chỉ còn **1 câu query duy nhất**.

### 3. @Transactional(readOnly = true)

Tất cả `ServiceImpl` đặt `@Transactional(readOnly = true)` ở class-level:

- Hibernate **tắt dirty-checking** (không theo dõi thay đổi entity) → tiết kiệm bộ nhớ và CPU
- Các phương thức ghi dữ liệu override lại bằng `@Transactional` (không `readOnly`) ở method-level

### 4. Constructor Injection với @RequiredArgsConstructor

```java
@RequiredArgsConstructor
public class LeaderServiceImpl {
    private final LeaderRepository leaderRepository; // final → Lombok tạo constructor
}
```

Spring Boot khuyến khích **constructor injection** thay vì `@Autowired` trên field vì:
- Dễ test hơn (có thể truyền mock vào constructor)
- Phát hiện circular dependency tại lúc khởi động, không phải lúc runtime
- Đảm bảo dependency không thể bị `null` sau khi object tạo xong

### 5. Entity ID dùng UUID thay vì Long

```java
@UuidGenerator
private UUID id;
```

- Tránh lộ thông tin (client không đoán được `id=1, 2, 3...` để dò dẫm hệ thống)
- Cho phép tạo ID ở phía ứng dụng mà không cần roundtrip DB
- Phù hợp kiến trúc phân tán nếu sau này mở rộng nhiều server

### 6. PostgreSQL Custom Enum Type và @JdbcTypeCode(SqlTypes.NAMED_ENUM)

Các enum dùng `@JdbcTypeCode(SqlTypes.NAMED_ENUM)` yêu cầu PostgreSQL phải có **custom type** tương ứng tồn tại sẵn. Hibernate `ddl-auto: update` **không tự tạo** các type này.

```java
// Entity sử dụng NAMED_ENUM
@Enumerated(EnumType.STRING)
@JdbcTypeCode(SqlTypes.NAMED_ENUM)        // ← yêu cầu type "branch" tồn tại trong PostgreSQL
@Column(name = "nganh", nullable = false)
private Branch division;
```

Nếu type chưa được tạo, Hibernate sẽ **không tạo cột đó** khi khởi động. INSERT/SELECT sau đó sẽ báo lỗi `column does not exist`. Fix: tạo thủ công theo hướng dẫn ở Bước 1.

### 7. Chiến lược "xóa rồi lưu lại" trong submitAttendance

```
Nộp điểm danh lần 1 → lưu N record vào DB
Phát hiện nhầm → nộp lại lần 2
→ deleteBySessionId()  xóa toàn bộ N record cũ
→ saveAll()            lưu N record mới chính xác
```

Đảm bảo idempotency: nộp bao nhiêu lần kết quả cuối cùng luôn là lần nộp gần nhất.

### 8. @Valid lồng nhau trong List

```java
@Valid                              // ← bắt buộc phải có để validation đi sâu vào List
@NotEmpty
private List<AttendanceRecordSubmitDTO> records;
```

Nếu thiếu `@Valid` trên field List, các annotation như `@NotNull` bên trong từng phần tử sẽ bị bỏ qua hoàn toàn.

---

## Lịch sử đổi tên (Vietnamese → English)

Dự án ban đầu dùng tên tiếng Việt, sau đó đổi sang tiếng Anh cho nhất quán.
Bảng tra cứu bên dưới giúp đối chiếu nếu cần tìm lại code cũ trong git history.

<details>
<summary>Xem bảng đổi tên đầy đủ</summary>

### Enum

| Tên cũ (VI) | Tên mới (EN) |
|---|---|
| `GioiTinh.NAM` | `Gender.MALE` |
| `GioiTinh.NU` | `Gender.FEMALE` |
| `MoiQuanHe.CHA` | `RelationshipType.FATHER` |
| `MoiQuanHe.ME` | `RelationshipType.MOTHER` |
| `MoiQuanHe.ONG_BA` | `RelationshipType.GRANDPARENT` |
| `MoiQuanHe.NGUOI_GIAM_HO_KHAC` | `RelationshipType.OTHER_GUARDIAN` |
| `Nganh.AU` | `Branch.INFANT` |
| `Nganh.THIEU` | `Branch.JUNIOR` |
| `Nganh.NGHIA` | `Branch.SENIOR` |
| `Nganh.HIEP` | `Branch.ADVENTURER` |
| `Nganh.CHIEN` | `Branch.SOLDIER` |
| `Nganh.DU_TRUONG` | `Branch.JUNIOR_LEADER` |
| `TrangThaiThieuNhi.DANG_HOC` | `MemberStatus.ACTIVE` |
| `TrangThaiThieuNhi.TAM_NGHI` | `MemberStatus.ON_LEAVE` |
| `TrangThaiThieuNhi.DA_NGHI` | `MemberStatus.INACTIVE` |
| `TrangThaiThieuNhi.DA_TOT_NGHIEP` | `MemberStatus.GRADUATED` |
| `NguonGocThieuNhi.DOAN_SINH_MOI` | `MemberOrigin.NEW_MEMBER` |
| `NguonGocThieuNhi.CHUYEN_GIAO_XU` | `MemberOrigin.TRANSFERRED` |
| `NguonGocThieuNhi.QUAY_LAI` | `MemberOrigin.RETURNING` |
| `VaiTroHeThong.BAN_DIEU_HANH` | `SystemRole.EXECUTIVE_COMMITTEE` |
| `VaiTroHeThong.TRUONG_NGANH` | `SystemRole.BRANCH_LEADER` |
| `VaiTroHeThong.TRUONG_LOP` | `SystemRole.CLASS_LEADER` |
| `VaiTroHeThong.HUYNH_TRUONG` | `SystemRole.GROUP_LEADER` |
| `VaiTroHeThong.DU_TRUONG` | `SystemRole.JUNIOR_LEADER` |

### Class & Field

| Tên cũ (VI) | Tên mới (EN) |
|---|---|
| `ThieuNhi` | `Member` |
| `hoVaTen` | `fullName` |
| `tenThanh` | `saintName` |
| `ngaySinh` | `dateOfBirth` |
| `gioiTinh` | `gender` |
| `diaChi` | `address` |
| `soDienThoai` | `phoneNumber` |
| `nganh` | `branch` |
| `trangThai` | `status` |
| `nguonGoc` | `origin` |
| `ngayGiaNhap` | `enrollmentDate` |
| `ghiChu` | `notes` |
| `danhSachPhuHuynh` | `guardians` |
| `PhuHuynh` | `Guardian` |
| `moiQuanHe` | `relationship` |
| `thieuNhi` | `member` |

### API Endpoint

| Cũ | Mới |
|---|---|
| `POST /api/v1/thieu-nhi` | `POST /api/v1/members` |
| `GET /api/v1/thieu-nhi?trangThai=DANG_HOC` | `GET /api/v1/members?status=ACTIVE` |
| `GET /api/v1/thieu-nhi/search?keyword=` | `GET /api/v1/members/search?keyword=` |

</details>
