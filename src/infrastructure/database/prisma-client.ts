import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

declare global {
    var prisma: PrismaClient | undefined;
}

function createClient(): PrismaClient {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    return new PrismaClient({ adapter });
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
    prisma = createClient();
} else {
    if (!global.prisma) {
        global.prisma = createClient();
    }
    prisma = global.prisma;
}

export default prisma;
