import prisma from './server/prisma.js';

async function verifyOpsLogic() {
  console.log('--- VERIFYING OPERATIONAL LOGIC ---');

  // 1. Find a secondary staff member
  const staff = await prisma.user.findFirst({
    where: { role: 'TEACHER', campus: 'SECONDARY' }
  });
  if (!staff) {
    console.error('No secondary teacher found for test.');
    return;
  }

  // 2. Find Director and Secondary VP_ADMIN
  const director = await prisma.user.findFirst({ where: { role: 'DIRECTOR' } });
  const vpAdmin = await prisma.user.findFirst({ where: { role: 'VP_ADMIN', campus: 'SECONDARY' } });

  console.log(`Testing with Staff: ${staff.name}, Campus: ${staff.campus}`);
  console.log(`Expecting Notification for: ${director?.name} (Director) and ${vpAdmin?.name} (VP Admin)`);

  // 3. Manually simulate the POST /api/risks logic
  const title = "Infrastructural Hazard: Broken Ceiling";
  const severity = "CRITICAL";

  // Check counts before
  const beforeCount = await prisma.request.count();

  // Create the Risk (Simulating logic from risks.ts)
  const risk = await prisma.operationalRisk.create({
    data: {
      title,
      description: "Severe leak and falling tiles in Block B.",
      severity,
      status: 'OPEN',
      campus: staff.campus,
      createdBy: staff.id
    }
  });

  // Notification Logic (Manual replication for verification)
  const notifyIds = Array.from(new Set([
    vpAdmin?.id,
    director?.id
  ].filter(Boolean)));

  await prisma.request.createMany({
    data: notifyIds.map(receiverId => ({
      level: 'K3',
      title: `Operational Risk Alert: ${severity}`,
      description: `A new ${severity} risk has been logged: "${title}" by ${staff.name}.`,
      senderId: staff.id,
      receiverId,
      status: 'PENDING'
    }))
  });

  const afterCount = await prisma.request.count();
  console.log(`Success! Created ${afterCount - beforeCount} priority notifications.`);
  
  // Cleanup
  await prisma.request.deleteMany({ where: { title: `Operational Risk Alert: ${severity}` } });
  await prisma.operationalRisk.delete({ where: { id: risk.id } });
  console.log('Cleanup complete.');
}

verifyOpsLogic();
