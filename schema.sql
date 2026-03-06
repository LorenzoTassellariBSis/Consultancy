-- ============================================================
-- Hospital Network Schema v3.1  |  PostgreSQL 15
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum types
CREATE TYPE hospital_tier AS ENUM ('community','regional','academic','trauma_center');
CREATE TYPE staff_role     AS ENUM ('physician','nurse','surgeon','resident','pa','admin');
CREATE TYPE admission_type AS ENUM ('emergency','elective','transfer','observation');
CREATE TYPE bill_status    AS ENUM ('pending','submitted','paid','disputed','written_off');
CREATE TYPE proc_outcome   AS ENUM ('successful','complicated','abandoned','pending');
CREATE TYPE med_route      AS ENUM ('oral','iv','im','topical','inhaled','sublingual');

-- ── hospitals ────────────────────────────────────────────
CREATE TABLE hospitals (
  hospital_id       UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              VARCHAR(200)   NOT NULL,
  region_code       CHAR(3)        NOT NULL,
  tier              hospital_tier  NOT NULL DEFAULT 'community',
  bed_capacity      INT            NOT NULL CHECK (bed_capacity > 0),
  accreditation_date DATE,
  geo_lat           NUMERIC(9,6),
  geo_lng           NUMERIC(9,6),
  created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ── patients ─────────────────────────────────────────────
CREATE TABLE patients (
  patient_id        UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  primary_hospital_id UUID         REFERENCES hospitals(hospital_id),
  dob               DATE           NOT NULL,
  sex               CHAR(1)        CHECK (sex IN ('M','F','X')),
  blood_type        VARCHAR(3),
  insurance_tier    SMALLINT       CHECK (insurance_tier BETWEEN 1 AND 5),
  is_deceased       BOOLEAN        NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_patients_blood  ON patients(blood_type);
CREATE INDEX idx_patients_dob    ON patients(dob);

-- ── staff ────────────────────────────────────────────────
CREATE TABLE staff (
  staff_id          UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id       UUID           NOT NULL REFERENCES hospitals(hospital_id),
  role              staff_role     NOT NULL,
  specialty         VARCHAR(100),
  hire_date         DATE           NOT NULL,
  base_salary       NUMERIC(12,2)  NOT NULL CHECK (base_salary >= 0),
  is_active         BOOLEAN        NOT NULL DEFAULT TRUE
);

-- ── admissions ───────────────────────────────────────────
CREATE TABLE admissions (
  admission_id      UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id        UUID           NOT NULL REFERENCES patients(patient_id),
  hospital_id       UUID           NOT NULL REFERENCES hospitals(hospital_id),
  admitting_staff_id UUID          REFERENCES staff(staff_id),
  admitted_at       TIMESTAMPTZ    NOT NULL,
  discharged_at     TIMESTAMPTZ,
  admission_type    admission_type NOT NULL,
  drg_code          CHAR(4),
  severity_score    SMALLINT       CHECK (severity_score BETWEEN 1 AND 5),
  CONSTRAINT chk_discharge_after_admit
    CHECK (discharged_at IS NULL OR discharged_at > admitted_at)
);
CREATE INDEX idx_adm_patient   ON admissions(patient_id, admitted_at DESC);
CREATE INDEX idx_adm_hospital  ON admissions(hospital_id, admitted_at DESC);

-- ── diagnoses ────────────────────────────────────────────
CREATE TABLE diagnoses (
  diagnosis_id      BIGSERIAL      PRIMARY KEY,
  admission_id      UUID           NOT NULL REFERENCES admissions(admission_id),
  staff_id          UUID           REFERENCES staff(staff_id),
  icd10_code        VARCHAR(7)     NOT NULL,
  is_primary        BOOLEAN        NOT NULL DEFAULT FALSE,
  diagnosed_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  confidence        NUMERIC(3,2)   CHECK (confidence BETWEEN 0 AND 1)
);
CREATE INDEX idx_dx_icd10      ON diagnoses(icd10_code);
CREATE INDEX idx_dx_admission  ON diagnoses(admission_id);

-- ── procedures ───────────────────────────────────────────
CREATE TABLE procedures (
  procedure_id      BIGSERIAL      PRIMARY KEY,
  admission_id      UUID           NOT NULL REFERENCES admissions(admission_id),
  performed_by      UUID           REFERENCES staff(staff_id),
  cpt_code          VARCHAR(5)     NOT NULL,
  performed_at      TIMESTAMPTZ    NOT NULL,
  duration_mins     INT            CHECK (duration_mins > 0),
  outcome           proc_outcome   NOT NULL DEFAULT 'pending'
);

-- ── billing ──────────────────────────────────────────────
CREATE TABLE billing (
  bill_id           UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  admission_id      UUID           NOT NULL UNIQUE REFERENCES admissions(admission_id),
  payer_id          UUID,
  total_charges     NUMERIC(14,2)  NOT NULL CHECK (total_charges >= 0),
  insurance_paid    NUMERIC(14,2)  NOT NULL DEFAULT 0,
  patient_paid      NUMERIC(14,2)  NOT NULL DEFAULT 0,
  written_off       NUMERIC(14,2)  NOT NULL DEFAULT 0,
  status            bill_status    NOT NULL DEFAULT 'pending',
  created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ── readmissions ─────────────────────────────────────────
CREATE TABLE readmissions (
  readmission_id       UUID  PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_admission_id UUID NOT NULL REFERENCES admissions(admission_id),
  new_admission_id      UUID NOT NULL REFERENCES admissions(admission_id),
  days_gap           INT    NOT NULL CHECK (days_gap >= 0),
  is_planned         BOOLEAN NOT NULL DEFAULT FALSE,
  same_hospital      BOOLEAN NOT NULL,
  CONSTRAINT uq_readmit UNIQUE (original_admission_id, new_admission_id)
);

-- ── medications ──────────────────────────────────────────
CREATE TABLE medications (
  med_id         BIGSERIAL      PRIMARY KEY,
  admission_id   UUID           NOT NULL REFERENCES admissions(admission_id),
  prescribed_by  UUID           REFERENCES staff(staff_id),
  ndc_code       VARCHAR(11)    NOT NULL,
  dosage_mg      NUMERIC(8,3)   NOT NULL CHECK (dosage_mg > 0),
  route          med_route      NOT NULL,
  started_at     TIMESTAMPTZ    NOT NULL,
  stopped_at     TIMESTAMPTZ,
  adverse_event  BOOLEAN        NOT NULL DEFAULT FALSE,
  CONSTRAINT chk_med_dates
    CHECK (stopped_at IS NULL OR stopped_at > started_at)
);
CREATE INDEX idx_med_ndc        ON medications(ndc_code);
CREATE INDEX idx_med_adverse    ON medications(admission_id) WHERE adverse_event = TRUE;

-- ── staff_shifts (many-to-many) ───────────────────────────
CREATE TABLE staff_shifts (
  shift_id      BIGSERIAL    PRIMARY KEY,
  staff_id      UUID         NOT NULL REFERENCES staff(staff_id),
  hospital_id   UUID         NOT NULL REFERENCES hospitals(hospital_id),
  shift_start   TIMESTAMPTZ  NOT NULL,
  shift_end     TIMESTAMPTZ  NOT NULL,
  ward          VARCHAR(50),
  CONSTRAINT chk_shift CHECK (shift_end > shift_start)
);