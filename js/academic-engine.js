/**
 * Wajina Institutional Academic Engine
 * Centralized logic for grading standards, promotion hurdles, and level detection.
 */
const AcademicEngine = {
    // Institutional Configuration
    config: {
        anomalyThreshold: 0.25 // Configurable threshold for anomaly detection
    },

    // Standard WAEC/NECO 9-Point Scale for Secondary/Technical College
    SECONDARY_SCALE: [
        { g: 'A1', min: 75, max: 100, m: 'Excellent' },
        { g: 'B2', min: 70, max: 74,  m: 'Very Good' },
        { g: 'B3', min: 65, max: 69,  m: 'Good' },
        { g: 'C4', min: 60, max: 64,  m: 'Credit' },
        { g: 'C5', min: 55, max: 59,  m: 'Credit' },
        { g: 'C6', min: 50, max: 54,  m: 'Credit' },
        { g: 'D7', min: 45, max: 49,  m: 'Pass' },
        { g: 'E8', min: 40, max: 44,  m: 'Pass' },
        { g: 'F9', min: 0,  max: 39,  m: 'Fail' }
    ],

    // Simple 4-Point Scale for Primary/Basic Education
    PRIMARY_SCALE: [
        { g: 'A', min: 75, max: 100, m: 'Exceptional Performance' },
        { g: 'B', min: 60, max: 74,  m: 'Strong Capability' },
        { g: 'C', min: 50, max: 59,  m: 'Satisfactory' },
        { g: 'D', min: 0,  max: 49,  m: 'Needs Remediation' }
    ],

    /**
     * Detects if a class belongs to Primary or Secondary/Technical
     */
    getCampusLevel(className = '') {
        const name = className.toUpperCase();
        if (name.includes('SS') || name.includes('JSS') || name.includes('COLLEGE') || name.includes('TECHNICAL')) {
            return 'SECONDARY';
        }
        return 'PRIMARY';
    },

    /**
     * Calculates the grade and meaning based on institutional standards
     */
    calculateGrade(score, level = 'PRIMARY') {
        const scale = level === 'SECONDARY' ? this.SECONDARY_SCALE : this.PRIMARY_SCALE;
        const result = scale.find(s => score >= s.min && score <= s.max);
        return result || { g: 'N/A', m: 'Unknown' };
    },

    /**
     * Performs Anomaly Detection for Audit purposes.
     * Flag if score is +/- threshold away from class median.
     */
    checkAnomaly(score, median) {
        if (!median || median === 0) return false;
        const diff = Math.abs(score - median);
        const threshold = median * this.config.anomalyThreshold;
        return diff > threshold;
    },

    /**
     * Full set of behavioral traits from the Technical College standard
     */
    AFFECTIVE_TRAITS: [
        'Punctuality', 'Mental Alertness', 'Behaviour', 'Reliability',
        'Attentiveness', 'Respect', 'Neatness', 'Politeness',
        'Honesty', 'Relationship with Staff', 'Relationship with Students',
        'Attitude to School', 'Self-Control', 'Spirit of Teamwork',
        'Initiatives', 'Organizational Ability'
    ],

    PSYCHOMOTOR_SKILLS: [
        'Handwriting', 'Reading', 'Verbal Fluency Diction', 
        'Musical Skills', 'Creative Arts', 'Physical Education', 
        'General Reasoning'
    ]
};

// Export for modern environments, but keep available on window for standard HTML pages
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AcademicEngine;
} else {
    window.Wajina = window.Wajina || {};
    window.Wajina.AcademicEngine = AcademicEngine;
}
