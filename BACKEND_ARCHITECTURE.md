# Tài liệu Kiến trúc Back-end — TNTT Manager

> **Dự án:** Hệ thống Quản lý Xứ đoàn Thiếu Nhi Thánh Thể Chợ Quán  
> **Stack:** Spring Boot 4.1 · Java 21 · Spring Security 6 · JJWT 0.12.6 · Spring Data JPA · PostgreSQL  
> **Tác giả:** Nguyễn Anh Khoa  
> **Mục đích tài liệu:** Giải thích kiến trúc, tư duy thiết kế, và chuẩn bị phỏng vấn

---

## Mục lục

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Tầng Security — JWT Filter Chain](#2-tầng-security--jwt-filter-chain)
3. [Tầng Controller — REST Design](#3-tầng-controller--rest-design)
4. [Tầng Service — Business Logic](#4-tầng-service--business-logic)
5. [Tầng Repository — Data Access Patterns](#5-tầng-repository--data-access-patterns)
6. [Entity Design & Quan hệ dữ liệu](#6-entity-design--quan-hệ-dữ-liệu)
7. [DTO Pattern — Tách biệt API khỏi Domain](#7-dto-pattern--tách-biệt-api-khỏi-domain)
8. [Xử lý lỗi toàn cục](#8-xử-lý-lỗi-toàn-cục)
9. [Dashboard — Aggregation Strategy](#9-dashboard--aggregation-strategy)
10. [Bộ câu hỏi phỏng vấn bỏ túi](#10-bộ-câu-hỏi-phỏng-vấn-bỏ-túi)

---

## 1. Tổng quan kiến trúc

### 1.1 Mô hình phân tầng (Layered Architecture)

```
┌────────────────────────────────────────────────────────────┐
│                   CLIENT (React SPA)                        │
│             HTTP Request + Authorization: Bearer            │
└───────────────────────────┬────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────┐
│                  SECURITY LAYER                             │
│  JwtAuthenticationFilter → SecurityContext                 │
│  @PreAuthorize → hasAnyRole(...)                           │
└───────────────────────────┬────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────┐
│                 PRESENTATION LAYER (Controller)             │
│  @RestController · @Valid · ResponseEntity<DTO>            │
└───────────────────────────┬────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────┐
│                  BUSINESS LOGIC LAYER (Service)             │
│  Interface + Impl · @Transactional · Entity ↔ DTO mapping  │
└───────────────────────────┬────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────┐
│                  DATA ACCESS LAYER (Repository)             │
│  Spring Data JPA · @EntityGraph · JPQL · Native SQL        │
└───────────────────────────┬────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────┐
│                     PostgreSQL Database                     │
│  Tables: members, leader, classroom, attendance_record ...  │
└────────────────────────────────────────────────────────────┘
```

**Nguyên tắc thiết kế:** Mỗi tầng chỉ giao tiếp với tầng liền kề — Controller không trực tiếp gọi Repository, Service không biết HTTP status code. Đây là **Separation of Concerns (SoC)**: mỗi lớp có **một lý do duy nhất để thay đổi**.

### 1.2 Luồng request đầy đủ

```
[1] HTTP Request đến
         │
         ▼
[2] JwtAuthenticationFilter
    - Đọc "Authorization: Bearer <token>" từ header
    - Gọi JwtTokenProvider.extractUsername(token)
    - Gọi UserDetailsServiceImpl.loadUserByUsername(username)
    - Tạo UsernamePasswordAuthenticationToken
    - Set vào SecurityContextHolder
         │
         ▼
[3] @PreAuthorize("hasAnyRole('ADMIN', ...)")
    - Spring Security đọc authorities từ SecurityContext
    - Nếu không đủ quyền → AccessDeniedException → 403
         │
         ▼
[4] Controller method
    - @Valid kích hoạt Bean Validation trên @RequestBody
    - Nếu validation fail → MethodArgumentNotValidException → 400
    - Gọi service.doSomething(dto)
         │
         ▼
[5] Service method
    - @Transactional mở database transaction
    - Xử lý business logic
    - Gọi repository để truy vấn / lưu dữ liệu
    - Map Entity → ResponseDTO
         │
         ▼
[6] Repository
    - Spring Data JPA tạo SQL tự động từ method name
    - Hoặc chạy @Query (JPQL / Native SQL)
    - Hibernate ánh xạ ResultSet → Entity
         │
         ▼
[7] Response
    - Entity → DTO (ResponseDTO.from(entity))
    - Controller bọc vào ResponseEntity<DTO>
    - Spring MVC serialize thành JSON
    - HTTP Response bay về Client
```

---

## 2. Tầng Security — JWT Filter Chain

### 2.1 Vòng đời của JWT Token

```
[Đăng nhập]
  POST /auth/login { username, password }
         │
         ▼
  AuthenticationManager.authenticate()
    → UserDetailsServiceImpl.loadUserByUsername()  ← tải User từ DB
    → PasswordEncoder.matches(raw, hash)           ← so BCrypt
         │
         ▼
  JwtTokenProvider.generateToken(userDetails)
    → Jwts.builder()
        .subject(username)
        .claim("roles", ["ROLE_ADMIN"])    ← embed roles
        .expiration(now + 24h)
        .signWith(HMAC-SHA256 key)
        .compact()
         │
         ▼
  Response: { "accessToken": "eyJ..." }

──────────────────────────────────────────────────

[Mọi request sau]
  Header: Authorization: Bearer eyJ...
         │
         ▼
  JwtAuthenticationFilter.doFilterInternal()
    → extractUsername(token)                      ← đọc "sub" claim
    → userDetailsService.loadUserByUsername()     ← tải lại từ DB
    → isTokenValid(token, userDetails)            ← kiểm tra exp + username
    → SecurityContextHolder.setAuthentication()  ← gán vào context
```

### 2.2 `JwtTokenProvider` — Tạo và giải mã token

```java
// Tạo token với roles claim
public String generateToken(UserDetails userDetails) {
    List<String> roles = userDetails.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .collect(Collectors.toList());

    return Jwts.builder()
            .subject(userDetails.getUsername())
            .claim("roles", roles)           // ["ROLE_ADMIN"]
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expirationMs))
            .signWith(getSigningKey())        // HMAC-SHA256
            .compact();
}
```

**Điểm quan trọng:** `roles` claim được thêm vào để frontend decode JWT bằng `atob()` và biết quyền của user mà không cần gọi thêm API `/me`. Đây là trade-off giữa **stateless JWT** (không roundtrip DB) và **freshness** (nếu role thay đổi, phải login lại để token cũ hết hiệu lực).

### 2.3 `UserDetailsServiceImpl` — Bridge giữa DB và Spring Security

```java
@Override
public UserDetails loadUserByUsername(String username) {
    User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));

    return org.springframework.security.core.userdetails.User
            .withUsername(user.getUsername())
            .password(user.getPasswordHash())
            .roles(user.getRole().name())    // ADMIN → ROLE_ADMIN
            .build();
}
```

`roles(value)` của Spring Security Builder tự động thêm prefix `ROLE_`. Đây là lý do `@PreAuthorize("hasAnyRole('ADMIN')")` khớp với `ROLE_ADMIN` trong authorities.

### 2.4 `SecurityConfig` — Cấu hình tổng thể

**Các quyết định cấu hình quan trọng:**

| Quyết định | Lý do |
|---|---|
| `sessionCreationPolicy = STATELESS` | Không dùng HTTP Session — mỗi request tự xác thực bằng JWT |
| `csrf.disable()` | API REST không dùng form-based CSRF; JWT header-based không bị CSRF tấn công |
| `@EnableMethodSecurity` | Bật `@PreAuthorize` ở Controller level thay vì chỉ cấu hình ở SecurityConfig |
| `addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter)` | JWT filter chạy trước filter xác thực mặc định |
| `permitAll()` cho `/auth/login`, `/users` | Các endpoint này không cần token |

---

## 3. Tầng Controller — REST Design

### 3.1 Convention chung

```java
@RestController
@RequestMapping("/api/v1/classrooms")
@RequiredArgsConstructor
public class ClassroomController {

    @GetMapping                     // GET  /classrooms?year=2024-2025
    @PostMapping                    // POST /classrooms → 201 Created
    @PutMapping("/{id}")            // PUT  /classrooms/{id} → 200 OK
    @DeleteMapping("/{id}")         // DELETE /classrooms/{id} → 204 No Content
}
```

**REST Status codes được dùng nhất quán:**

| HTTP Method | Success Status | Ý nghĩa |
|---|---|---|
| `GET` | `200 OK` | Trả về resource |
| `POST` (tạo mới) | `201 Created` | Resource được tạo |
| `PUT` (cập nhật) | `200 OK` | Trả về resource sau cập nhật |
| `DELETE` | `204 No Content` | Xóa thành công, không có body |
| `PUT /evaluate` | `204 No Content` | Side-effect only, không trả entity |

### 3.2 Phân quyền bằng `@PreAuthorize`

```java
// Chỉ Admin và Ban điều hành mới quản lý Huynh Trưởng
@PreAuthorize("hasAnyRole('ADMIN', 'EXECUTIVE_COMMITTEE')")
@PostMapping
public ResponseEntity<LeaderResponseDTO> createLeader(@Valid @RequestBody LeaderRequestDTO dto) {
    return ResponseEntity.status(HttpStatus.CREATED).body(leaderService.createLeader(dto));
}

// Trưởng ngành trở lên mới quản lý Lớp học
@PreAuthorize("hasAnyRole('ADMIN', 'EXECUTIVE_COMMITTEE', 'BRANCH_LEADER')")
@PutMapping("/{id}")
public ResponseEntity<ClassroomResponseDTO> updateClassroom(...) { ... }
```

**Tại sao không dùng SecurityConfig thay vì @PreAuthorize?**  
`SecurityConfig.authorizeHttpRequests()` chỉ ánh xạ được theo URL pattern. `@PreAuthorize` cho phép áp dụng rule theo method — ví dụ: GET (public), nhưng POST/PUT/DELETE (admin only) trên cùng một endpoint path. Điều này không thể biểu diễn bằng URL pattern.

### 3.3 Validation với `@Valid`

```java
@PostMapping
public ResponseEntity<MemberResponseDTO> createMember(
        @Valid @RequestBody MemberRequestDTO dto) { ... }
```

`@Valid` kích hoạt Jakarta Bean Validation trên DTO. Nếu bất kỳ constraint nào fail (`@NotBlank`, `@Past`, `@Pattern`), Spring tự động ném `MethodArgumentNotValidException` → `GlobalExceptionHandler` bắt → trả về `400 Bad Request` với message chi tiết.

**Lợi ích:** Controller luôn nhận DTO đã validated — không cần `if (dto.getName() == null)` manual check.

---

## 4. Tầng Service — Business Logic

### 4.1 Interface + Impl Pattern

```
ClassroomService (interface)          ClassroomServiceImpl (class)
────────────────────────────          ────────────────────────────
createClassroom()                 ←→  @Transactional
updateClassroom()                 ←→  @Transactional
deleteClassroom()                 ←→  @Transactional
getClassroomsByYear()             ←→  (readOnly)
enrollStudentToClass()            ←→  @Transactional
```

**Lý do tách Interface:** Cho phép mock dễ dàng trong unit test (`@MockBean ClassroomService`). Nếu business logic thay đổi, Controller không cần sửa — chỉ sửa Impl.

### 4.2 `@Transactional` Strategy

```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)   // Class-level: mặc định tất cả method là read-only
public class ClassroomServiceImpl implements ClassroomService {

    @Override
    @Transactional                // Method-level override: đây là ghi → cần full transaction
    public ClassroomResponseDTO createClassroom(ClassroomRequestDTO dto) {
        Classroom saved = classroomRepository.save(dto.toEntity());
        return ClassroomResponseDTO.from(saved);
    }

    @Override
    // Không cần annotation → kế thừa readOnly = true từ class
    public List<ClassroomResponseDTO> getClassroomsByYear(String academicYear) { ... }
}
```

**Tại sao `readOnly = true` quan trọng?**

1. **Hibernate tắt dirty-checking** — không scan toàn bộ entities trong session để tìm thay đổi khi commit
2. **Database có thể route đến read replica** nếu dùng replication
3. **Tường minh về ý định** — reviewer biết ngay method này không ghi DB

### 4.3 Business Logic tập trung

Ví dụ `StudentProgressServiceImpl.evaluate()`:

```java
// Service tính TB và xếp loại — không phải Controller, không phải DB trigger
double avg = catechismScore * 0.7 + attendanceScore * 0.3;
AcademicPerformance performance = avg >= 8.5 ? EXCELLENT
                                : avg >= 7.0 ? GOOD
                                : avg >= 5.0 ? AVERAGE
                                :              WEAK;
boolean promoted = performance != WEAK;

progress.setCatechismScore(catechismScore);
progress.setAttendanceScore(attendanceScore);
progress.setPerformance(performance);
progress.setPromoted(promoted);
```

**Nguyên tắc:** Business rules sống trong Service layer — không nằm ở Controller (không biết domain), không nằm ở DB trigger (khó test, khó debug).

---

## 5. Tầng Repository — Data Access Patterns

### 5.1 Ba kiểu query được dùng trong dự án

#### Kiểu 1: Derived Query (Spring Data tự tạo SQL)

```java
// Spring Data JPA đọc tên method → tự tạo: SELECT ... FROM leader WHERE status = ?
long countByStatus(LeaderStatus status);

// SELECT ... FROM classroom WHERE academic_year = ?
List<Classroom> findByAcademicYear(String academicYear);
```

**Ưu điểm:** Không viết SQL, không lỗi typo, type-safe.  
**Hạn chế:** Chỉ dùng được cho query đơn giản (1-2 điều kiện).

---

#### Kiểu 2: JPQL (`@Query` — HQL/Entity Query)

```java
// JPQL — tham chiếu Entity class và field, không phải tên bảng SQL
@Query("SELECT m.branch, COUNT(m) FROM Member m WHERE m.status = :status GROUP BY m.branch")
List<Object[]> countByBranchAndStatus(@Param("status") MemberStatus status);

// JOIN FETCH để tránh N+1 trong một query
@Query("""
    SELECT DISTINCT r
    FROM AttendanceRecord r
    JOIN FETCH r.session s
    JOIN FETCH s.classroom c
    WHERE s.sessionDate BETWEEN :start AND :end
    """)
List<AttendanceRecord> findWithClassroomByDateRange(
        @Param("start") LocalDate start,
        @Param("end")   LocalDate end);
```

**`DISTINCT` trong JOIN FETCH:** Khi JOIN một-nhiều (session có nhiều record), SQL sinh ra nhiều dòng trùng lặp. `DISTINCT` ở JPQL loại bỏ trùng lặp ở application level, không phải ở SQL level (Hibernate xử lý).

**`JOIN FETCH` thay vì `JOIN`:** `JOIN` đơn thuần chỉ dùng để lọc. `JOIN FETCH` tải luôn entity liên quan vào session — tránh lazy-loading N+1 problem.

---

#### Kiểu 3: Native SQL (`nativeQuery = true`)

```java
// Dùng PostgreSQL native function: unaccent(), lower()
// Không thể viết bằng JPQL vì đây là function thuần PostgreSQL
@Query(
    value = """
        SELECT * FROM members
        WHERE unaccent(lower(ho_va_ten || ' ' || coalesce(ten_thanh, '')))
              LIKE unaccent(lower(concat('%', :keyword, '%')))
        """,
    countQuery = "SELECT count(*) FROM members WHERE ...",
    nativeQuery = true
)
Page<Member> searchByName(@Param("keyword") String keyword, Pageable pageable);
```

**Khi nào dùng Native SQL:** Khi cần tính năng database-specific (`unaccent`, `pg_trgm`, JSON operators) mà JPQL không hỗ trợ. **Cần `countQuery`** khi trả về `Page<T>` vì Spring Data cần query đếm tổng để tính `totalPages`.

### 5.2 `@EntityGraph` — Giải quyết N+1 Problem

```java
// Không có @EntityGraph: findByStatus() tải Member, rồi mỗi member.getGuardians()
// tạo thêm 1 query → 200 members = 201 queries (N+1 problem)

// Với @EntityGraph: Hibernate dùng LEFT JOIN FETCH, tải tất cả trong 1 query
@EntityGraph(attributePaths = "guardians")
Page<Member> findByStatus(MemberStatus status, Pageable pageable);
```

**N+1 Problem giải thích:**
```
Query 1: SELECT * FROM members WHERE status = 'ACTIVE'         → 200 rows
Query 2: SELECT * FROM guardian WHERE member_id = 'uuid-1'    → guardian của member 1
Query 3: SELECT * FROM guardian WHERE member_id = 'uuid-2'    → guardian của member 2
...
Query 201: SELECT * FROM guardian WHERE member_id = 'uuid-200'
```

Với `@EntityGraph`, toàn bộ trở thành 1 query duy nhất với `LEFT JOIN`.

### 5.3 Pagination với `Pageable`

```java
// Controller
Pageable pageable = PageRequest.of(page, size, Sort.by("fullName").ascending());
return leaderRepository.findAll(pageable);

// Repository — Spring Data tự inject LIMIT, OFFSET, ORDER BY
Page<Leader> findAll(Pageable pageable);
```

Spring Data JPA tự sinh:
```sql
SELECT * FROM leader ORDER BY full_name ASC LIMIT 10 OFFSET 0
SELECT count(*) FROM leader   -- cho totalElements
```

---

## 6. Entity Design & Quan hệ dữ liệu

### 6.1 Các JPA Annotation quan trọng

```java
@Entity
@Table(name = "members")
public class Member {

    @Id
    @UuidGenerator                          // Hibernate tự sinh UUID khi save
    private UUID id;

    @Column(name = "ho_va_ten", nullable = false)
    private String fullName;

    @Enumerated(EnumType.STRING)            // Lưu "ACTIVE" thay vì số thứ tự 0, 1, 2
    private MemberStatus status;

    @OneToMany(mappedBy = "member",         // FK nằm ở bảng guardian
               cascade = CascadeType.ALL,   // Xóa Member → xóa Guardian theo
               orphanRemoval = true)
    private List<Guardian> guardians = new ArrayList<>();

    @CreationTimestamp                      // Hibernate tự set khi INSERT
    private OffsetDateTime createdAt;

    @UpdateTimestamp                        // Hibernate tự set khi UPDATE
    private OffsetDateTime updatedAt;
}
```

### 6.2 Quyết định thiết kế: `@Enumerated(EnumType.STRING)` thay vì `ORDINAL`

**`EnumType.ORDINAL` (không dùng):** Lưu số thứ tự (0, 1, 2...). Nếu ai thêm enum value vào giữa, toàn bộ dữ liệu cũ bị sai nghĩa.

**`EnumType.STRING` (đang dùng):** Lưu tên ("ACTIVE", "INACTIVE"). Thêm enum value ở bất kỳ vị trí nào cũng an toàn. Trade-off: tốn thêm bytes nhưng readable hơn khi đọc trực tiếp DB.

### 6.3 Quyết định thiết kế: UUID thay vì Auto-increment Long

```java
@Id
@UuidGenerator  // Sinh UUID v7 (time-ordered) — tốt hơn UUID v4 cho B-tree index
private UUID id;
```

| Tiêu chí | Auto-increment Long | UUID |
|---|---|---|
| Bảo mật | `id=1,2,3` dễ đoán — lộ tổng số records | UUID không đoán được |
| Performance (index) | Tuần tự → B-tree insert hiệu quả | UUID v4 random → index fragmentation (dùng UUID v7 để giải quyết) |
| Distributed system | Xung đột nếu nhiều nguồn sinh ID | Không xung đột |
| Readability | Dễ debug, log | Dài hơn |

---

## 7. DTO Pattern — Tách biệt API khỏi Domain

### 7.1 Tại sao không trả Entity trực tiếp?

```java
// ❌ SAI: Trả trực tiếp Entity
@GetMapping("/{id}")
public Member getMember(@PathVariable UUID id) {
    return memberRepository.findById(id).orElseThrow();
}
```

**Vấn đề:**
1. **Lộ cấu trúc database:** Client biết tên cột, quan hệ bảng → security risk
2. **Lazy-loading exception:** Jackson serialize Entity → trigger lazy load ngoài transaction → `LazyInitializationException`
3. **Không kiểm soát được response shape:** Không thể thêm computed field, rename field, hay ẩn field nhạy cảm (`passwordHash`)
4. **Coupling:** Đổi Entity → vỡ API contract với client

### 7.2 Request DTO — Validation + Mapping

```java
public class ClassroomRequestDTO {

    @NotBlank(message = "Class name is required")
    private String className;

    @NotBlank
    private String academicYear;

    @NotNull
    private Branch division;

    // Mapping vào Entity thuần túy — không có logic nghiệp vụ
    public Classroom toEntity() {
        return Classroom.builder()
                .className(this.className)
                .academicYear(this.academicYear)
                .division(this.division)
                .build();
    }
}
```

**Pattern `toEntity()` trong RequestDTO:** Đặt logic mapping ở trong DTO thay vì Service giúp Service gọn hơn. Nhưng nếu mapping phức tạp (join nhiều entity, tính toán), đưa vào Service.

### 7.3 Response DTO — Static Factory Method

```java
@Getter
@Builder
public class ClassroomResponseDTO {
    private UUID id;
    private String className;
    private String academicYear;
    private Branch division;

    // Static factory — tách biệt việc "tạo DTO từ Entity" thành một nơi duy nhất
    public static ClassroomResponseDTO from(Classroom classroom) {
        return ClassroomResponseDTO.builder()
                .id(classroom.getId())
                .className(classroom.getClassName())
                .academicYear(classroom.getAcademicYear())
                .division(classroom.getDivision())
                .build();
    }
}
```

**`@Builder` của Lombok:** Tạo builder pattern, tránh constructor với quá nhiều tham số (telescoping constructor problem). Cú pháp `.builder().field(value).build()` dễ đọc, dễ thêm field mới.

---

## 8. Xử lý lỗi toàn cục

### 8.1 `GlobalExceptionHandler` — Centralized Error Handling

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    // 400 — Validation fail
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.joining(", "));
        return ResponseEntity.badRequest()
                .body(new ErrorResponse(400, message));
    }

    // 404 — Resource không tìm thấy
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse(404, ex.getMessage()));
    }

    // 403 — Không đủ quyền
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ErrorResponse(403, "Access denied"));
    }
}
```

**`@RestControllerAdvice`** = `@ControllerAdvice` + `@ResponseBody`. Tất cả exception handler trong class này tự động áp dụng cho **mọi** `@RestController` trong ứng dụng.

**Lợi ích so với try-catch trong Controller:**
- Không lặp code xử lý lỗi ở 8 controller
- Response error **nhất quán** về format (`{ timestamp, status, message }`)
- Controller code sạch — chỉ chứa happy path

### 8.2 `ResourceNotFoundException` — Custom Exception

```java
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
```

`RuntimeException` (unchecked) — không cần khai báo `throws` trong method signature. Service ném exception này khi `findById()` trả về empty, và `GlobalExceptionHandler` bắt ở tầng trên.

---

## 9. Dashboard — Aggregation Strategy

### 9.1 Thiết kế `DashboardServiceImpl`

Dashboard cần dữ liệu từ 4 repository khác nhau và tổng hợp thành một response phức tạp. Đây là pattern **Aggregation Service** — một service chuyên tổng hợp dữ liệu từ nhiều nguồn.

```java
@Override
public DashboardStatsResponseDTO getDashboardStats() {
    LocalDate today = LocalDate.now();

    // ── Headline counts (3 query đơn giản)
    long totalStudents   = memberRepository.countByStatus(ACTIVE);
    long activeLeaders   = leaderRepository.countByStatus(ACTIVE);
    long totalClassrooms = classroomRepository.count();

    // ── Weekly rate (2 query có điều kiện ngày)
    LocalDate weekStart = today.minusDays(6);
    long present = attendanceRecordRepository.countBySessionDateBetweenAndStatus(weekStart, today, PRESENT);
    long total   = attendanceRecordRepository.countBySessionDateBetween(weekStart, today);
    double weeklyRate = total > 0 ? round1dp(present * 100.0 / total) : 0.0;

    // ── Trend 4 tuần (loop 4 lần × 2 query = 8 query)
    List<WeeklyAttendanceDTO> trend = new ArrayList<>();
    for (int weeksAgo = 3; weeksAgo >= 0; weeksAgo--) {
        LocalDate end   = today.minusDays(weeksAgo * 7L);
        LocalDate start = end.minusDays(6);
        // ... tương tự tính rate
    }

    // ── Branch distribution (1 GROUP BY query)
    List<Object[]> branchRows = memberRepository.countByBranchAndStatus(ACTIVE);

    // ── High absence classes (1 JOIN FETCH query + Java aggregation)
    List<AttendanceRecord> weekRecords = attendanceRecordRepository.findWithClassroomByDateRange(weekStart, today);
    // Group by className+academicYear trong Java Map → sort → limit 5
    ...
}
```

### 9.2 Quyết định: Aggregation ở Java thay vì SQL

**Phương án SQL (không chọn):**
```sql
SELECT c.class_name, c.academic_year,
       COUNT(CASE WHEN r.status != 'PRESENT' THEN 1 END) AS absent,
       COUNT(*) AS total,
       ROUND(COUNT(CASE WHEN r.status != 'PRESENT' THEN 1 END) * 100.0 / COUNT(*), 1) AS rate
FROM attendance_record r
JOIN attendance_session s ON r.session_id = s.id
JOIN classroom c ON s.classroom_id = c.id
WHERE s.session_date BETWEEN :start AND :end
GROUP BY c.class_name, c.academic_year
ORDER BY rate DESC
LIMIT 5
```

**Phương án Java (đang dùng):**
```java
Map<String, long[]> classStats = new LinkedHashMap<>();
for (AttendanceRecord r : weekRecords) {
    String key = classroom.getClassName() + "|" + classroom.getAcademicYear();
    classStats.computeIfAbsent(key, k -> new long[2]);
    if (r.getStatus() != PRESENT) classStats.get(key)[0]++;
    classStats.get(key)[1]++;
}
// Sort và limit trong Java stream
```

**Lý do chọn Java aggregation:**
1. **Dễ unit test hơn:** Test Java logic dễ hơn test SQL query
2. **Tránh viết SQL phức tạp:** `CASE WHEN` trong SQL ít readable hơn Java
3. **JOIN FETCH sẵn có:** Query đã load đủ dữ liệu — không cần thêm SQL GROUP BY
4. **Business logic tập trung:** Logic tính tỷ lệ sống trong Service, không nằm rải rác ở SQL

**Trade-off:** Nếu dữ liệu lớn (vài chục nghìn records/tuần), nên chuyển sang SQL aggregation để tránh transfer dữ liệu thừa từ DB về application.

---

## 10. Bộ câu hỏi phỏng vấn bỏ túi

---

### Câu hỏi 1: "Tại sao em dùng JWT thay vì Session trong dự án này?"

**Gợi ý trả lời ăn điểm:**

> "Em chọn JWT vì phù hợp với kiến trúc của dự án: backend Spring Boot là **stateless REST API**, frontend React là SPA giao tiếp hoàn toàn qua HTTP.
>
> Session-based auth yêu cầu server lưu trạng thái — mỗi request server phải tra cứu session từ memory hoặc database. Với JWT, server chỉ cần verify chữ ký cryptographic — **không cần storage**, không cần database roundtrip cho mỗi request.
>
> Trong dự án này, em embed thêm `roles` claim vào JWT payload. Frontend decode bằng `atob()` để biết quyền của user ngay từ token, không cần gọi thêm `/me` API. Trade-off là khi admin đổi role của user, user phải login lại để nhận token mới có roles mới.
>
> Về bảo mật: JWT lưu `localStorage` dễ bị XSS hơn `httpOnly Cookie`. Trong production thực tế, em sẽ dùng `httpOnly + Secure Cookie` với CSRF token để an toàn hơn."

**Từ khóa:** `stateless`, `cryptographic signature`, `roles claim`, `httpOnly Cookie vs localStorage`, `XSS vs CSRF`.

---

### Câu hỏi 2: "Giải thích N+1 Problem và em đã xử lý như thế nào?"

**Gợi ý trả lời ăn điểm:**

> "N+1 problem xảy ra khi tải 1 list entity (1 query), rồi với mỗi entity lại trigger thêm 1 query để tải collection liên quan. Tải 100 Member → 1 query SELECT members, rồi 100 query SELECT guardians WHERE member_id = ? → tổng 101 queries.
>
> Trong dự án, `MemberRepository.findByStatus()` trả về `Page<Member>` cùng guardians. Nếu để Hibernate lazy-load, mỗi lần gọi `member.getGuardians()` ngoài transaction sẽ ném `LazyInitializationException`.
>
> Em giải quyết bằng `@EntityGraph(attributePaths = 'guardians')` — Hibernate dùng `LEFT JOIN FETCH` để load Member và Guardian trong **một query duy nhất**. Kết quả là response nhanh hơn và không bị exception.
>
> Với Dashboard, em dùng `JOIN FETCH r.session s JOIN FETCH s.classroom c` trong JPQL để tải AttendanceRecord kèm Session và Classroom trong một query, sau đó aggregate trong Java."

**Từ khóa:** `N+1 problem`, `@EntityGraph`, `LEFT JOIN FETCH`, `LazyInitializationException`, `eager loading`.

---

### Câu hỏi 3: "Mô tả `@Transactional` trong dự án. Tại sao dùng `readOnly = true` ở class level?"

**Gợi ý trả lời ăn điểm:**

> "Em đặt `@Transactional(readOnly = true)` ở **class level** cho tất cả ServiceImpl. Điều này nghĩa là mặc định, mọi method trong class là read-only transaction.
>
> Khi `readOnly = true`, Hibernate tắt **dirty-checking** — cơ chế so sánh trạng thái entity trước và sau transaction để biết cần flush gì xuống DB. Với 200 Member trong session, dirty-checking quét toàn bộ 200 đối tượng khi commit — tốn CPU. Read-only tắt cơ chế này.
>
> Các method ghi (`createClassroom`, `deleteClassroom`) override lại bằng `@Transactional` ở method level, cho phép Hibernate thực sự lưu dữ liệu.
>
> Ngoài ra, `readOnly = true` giúp code reviewer hiểu ngay intent của method — đây là query method, không có side effects. Và nếu sau này dùng database replication, read-only transaction có thể được route tới read replica."

**Từ khóa:** `dirty-checking`, `flush`, `class-level vs method-level`, `read replica routing`, `intent communication`.

---

### Câu hỏi 4: "Tại sao dùng DTO thay vì trả Entity trực tiếp từ Controller?"

**Gợi ý trả lời ăn điểm:**

> "Có 3 lý do chính em dùng DTO:
>
> **Bảo mật và kiểm soát output:** Entity có thể chứa field nhạy cảm như `passwordHash`. Nếu serialize trực tiếp, client nhận được dữ liệu không nên biết. DTO chỉ expose đúng field cần thiết.
>
> **Tránh lỗi kỹ thuật:** Jackson serialize Entity với lazy relationship sẽ trigger lazy-loading ngoài transaction → `LazyInitializationException` hoặc infinite loop (bidirectional relationship). DTO giải quyết bằng cách flatten dữ liệu cần thiết.
>
> **API Stability:** Entity là database model — thay đổi tên cột ảnh hưởng toàn bộ client. DTO là API contract — em có thể đổi tên cột trong Entity nhưng giữ nguyên DTO, client không biết.
>
> Em dùng pattern `ResponseDTO.from(entity)` — static factory method trong chính DTO class. Việc mapping tập trung ở một nơi, dễ tìm và dễ sửa."

**Từ khóa:** `API contract`, `LazyInitializationException`, `passwordHash exposure`, `static factory method`, `separation of concerns`.

---

### Câu hỏi 5: "Em thiết kế GlobalExceptionHandler như thế nào? Tại sao không try-catch trong Controller?"

**Gợi ý trả lời ăn điểm:**

> "Em dùng `@RestControllerAdvice` để tập trung xử lý exception tại một nơi thay vì try-catch trong từng Controller method.
>
> Nếu try-catch trong Controller, với 8 controller × mỗi controller 4-5 method = 40+ chỗ bắt exception, code trùng lặp và format error response có thể khác nhau. Với `GlobalExceptionHandler`, tất cả exception được xử lý nhất quán và trả về cùng format `{ timestamp, status, message }`.
>
> Cụ thể em xử lý 4 loại exception: `MethodArgumentNotValidException` (400 — validation fail, Spring tự ném khi `@Valid` fail), `ResourceNotFoundException` (404 — custom exception em tự tạo), `AccessDeniedException` (403 — Spring Security ném khi `@PreAuthorize` fail), và `RuntimeException` (500 — fallback cho lỗi không mong đợi).
>
> `ResourceNotFoundException` là unchecked (extends RuntimeException) — không cần khai báo `throws`, Spring tự bubble up và `@RestControllerAdvice` bắt."

**Từ khóa:** `@RestControllerAdvice`, `cross-cutting concern`, `exception hierarchy`, `unchecked exception`, `consistent error format`.

---

## Phụ lục: Sơ đồ dependency giữa các package

```
controller
    └──► service (interface)
              └──► repository (interface)
                        └──► entity

controller
    └──► dto.request  (nhận input)
    └──► dto.response (trả output)

service
    └──► dto.request  (đọc input từ controller)
    └──► dto.response (tạo output cho controller)
    └──► entity       (làm việc với domain objects)

entity
    └──► enums        (không phụ thuộc gì khác)
```

**Nguyên tắc:** Không có circular dependency. `entity` không biết về `dto`. `repository` không biết về `controller`. Dependency chỉ đi theo một chiều từ ngoài vào trong.

---

*Tài liệu này tập trung vào "tại sao" của từng quyết định kỹ thuật — đây là điều phỏng vấn viên thực sự muốn nghe, không chỉ là "cái gì".*
