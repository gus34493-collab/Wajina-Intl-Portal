
import { PrismaClient } from '@prisma/client';
import * as engine from '../server/utils/academicEngine';
import { requireCampus } from '../server/middleware/auth';

const prisma = new PrismaClient();

async function runTests() {
    console.log('--- Wajina Portal Security Verification ---\n');

    try {
        // 1. REQUIPRE CAMPUS MIDDLEWARE TEST
        console.log('[Test 1] requireCampus Middleware');
        const middleware = requireCampus('PRIMARY');
        
        const mockSecondaryUser = { role: 'BURSAR', campus: 'SECONDARY' };
        const mockDirector = { role: 'DIRECTOR', campus: 'SECONDARY' };
        
        let nextCalled = false;
        const mockRes = { status: (code: number) => ({ json: (o: any) => { console.log(`  - Blocked with ${code}: ${o.error}`); } }) };
        
        console.log('  Testing Secondary Bursar on Primary Route:');
        middleware({ user: mockSecondaryUser }, mockRes, () => { nextCalled = true; });
        console.log(`  - Result: ${nextCalled ? 'PASSED (Allowed)' : 'SUCCESS (Blocked)'}`);
        
        nextCalled = false;
        console.log('  Testing Director on Primary Route (Exception):');
        middleware({ user: mockDirector }, mockRes, () => { nextCalled = true; });
        console.log(`  - Result: ${nextCalled ? 'SUCCESS (Allowed)' : 'FAILED (Blocked)'}`);

        // 2. FEE-BLOCKING LOGIC TEST
        console.log('\n[Test 2] Fee-Blocking (Academic Engine)');
        const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
        if (student) {
            const canView = await engine.canViewResults(student.id);
            console.log(`  - Student ${student.name} can view results: ${canView}`);
            console.log(`  - Note: This depends on DB state (FeeConfig vs Payments)`);
        } else {
            console.log('  - No student found for testing.');
        }

        // 3. UNIFIED PARENT DASHBOARD TEST
        console.log('\n[Test 3] Unified Parent Aggregation');
        const parent = await prisma.user.findFirst({ where: { role: 'PARENT' } });
        if (parent) {
            const wards = await prisma.user.findMany({ 
                where: { parentId: parent.id, role: 'STUDENT' },
                select: { name: true, campus: true }
            });
            console.log(`  - Parent ${parent.name} has ${wards.length} wards:`);
            wards.forEach(w => console.log(`    * ${w.name} (${w.campus})`));
            
            const hasCrossCampus = wards.some(w => w.campus === 'PRIMARY') && wards.some(w => w.campus === 'SECONDARY');
            console.log(`  - Cross-campus visibility ready: ${hasCrossCampus ? 'YES' : 'PENDING DATA'}`);
        } else {
            console.log('  - No parent found for testing.');
        }

    } catch (err) {
        console.error('Verification Script Failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

runTests();
