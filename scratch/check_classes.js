const prisma = require('./server/prisma');

async function listClasses() {
  try {
    const classes = await prisma.class.findMany({
      select: { id: true, name: true, campus: true, category: true }
    });
    console.log(JSON.stringify(classes, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listClasses();
