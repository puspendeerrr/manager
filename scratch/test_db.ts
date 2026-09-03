import { PrismaClient } from '@prisma/client';

const passwords = ['postgres', 'root', 'admin', 'password', '123456', 'postgres123', 'Puspender', 'puspender'];

async function testPasswords() {
  for (const pwd of passwords) {
    const url = `postgresql://postgres:${encodeURIComponent(pwd)}@localhost:5432/postgres?schema=public`;
    const prisma = new PrismaClient({ datasources: { db: { url } } });
    try {
      await prisma.$connect();
      console.log(`SUCCESS! Connected with password: "${pwd}"`);
      await prisma.$disconnect();
      return pwd;
    } catch (err: any) {
      console.log(`Failed with "${pwd}": ${err.message.split('\n')[0]}`);
      await prisma.$disconnect();
    }
  }
}

testPasswords();
