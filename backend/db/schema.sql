-- ============================================================
-- Lược đồ CSDL off-chain của hệ thống quản lý tín chỉ carbon.
--
-- Nhóm 1 (theo CAD Trust V2.0, rút gọn cho phạm vi đồ án):
--   projects, project_locations, stakeholders, validations, verifications, issuances, units
-- Nhóm 2 (riêng của ứng dụng, tách khỏi mô hình CAD Trust):
--   app_users, auth_nonces, documents, issuance_requests, retirements,
--   emission_declarations, chain_events, sync_state
--
-- Tên cột đặt theo snake_case của các trường CAD Trust (projectId -> project_id,
-- unitBlockStart -> unit_block_start, ...). CẦN ĐỐI CHIẾU lại với từ điển dữ liệu
-- chính thức của CAD Trust V2.0 trước khi đưa vào báo cáo.
-- Quyền sở hữu và trạng thái hủy lấy on-chain làm gốc; bảng units/retirements là bản sao
-- do bộ đồng bộ sự kiện (src/indexer.js) ghi, không sửa tay.
-- ============================================================

-- ---------- Nhóm 2: tài khoản ứng dụng ----------
CREATE TABLE IF NOT EXISTS app_users (
    wallet_address   VARCHAR(42) PRIMARY KEY,            -- chữ thường
    role             VARCHAR(20) NOT NULL
        CHECK (role IN ('ADMIN', 'VERIFIER', 'PROJECT_OWNER', 'BUYER')),
    organization     VARCHAR(255),
    email            VARCHAR(255),
    created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_nonces (
    wallet_address   VARCHAR(42) PRIMARY KEY,
    nonce            VARCHAR(64) NOT NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ---------- Nhóm 1: CAD Trust ----------
CREATE TABLE IF NOT EXISTS projects (
    id                   SERIAL PRIMARY KEY,               -- warehouseProjectId (nội bộ)
    project_id           VARCHAR(100) NOT NULL UNIQUE,     -- mã dự án trên hệ thống đăng ký gốc
    origin_project_id    VARCHAR(100),
    registry_of_origin   VARCHAR(100) NOT NULL DEFAULT 'DATN Carbon Registry',
    current_registry     VARCHAR(100) NOT NULL DEFAULT 'DATN Carbon Registry',
    program              VARCHAR(100),                     -- VCS, GS, JCM, nội địa...
    project_name         VARCHAR(255) NOT NULL,
    project_link         VARCHAR(500),
    project_developer    VARCHAR(255),
    sector               VARCHAR(100),
    project_type         VARCHAR(100),
    covered_by_ndc       VARCHAR(50),                      -- Inside NDC / Outside NDC / Unknown
    methodology          VARCHAR(100),
    project_status       VARCHAR(30) NOT NULL DEFAULT 'Listed'
        CHECK (project_status IN ('Listed', 'Validated', 'Registered', 'Completed', 'Withdrawn')),
    owner_address        VARCHAR(42) NOT NULL REFERENCES app_users(wallet_address),
    description          TEXT,
    created_at           TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_locations (
    id               SERIAL PRIMARY KEY,
    project_id       INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    country          VARCHAR(100) NOT NULL DEFAULT 'Viet Nam',
    in_country_region VARCHAR(255),
    geographic_identifier VARCHAR(255)                     -- toạ độ hoặc mã GIS
);

CREATE TABLE IF NOT EXISTS stakeholders (
    id               SERIAL PRIMARY KEY,
    project_id       INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    organization     VARCHAR(255) NOT NULL,
    stakeholder_role VARCHAR(100) NOT NULL                 -- Project Developer, VVB, Owner...
);

CREATE TABLE IF NOT EXISTS validations (
    id               SERIAL PRIMARY KEY,
    project_id       INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    validation_body  VARCHAR(255) NOT NULL,
    validation_date  DATE,
    document_hash    VARCHAR(66)
);

-- Mỗi đợt thẩm định (verification) gắn với một yêu cầu cấp tín chỉ được VVB phê duyệt.
CREATE TABLE IF NOT EXISTS verifications (
    id                      SERIAL PRIMARY KEY,
    project_id              INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    verification_body       VARCHAR(255) NOT NULL,
    verifier_address        VARCHAR(42) NOT NULL,
    verification_date       DATE NOT NULL,
    reporting_period_start  DATE,
    reporting_period_end    DATE,
    document_hash           VARCHAR(66) NOT NULL UNIQUE
);

-- Đợt cấp: tạo khi bộ đồng bộ đọc được sự kiện CreditMinted.
CREATE TABLE IF NOT EXISTS issuances (
    id                      SERIAL PRIMARY KEY,
    project_id              INTEGER NOT NULL REFERENCES projects(id),
    verification_id         INTEGER REFERENCES verifications(id),
    token_id                INTEGER NOT NULL UNIQUE,       -- NFT lô tín chỉ on-chain
    vintage_year            INTEGER NOT NULL,
    unit_block_start        BIGINT NOT NULL,
    unit_block_end          BIGINT NOT NULL,
    unit_count              BIGINT NOT NULL,
    document_hash           VARCHAR(66) NOT NULL UNIQUE,
    verifier_address        VARCHAR(42) NOT NULL,
    tx_hash                 VARCHAR(66) NOT NULL,
    issued_at               TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Khối tín chỉ (Units). Khi hủy một phần, khối được tách: phần đã hủy thành một dòng
-- trạng thái Retired, phần còn lại giữ trạng thái Held với unit_block_start dời lên.
CREATE TABLE IF NOT EXISTS units (
    id                  SERIAL PRIMARY KEY,
    issuance_id         INTEGER NOT NULL REFERENCES issuances(id),
    token_id            INTEGER NOT NULL,
    unit_owner          VARCHAR(42),                       -- ví đang giữ (địa chỉ pool nếu đang trong pool)
    unit_block_start    BIGINT NOT NULL,
    unit_block_end      BIGINT NOT NULL,
    unit_count          BIGINT NOT NULL,
    vintage_year        INTEGER NOT NULL,
    unit_status         VARCHAR(20) NOT NULL CHECK (unit_status IN ('Held', 'Retired')),
    in_pool             BOOLEAN NOT NULL DEFAULT FALSE,
    unit_status_reason  VARCHAR(500),
    retirement_beneficiary VARCHAR(255),
    retirement_date     TIMESTAMP,
    certificate_id      INTEGER UNIQUE,
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ---------- Nhóm 2: quy trình nghiệp vụ ----------
CREATE TABLE IF NOT EXISTS documents (
    id               SERIAL PRIMARY KEY,
    sha3_hash        VARCHAR(66) NOT NULL UNIQUE,          -- keccak256 nội dung tệp
    file_name        VARCHAR(255) NOT NULL,
    storage_path     VARCHAR(500) NOT NULL,                -- đường dẫn cục bộ hoặc URI IPFS
    uploaded_by      VARCHAR(42) NOT NULL,
    uploaded_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS issuance_requests (
    id                      SERIAL PRIMARY KEY,
    project_id              INTEGER NOT NULL REFERENCES projects(id),
    requested_by            VARCHAR(42) NOT NULL,
    vintage_year            INTEGER NOT NULL,
    quantity                BIGINT NOT NULL CHECK (quantity > 0),
    reporting_period_start  DATE,
    reporting_period_end    DATE,
    monitoring_doc_hash     VARCHAR(66) NOT NULL,          -- báo cáo giám sát của chủ dự án
    verification_doc_hash   VARCHAR(66),                   -- báo cáo thẩm định của VVB (mint dùng mã này)
    status                  VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED'
        CHECK (status IN ('SUBMITTED', 'APPROVED', 'REJECTED', 'MINTED')),
    reviewer_address        VARCHAR(42),
    review_note             TEXT,
    serial_from             BIGINT,                        -- sê-ri đầu VVB dự kiến mint
    token_id                INTEGER,
    created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Chứng nhận hủy, đồng bộ từ sự kiện CreditRetired.
CREATE TABLE IF NOT EXISTS retirements (
    certificate_id   INTEGER PRIMARY KEY,
    token_id         INTEGER NOT NULL,
    retiree_address  VARCHAR(42) NOT NULL,
    amount           BIGINT NOT NULL,
    serial_from      BIGINT NOT NULL,
    serial_to        BIGINT NOT NULL,
    beneficiary      VARCHAR(255) NOT NULL,
    reason           VARCHAR(500),
    tx_hash          VARCHAR(66) NOT NULL,
    retired_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Doanh nghiệp tự khai báo phát thải/hạn ngạch (dữ liệu mô phỏng) để dashboard so sánh.
CREATE TABLE IF NOT EXISTS emission_declarations (
    id                  SERIAL PRIMARY KEY,
    wallet_address      VARCHAR(42) NOT NULL REFERENCES app_users(wallet_address),
    year                INTEGER NOT NULL,
    emissions_tco2e     BIGINT NOT NULL CHECK (emissions_tco2e >= 0),
    allowance_tco2e     BIGINT NOT NULL DEFAULT 0 CHECK (allowance_tco2e >= 0),
    UNIQUE (wallet_address, year)
);

-- ---------- Nhóm 2: đồng bộ on-chain ----------
CREATE TABLE IF NOT EXISTS chain_events (
    tx_hash          VARCHAR(66) NOT NULL,
    log_index        INTEGER NOT NULL,
    block_number     BIGINT NOT NULL,
    contract_name    VARCHAR(50) NOT NULL,
    event_name       VARCHAR(50) NOT NULL,
    payload          TEXT NOT NULL,                        -- JSON
    PRIMARY KEY (tx_hash, log_index)
);

CREATE TABLE IF NOT EXISTS sync_state (
    id               INTEGER PRIMARY KEY,
    last_block       BIGINT NOT NULL
);
