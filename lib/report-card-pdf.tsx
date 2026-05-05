import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import path from "path";
import fs from "fs";

export type SubjectGrade = {
  subject: string;
  firstCA: number;
  secondCA: number;
  thirdCA: number;
  fourthCA: number;
  fifthCA: number;
  exam: number;
  total: number;
  grade: string | null;
  position: number | null;
  teacherComment: string | null;
};

export type ReportCardData = {
  studentName: string;
  className: string;
  armLabel: string;
  termName: string;
  sessionName: string;
  campus: string;
  publishedByName: string;
  publishedByRole: string;
  publishedAt: string;
  signatureData: string | null; // base64 data URI from drawn signature canvas
  formMasterRemark: string | null;
  principalRemark: string | null;
  grades: SubjectGrade[];
};

// Brand colours
const GUNMETAL = "#20373B";
const SAFFRON = "#FFC64F";
const MOONSTONE = "#519CAB";
const MUTED = "#9CA3AF";
const WHITE = "#FFFFFF";
const LIGHT = "#F9FAFB";
const BORDER = "#E5E7EB";
const SUCCESS = "#22c55e";
const DANGER = "#ef4444";

const s = StyleSheet.create({
  page: {
    backgroundColor: WHITE,
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: GUNMETAL,
  },

  // ─── Header ───────────────────────────────────────────────────────────────
  header: {
    backgroundColor: GUNMETAL,
    borderRadius: 8,
    padding: 20,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  logo: { width: 46, height: 46, objectFit: "contain", marginRight: 14 },
  headerCenter: { flex: 1 },
  schoolName: {
    color: WHITE,
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  reportTitle: {
    color: SAFFRON,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginTop: 4,
  },
  headerRight: { alignItems: "flex-end" },
  campusBadge: {
    backgroundColor: SAFFRON,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 5,
  },
  campusBadgeText: {
    color: GUNMETAL,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sessionText: { color: MUTED, fontSize: 8 },

  // ─── Info grid ────────────────────────────────────────────────────────────
  infoGrid: { flexDirection: "row", marginBottom: 14, gap: 8 },
  infoCard: {
    flex: 1,
    backgroundColor: LIGHT,
    borderRadius: 6,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: SAFFRON,
  },
  infoLabel: {
    color: MUTED,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  infoValue: { color: GUNMETAL, fontSize: 10, fontFamily: "Helvetica-Bold" },

  // ─── Section title ────────────────────────────────────────────────────────
  sectionTitle: {
    color: GUNMETAL,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    borderBottomWidth: 1,
    borderBottomColor: SAFFRON,
    paddingBottom: 4,
    marginBottom: 7,
  },

  // ─── Table ────────────────────────────────────────────────────────────────
  tableWrap: { marginBottom: 14 },
  tableHead: {
    flexDirection: "row",
    backgroundColor: GUNMETAL,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  th: {
    color: WHITE,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  tableRowAlt: { backgroundColor: LIGHT },
  td: { fontSize: 8.5, color: GUNMETAL },
  tdBold: { fontFamily: "Helvetica-Bold" },
  tdCenter: { textAlign: "center" },

  gradeChip: {
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: MOONSTONE,
    alignSelf: "flex-start",
  },
  gradeHigh: { backgroundColor: SUCCESS },
  gradeLow: { backgroundColor: DANGER },
  gradeText: { color: WHITE, fontSize: 8, fontFamily: "Helvetica-Bold" },

  // ─── Remarks ──────────────────────────────────────────────────────────────
  remarks: { flexDirection: "row", gap: 10, marginBottom: 14 },
  remarkCard: { flex: 1, backgroundColor: LIGHT, borderRadius: 6, padding: 10 },
  remarkLabel: {
    color: MUTED,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  remarkText: { color: GUNMETAL, fontSize: 9, lineHeight: 1.5 },

  // ─── Signature ────────────────────────────────────────────────────────────
  sigRow: { flexDirection: "row", gap: 12, marginBottom: 14 },
  sigBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 80,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  sigImg: { width: 120, height: 36, objectFit: "contain", marginBottom: 6 },
  sigLine: {
    borderTopWidth: 1,
    borderTopColor: GUNMETAL,
    width: "80%",
    marginBottom: 4,
  },
  sigLabel: {
    color: MUTED,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    textAlign: "center",
  },
  sigName: {
    color: GUNMETAL,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginTop: 3,
  },

  // ─── Footer ───────────────────────────────────────────────────────────────
  footer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: { color: MUTED, fontSize: 7 },
  sealBadge: {
    backgroundColor: GUNMETAL,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sealText: {
    color: SAFFRON,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});

// Column widths must sum to 100%
const COL = {
  subject: "30%",
  ca1: "8%",
  ca2: "8%",
  ca3: "8%",
  exam: "10%",
  total: "10%",
  grade: "12%",
  pos: "14%",
};

function ordinalSuffix(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 13) return "th";
  switch (n % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

function gradeChipStyle(grade: string | null) {
  if (!grade) return {};
  if (["A", "A+", "A1", "A2", "B2", "B3"].includes(grade)) return s.gradeHigh;
  if (["F", "F9", "E8"].includes(grade)) return s.gradeLow;
  return {};
}

function ReportCardDocument({ data }: { data: ReportCardData }) {
  const logoPath = path.join(process.cwd(), "public", "images", "logo-no-bg.png");
  const hasLogo = fs.existsSync(logoPath);
  const leaderTitle = data.campus === "PRIMARY" ? "Head Teacher" : "Principal";

  return (
    <Document
      title={`Report Card — ${data.studentName} — ${data.termName} Term ${data.sessionName}`}
      author="Wajina International Schools"
      subject="Academic Report Card"
    >
      <Page size="A4" style={s.page}>

        {/* HEADER */}
        <View style={s.header}>
          {hasLogo && <Image src={logoPath} style={s.logo} />}
          <View style={s.headerCenter}>
            <Text style={s.schoolName}>Wajina International Schools</Text>
            <Text style={s.reportTitle}>Academic Report Card — {data.termName} Term</Text>
          </View>
          <View style={s.headerRight}>
            <View style={s.campusBadge}>
              <Text style={s.campusBadgeText}>{data.campus} Campus</Text>
            </View>
            <Text style={s.sessionText}>{data.sessionName}</Text>
          </View>
        </View>

        {/* STUDENT INFO */}
        <View style={s.infoGrid}>
          <View style={s.infoCard}>
            <Text style={s.infoLabel}>Student Name</Text>
            <Text style={s.infoValue}>{data.studentName}</Text>
          </View>
          <View style={s.infoCard}>
            <Text style={s.infoLabel}>Class / Arm</Text>
            <Text style={s.infoValue}>{data.className} — {data.armLabel}</Text>
          </View>
          <View style={s.infoCard}>
            <Text style={s.infoLabel}>Term</Text>
            <Text style={s.infoValue}>{data.termName}</Text>
          </View>
          <View style={s.infoCard}>
            <Text style={s.infoLabel}>Session</Text>
            <Text style={s.infoValue}>{data.sessionName}</Text>
          </View>
        </View>

        {/* GRADES TABLE */}
        <Text style={s.sectionTitle}>Academic Performance</Text>
        <View style={s.tableWrap}>
          <View style={s.tableHead}>
            <Text style={[s.th, { width: COL.subject }]}>Subject</Text>
            <Text style={[s.th, { width: COL.ca1, textAlign: "center" }]}>1st CA</Text>
            <Text style={[s.th, { width: COL.ca2, textAlign: "center" }]}>2nd CA</Text>
            <Text style={[s.th, { width: COL.ca3, textAlign: "center" }]}>3rd CA</Text>
            <Text style={[s.th, { width: COL.exam, textAlign: "center" }]}>Exam</Text>
            <Text style={[s.th, { width: COL.total, textAlign: "center" }]}>Total</Text>
            <Text style={[s.th, { width: COL.grade, textAlign: "center" }]}>Grade</Text>
            <Text style={[s.th, { width: COL.pos, textAlign: "center" }]}>Position</Text>
          </View>

          {data.grades.map((g, i) => (
            <View key={g.subject} style={[s.tableRow, i % 2 !== 0 ? s.tableRowAlt : {}]}>
              <Text style={[s.td, s.tdBold, { width: COL.subject }]}>{g.subject}</Text>
              <Text style={[s.td, s.tdCenter, { width: COL.ca1 }]}>{g.firstCA}</Text>
              <Text style={[s.td, s.tdCenter, { width: COL.ca2 }]}>{g.secondCA}</Text>
              <Text style={[s.td, s.tdCenter, { width: COL.ca3 }]}>{g.thirdCA}</Text>
              <Text style={[s.td, s.tdCenter, { width: COL.exam }]}>{g.exam}</Text>
              <Text style={[s.td, s.tdBold, s.tdCenter, { width: COL.total }]}>{g.total}</Text>
              <View style={{ width: COL.grade, alignItems: "center" }}>
                <View style={[s.gradeChip, gradeChipStyle(g.grade)]}>
                  <Text style={s.gradeText}>{g.grade ?? "—"}</Text>
                </View>
              </View>
              <Text style={[s.td, s.tdCenter, { width: COL.pos }]}>
                {g.position != null
                  ? `${g.position}${ordinalSuffix(g.position)}`
                  : "—"}
              </Text>
            </View>
          ))}
        </View>

        {/* REMARKS */}
        {(data.formMasterRemark || data.principalRemark) && (
          <>
            <Text style={s.sectionTitle}>Remarks</Text>
            <View style={s.remarks}>
              {data.formMasterRemark && (
                <View style={s.remarkCard}>
                  <Text style={s.remarkLabel}>Form Master's Remark</Text>
                  <Text style={s.remarkText}>{data.formMasterRemark}</Text>
                </View>
              )}
              {data.principalRemark && (
                <View style={s.remarkCard}>
                  <Text style={s.remarkLabel}>{leaderTitle}'s Remark</Text>
                  <Text style={s.remarkText}>{data.principalRemark}</Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* AUTHORISATION / SIGNATURE */}
        <Text style={s.sectionTitle}>Authorisation</Text>
        <View style={s.sigRow}>
          <View style={s.sigBox}>
            {data.signatureData && (
              <Image src={data.signatureData} style={s.sigImg} />
            )}
            <View style={s.sigLine} />
            <Text style={s.sigLabel}>{leaderTitle}'s Signature</Text>
            <Text style={s.sigName}>{data.publishedByName}</Text>
          </View>
          <View style={s.sigBox}>
            <View style={s.sigLine} />
            <Text style={s.sigLabel}>School Stamp</Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={s.footer}>
          <Text style={s.footerText}>
            {`Issued ${new Date(data.publishedAt).toLocaleDateString("en-NG", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}  ·  This is an officially sealed document. Any alteration renders it invalid.`}
          </Text>
          <View style={s.sealBadge}>
            <Text style={s.sealText}>Cryptographically Sealed</Text>
          </View>
        </View>

      </Page>
    </Document>
  );
}

export async function generatePdfBuffer(data: ReportCardData): Promise<Buffer> {
  const result = await renderToBuffer(<ReportCardDocument data={data} />);
  return Buffer.from(result);
}
