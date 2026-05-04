-- Enable RLS on core tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Grade" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Attendance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Attestation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Testimonial" ENABLE ROW LEVEL SECURITY;

-- 1. USER POLICIES
DROP POLICY IF EXISTS "Director_Global_User_Access" ON "User";
CREATE POLICY "Director_Global_User_Access" ON "User"
  USING (current_setting('app.role', true) = 'DIRECTOR');

DROP POLICY IF EXISTS "Campus_Scoped_User_Access" ON "User";
CREATE POLICY "Campus_Scoped_User_Access" ON "User"
  FOR ALL
  USING (campus::text = current_setting('app.campus', true));

-- 2. GRADE POLICIES (RESULTS)
DROP POLICY IF EXISTS "Director_Global_Grade_Access" ON "Grade";
CREATE POLICY "Director_Global_Grade_Access" ON "Grade"
  USING (current_setting('app.role', true) = 'DIRECTOR');

DROP POLICY IF EXISTS "Campus_Scoped_Grade_Access" ON "Grade";
CREATE POLICY "Campus_Scoped_Grade_Access" ON "Grade"
  FOR ALL
  USING (campus::text = current_setting('app.campus', true));

-- 3. DOCUMENT POLICIES (ATTESTATIONS/TESTIMONIALS)
DROP POLICY IF EXISTS "Director_Global_Attestation_Access" ON "Attestation";
CREATE POLICY "Director_Global_Attestation_Access" ON "Attestation"
  USING (current_setting('app.role', true) = 'DIRECTOR');

DROP POLICY IF EXISTS "Campus_Scoped_Attestation_Access" ON "Attestation";
CREATE POLICY "Campus_Scoped_Attestation_Access" ON "Attestation"
  FOR ALL
  USING (campus::text = current_setting('app.campus', true));

DROP POLICY IF EXISTS "Director_Global_Testimonial_Access" ON "Testimonial";
CREATE POLICY "Director_Global_Testimonial_Access" ON "Testimonial"
  USING (current_setting('app.role', true) = 'DIRECTOR');

DROP POLICY IF EXISTS "Campus_Scoped_Testimonial_Access" ON "Testimonial";
CREATE POLICY "Campus_Scoped_Testimonial_Access" ON "Testimonial"
  FOR ALL
  USING (campus::text = current_setting('app.campus', true));

-- 4. FINANCIAL POLICIES (PAYMENTS)
DROP POLICY IF EXISTS "Director_Global_Payment_Access" ON "Payment";
CREATE POLICY "Director_Global_Payment_Access" ON "Payment"
  USING (current_setting('app.role', true) = 'DIRECTOR');

-- Since Payment doesn't have a direct campus column currently (linked to student), 
-- we scope it based on the student's campus if possible, or add campus to Payment.
-- For now, we allow the director or assume campus scoping is filtered at action layer 
-- until the schema is fully migrated with campus columns in finance.
