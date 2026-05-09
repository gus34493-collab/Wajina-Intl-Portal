/**
 * Wajina Core Bridge Logic
 * Orchestrates information flow between Bursar, Teacher, Principal, and Owner.
 * Enforces "No Payment / No Result" business rule.
 */

const WajinaBridge = {
    // 1. DATA REPOSITORIES (MOCKED FOR PWA)
    db: {
        getStudents: () => JSON.parse(localStorage.getItem('wajina_students') || '[]'),
        getPayments: () => JSON.parse(localStorage.getItem('wajina_payments') || '[]'),
        getGrades: () => JSON.parse(localStorage.getItem('wajina_grades') || '[]'),
        save: (key, data) => localStorage.setItem(`wajina_${key}`, JSON.stringify(data))
    },

    // 2. FINANCIAL LOGIC
    recordPayment: function(paymentData) {
        const payments = this.db.getPayments();
        const students = this.db.getStudents();
        
        const newPayment = {
            id: `PAY-${Date.now()}`,
            timestamp: new Date().toISOString(),
            ...paymentData
        };
        
        payments.push(newPayment);
        this.db.save('payments', payments);

        // Update student payment status
        const studentIndex = students.findIndex(s => s.id === paymentData.studentId);
        if (studentIndex > -1) {
            students[studentIndex].paymentStatus = 'Paid'; // Simple logic for now
            this.db.save('students', students);
        }

        return newPayment;
    },

    getTotalRevenue: function() {
        return this.db.getPayments()
            .reduce((total, p) => total + (p.amount || 0), 0);
    },

    // 3. ACADEMIC LOGIC
    submitGrades: function(gradeData) {
        const grades = this.db.getGrades();
        grades.push({
            id: `GRD-${Date.now()}`,
            status: 'Pending Principal Approval',
            ...gradeData
        });
        this.db.save('grades', grades);
    },

    approveGrades: function(gradeId) {
        const grades = this.db.getGrades();
        const index = grades.findIndex(g => g.id === gradeId);
        if (index > -1) {
            grades[index].status = 'Approved';
            this.db.save('grades', grades);
        }
    },

    // 4. THE BRIDGE (Publishing Constraint)
    canAccessResults: function(studentId) {
        const students = this.db.getStudents();
        const student = students.find(s => s.id === studentId);
        
        // Critical Rule: No Payment -> No Result
        return student && student.paymentStatus === 'Paid';
    },

    getPublishedResults: function(studentId) {
        if (!this.canAccessResults(studentId)) {
            return { error: 'Payment Required', locked: true };
        }
        
        return this.db.getGrades().filter(g => g.studentId === studentId && g.status === 'Approved');
    },

    // 5. VISIBILITY HELPERS
    getStudentsByPaymentStatus: function(status) {
        // status: 'Paid' or 'Unpaid'
        return this.db.getStudents().filter(s => s.paymentStatus === status);
    }
};

window.WajinaBridge = WajinaBridge;
