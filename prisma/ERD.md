# Wajina International Schools — Data Model

```mermaid
erDiagram

    %% ── Academic Calendar ──────────────────────────────────────
    AcademicSession ||--o{ Term        : "has"
    AcademicSession ||--o{ Grade       : "in"
    AcademicSession ||--o{ FeeConfig   : "configures"
    AcademicSession ||--o{ Admission   : "for"

    Term ||--o{ Attendance : "during"
    Term ||--o{ Grade      : "in"
    Term ||--o{ FeeConfig  : "configures"

    %% ── School Structure ────────────────────────────────────────
    Class    ||--o{ ClassArm  : "contains"
    Class    ||--o{ Subject   : "has"
    Class    ||--o{ FeeConfig : "has"
    Class    ||--o| User      : "form-mastered-by"

    ClassArm ||--o{ User : "students"

    Department ||--o{ Subject : "owns"
    Department ||--o| User    : "headed-by"

    Subject ||--o{ Grade : "grades"

    %% ── People ──────────────────────────────────────────────────
    User ||--o{ User     : "parent-of"
    User ||--o| Class    : "enrolled-in"
    User ||--o| ClassArm : "enrolled-in"

    %% ── Academic Records ────────────────────────────────────────
    User ||--o{ Grade      : "has"
    User ||--o{ Attendance : "has"
    User ||--o{ Attendance : "marks"
    User ||--o{ Payment    : "makes"

    %% ── Staff & Appraisal ───────────────────────────────────────
    User ||--o{ TeacherAppraisal : "appraised-in"
    User ||--o{ TeacherAppraisal : "evaluates"
    User ||--o{ BehaviourRecord  : "subject-of"
    User ||--o{ BehaviourRecord  : "reports"

    %% ── Requests & Complaints ───────────────────────────────────
    User ||--o{ Request   : "sends"
    User ||--o{ Request   : "receives"
    User ||--o{ Complaint : "files"
    User ||--o{ Complaint : "resolves"
    User ||--o{ Complaint : "subject-of"
    User ||--o{ Task      : "creates"
    User ||--o{ OperationalRisk : "creates"

    %% ── Documents & Signatures ──────────────────────────────────
    User ||--o{ Attestation      : "receives"
    User ||--o{ Attestation      : "issues"
    User ||--o{ Testimonial      : "receives"
    User ||--o{ Testimonial      : "issues"
    User ||--o{ DigitalSignature : "signs"

    Grade       |o--o| DigitalSignature : "signed-by"
    Attestation |o--o| DigitalSignature : "signed-by"
    Testimonial |o--o| DigitalSignature : "signed-by"

    %% ── Auth & Audit ────────────────────────────────────────────
    User ||--o{ RefreshToken : "has"
    User ||--o{ AuditLog     : "generates"
```
