"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Seed script — creates the initial staff accounts.
 * Run once with: node server/seed.js
 * Re-running is safe — existing accounts are skipped.
 */
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const bcrypt = __importStar(require("bcryptjs"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient({
    datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});
const ACCOUNTS = [
    { email: 'director@wajinaschools.com', name: 'School Director', role: 'DIRECTOR', campus: null, password: 'WajinaAdmin2026!' },
    { email: 'principal.primary@wajinaschools.com', name: 'Primary School Principal', role: 'PRINCIPAL', campus: 'PRIMARY', password: 'Principal2026!' },
    { email: 'principal.secondary@wajinaschools.com', name: 'Secondary School Principal', role: 'PRINCIPAL', campus: 'SECONDARY', password: 'Principal2026!' },
    { email: 'teacher.primary@wajinaschools.com', name: 'Demo Primary Teacher', role: 'TEACHER', campus: 'PRIMARY', password: 'Teacher2026!' },
    { email: 'teacher.secondary@wajinaschools.com', name: 'Demo Secondary Teacher', role: 'TEACHER', campus: 'SECONDARY', password: 'Teacher2026!' },
    { email: 'bursar.primary@wajinaschools.com', name: 'Primary Campus Bursar', role: 'BURSAR', campus: 'PRIMARY', password: 'Bursar2026!' },
    { email: 'bursar.secondary@wajinaschools.com', name: 'Secondary Campus Bursar', role: 'BURSAR', campus: 'SECONDARY', password: 'Bursar2026!' },
    { email: 'accounts@wajinaschools.com', name: 'Accounts Officer', role: 'ACCOUNTS_OFFICER', campus: null, password: 'Accounts2026!' },
    { email: 'parent.primary@wajinaschools.com', name: 'Demo Primary Parent', role: 'PARENT', campus: 'PRIMARY', password: 'Parent2026!' },
    { email: 'parent.secondary@wajinaschools.com', name: 'Demo Secondary Parent', role: 'PARENT', campus: 'SECONDARY', password: 'Parent2026!' },
    { email: 'student.secondary@wajinaschools.com', name: 'Demo Secondary Student', role: 'STUDENT', campus: 'SECONDARY', password: 'Student2026!' },
];
async function main() {
    console.log('Starting seed…\n');
    for (const account of ACCOUNTS) {
        const existing = await prisma.user.findUnique({ where: { email: account.email } });
        if (existing) {
            console.log(`  SKIP  ${account.email} (already exists)`);
            continue;
        }
        const hashed = await bcrypt.hash(account.password, 12);
        await prisma.user.create({
            data: {
                email: account.email,
                name: account.name,
                role: account.role,
                campus: account.campus,
                password: hashed,
                status: 'ACTIVE',
            },
        });
        console.log(`  ✅ ${account.role.padEnd(18)} ${account.email}  /  ${account.password}`);
    }
    console.log('\nSeed complete. Change default passwords before going live.');
}
main()
    .catch((err) => { console.error('Seed failed:', err); process.exit(1); })
    .finally(() => prisma.$disconnect());
