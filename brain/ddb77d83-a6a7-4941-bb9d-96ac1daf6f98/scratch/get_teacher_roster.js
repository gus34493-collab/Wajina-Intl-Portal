const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const teacher = await prisma.user.findFirst({
        where: { role: 'TEACHER' },
        include: {
            subjectsTaught: {
                include: {
                    class: {
                        include: {
                            students: {
                                take: 5
                            }
                        }
                    }
                }
            }
        }
    });

    if (teacher) {
        console.log('--- TEACHER FOUND ---');
        console.log('ID:', teacher.id);
        console.log('Email:', teacher.email);
        console.log('Name:', teacher.name);
        console.log('\n--- SUBJECTS & STUDENTS ---');
        teacher.subjectsTaught.forEach(sub => {
            console.log(`Subject: ${sub.name} (Class: ${sub.class.name})`);
            sub.class.students.forEach(std => {
                console.log(`  - Student: ${std.name} (${std.id})`);
            });
        });
    } else {
        console.log('No teacher found in database.');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
