/**
 * ArchiveDataService: Handles all data logic & mocking 
 * Detail hungry full-stack implementation extracted from view layer.
 */
const ArchiveDataService = {
    async getSessions() {
        return window.Wajina.apiFetch('/api/structure/sessions');
    },
    async getClasses() {
        const data = await window.Wajina.apiFetch('/api/structure/classes');
        
        // Filter to Primary campus and map to standard names
        const primaryClasses = data
            .filter(c => c.campus && c.campus.toUpperCase() === 'PRIMARY')
            .map(c => ({
                ...c,
                displayName: c.name.replace('Primary', 'Basic')
            }));

        // Archive Engine: Ensure the full spectrum (Creche -> Basic 6) is represented
        const standardNames = [
            'Creche', 'Nursery 1', 'Nursery 2', 
            'Basic 1', 'Basic 2', 'Basic 3', 
            'Basic 4', 'Basic 5', 'Basic 6'
        ];

        // Merge real classes with placeholders to complete the spectrum for the archive
        return standardNames.map(name => {
            const existing = primaryClasses.find(c => c.displayName === name);
            if (existing) return existing;
            return { 
                id: `mock-${name.toLowerCase().replace(' ', '-')}`, 
                name: name, 
                displayName: name, 
                campus: 'PRIMARY' 
            };
        });
    },
    async getArms(classId) {
        return window.Wajina.apiFetch(`/api/structure/arms?classId=${classId}`);
    },
    async getStudentsInArm(armId, positionEnabled, level = 'PRIMARY') {
        const isSecondary = level === 'SECONDARY';
        
        // Simulation of Peer Baseline Data (Institutional standard)
        const generateSubjects = () => {
            const basicSubjects = [
                { n: 'Mathematics', avg: 65, high: 98, low: 22 },
                { n: 'English Language', avg: 62, high: 94, low: 18 },
                { n: 'Basic Science', avg: 58, high: 88, low: 25 },
                { n: 'National Values', avg: 72, high: 99, low: 40 }
            ];
            const secondarySubjects = [
                { n: 'Further Mathematics', avg: 45, high: 92, low: 12 },
                { n: 'Physics', avg: 48, high: 86, low: 15 },
                { n: 'Chemistry', avg: 52, high: 89, low: 20 },
                { n: 'Biology', avg: 60, high: 91, low: 28 },
                { n: 'Civic Education', avg: 70, high: 95, low: 45 }
            ];
            
            const base = isSecondary ? secondarySubjects : basicSubjects;
            
            return base.map(s => {
                // Generate termly drift for the student
                const t1 = Math.min(100, Math.max(0, s.avg + (Math.random() * 20 - 10)));
                const t2 = Math.min(100, Math.max(0, s.avg + (Math.random() * 20 - 10)));
                const t3 = Math.min(100, Math.max(0, s.avg + (Math.random() * 20 - 10)));
                return {
                    ...s,
                    t1: Math.round(t1),
                    t2: Math.round(t2),
                    t3: Math.round(t3)
                };
            });
        };

        const students = [
            { id: 'WJN/22/001', name: 'Emeka Onyekaba', avg_base: 82 },
            { id: 'WJN/22/002', name: 'Zainab Abubakar', avg_base: 89 },
            { id: 'WJN/22/003', name: 'Tivlumun Terver', avg_base: 68 },
            { id: 'WJN/22/004', name: 'Adesola Balogun', avg_base: 52 },
            { id: 'WJN/22/005', name: 'Comfort Idoma', avg_base: 41 }
        ].map(s => {
            const subjects = generateSubjects();
            const totalAvg = Math.round(subjects.reduce((a, b) => a + ((b.t1+b.t2+b.t3)/3), 0) / subjects.length);
            
            return {
                ...s,
                avg: totalAvg,
                subjects,
                status: totalAvg >= (isSecondary ? 45 : 50) ? 'PROMOTED' : 'RETAINED'
            };
        });

        if (!positionEnabled) return students.map(s => ({...s, position: null}));

        return students.sort((a,b) => b.avg - a.avg).map((s, i) => {
            const rank = i + 1;
            let suffix = rank === 1 ? 'st' : (rank === 2 ? 'nd' : (rank === 3 ? 'rd' : 'th'));
            return {...s, position: `${rank}${suffix}`};
        });
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ArchiveDataService;
} else {
    window.Wajina = window.Wajina || {};
    window.Wajina.ArchiveDataService = ArchiveDataService;
}
