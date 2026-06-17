# TNTT Manager

## Bảng đổi tên Vietnamese → English

### Enums

#### `GioiTinh` → `Gender`
| Cũ | Mới |
|---|---|
| `NAM` | `MALE` |
| `NU` | `FEMALE` |

---

#### `MoiQuanHe` → `RelationshipType`
| Cũ | Mới |
|---|---|
| `CHA` | `FATHER` |
| `ME` | `MOTHER` |
| `ONG_BA` | `GRANDPARENT` |
| `NGUOI_GIAM_HO_KHAC` | `OTHER_GUARDIAN` |

---

#### `Nganh` → `Branch`
| Cũ | Mới |
|---|---|
| `CHIEN` | `SOLDIER` |
| `AU` | `INFANT` |
| `THIEU` | `JUNIOR` |
| `NGHIA` | `SENIOR` |
| `HIEP` | `ADVENTURER` |
| `DU_TRUONG` | `JUNIOR_LEADER` |

---

#### `NguonGocThieuNhi` → `MemberOrigin`
| Cũ | Mới |
|---|---|
| `DOAN_SINH_MOI` | `NEW_MEMBER` |
| `CHUYEN_GIAO_XU` | `TRANSFERRED` |
| `QUAY_LAI` | `RETURNING` |

---

#### `TrangThaiThieuNhi` → `MemberStatus`
| Cũ | Mới |
|---|---|
| `DANG_HOC` | `ACTIVE` |
| `TAM_NGHI` | `ON_LEAVE` |
| `DA_NGHI` | `INACTIVE` |
| `DA_TOT_NGHIEP` | `GRADUATED` |

---

#### `VaiTroHeThong` → `SystemRole`
| Cũ | Mới |
|---|---|
| `ADMIN` | `ADMIN` |
| `BAN_DIEU_HANH` | `EXECUTIVE_COMMITTEE` |
| `TRUONG_NGANH` | `BRANCH_LEADER` |
| `TRUONG_LOP` | `CLASS_LEADER` |
| `HUYNH_TRUONG` | `GROUP_LEADER` |
| `DU_TRUONG` | `JUNIOR_LEADER` |

---

### Classes & Fields

#### `ThieuNhi` → `Member`
| Cũ | Mới |
|---|---|
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
| `addPhuHuynh()` | `addGuardian()` |
| `removePhuHuynh()` | `removeGuardian()` |

---

#### `PhuHuynh` → `Guardian`
| Cũ | Mới |
|---|---|
| `hoVaTen` | `fullName` |
| `soDienThoai` | `phoneNumber` |
| `moiQuanHe` | `relationship` |
| `thieuNhi` | `member` |

---

### DTOs

#### `ThieuNhiRequestDTO` → `MemberRequestDTO`
| Cũ | Mới |
|---|---|
| `hoVaTen` | `fullName` |
| `tenThanh` | `saintName` |
| `ngaySinh` | `dateOfBirth` |
| `gioiTinh` | `gender` |
| `diaChi` | `address` |
| `soDienThoai` | `phoneNumber` |
| `nganh` | `branch` |
| `nguonGoc` | `origin` |
| `ngayGiaNhap` | `enrollmentDate` |
| `ghiChu` | `notes` |

---

#### `ThieuNhiResponseDTO` → `MemberResponseDTO`
| Cũ | Mới |
|---|---|
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

---

### Service & Repository Methods

#### `ThieuNhiService` → `MemberService`
| Cũ | Mới |
|---|---|
| `taoMoiThieuNhi()` | `createMember()` |
| `layDanhSachTheoTrangThai()` | `getMembersByStatus()` |
| `timKiemThieuNhi()` | `searchMembers()` |

---

#### `ThieuNhiRepository` → `MemberRepository`
| Cũ | Mới |
|---|---|
| `timKiemTheoTen()` | `searchByName()` |
| `findByTrangThai()` | `findByStatus()` |

---

### API Endpoints

| Cũ | Mới |
|---|---|
| `POST /api/v1/thieu-nhi` | `POST /api/v1/members` |
| `GET /api/v1/thieu-nhi?trangThai=DANG_HOC` | `GET /api/v1/members?status=ACTIVE` |
| `GET /api/v1/thieu-nhi/search?keyword=` | `GET /api/v1/members/search?keyword=` |
