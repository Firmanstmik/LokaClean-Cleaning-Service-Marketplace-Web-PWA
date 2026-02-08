
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const users: any[] = await prisma.$queryRaw`SELECT id, email FROM "User" LIMIT 1`;
    console.log('User:', users);

    if (users.length > 0) {
      const userId = users[0].id;
      console.log('Testing getAddresses for user:', userId);
      const addresses = await prisma.savedAddress.findMany({
        where: { user_id: userId },
        orderBy: [
          { is_primary: 'desc' },
          { created_at: 'desc' }
        ],
        select: {
          id: true,
          label: true,
          address: true,
          street: true,
          village: true,
          district: true,
          city: true,
          latitude: true,
          longitude: true,
          is_primary: true,
          notes: true,
          floor_number: true,
          building_name: true,
          gate_photo_url: true
        }
      });
      console.log('Addresses:', addresses);
    }
  } catch (e) {
    console.error('Error listing tables:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
