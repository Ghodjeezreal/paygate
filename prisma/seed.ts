import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Start seeding...');

  // Seed Vehicle Types
  const vehicleTypes = [
    { name: 'Motorcycle', fee: 500 },
    { name: 'Car/SUV', fee: 1000 },
    { name: 'Small Van', fee: 2000 },
    { name: 'Medium Truck', fee: 3500 },
    { name: 'Large Truck', fee: 5000 },
    { name: 'Trailer', fee: 7500 },
    { name: 'Container Truck', fee: 10000 },
  ];

  for (const vt of vehicleTypes) {
    const vehicleType = await prisma.vehicleType.upsert({
      where: { name: vt.name },
      update: {},
      create: vt,
    });
    console.log(`✓ Created/Updated vehicle type: ${vehicleType.name} - ₦${vehicleType.fee}`);
  }

  // Seed Users (Admin and Security)
  const bcrypt = require('bcryptjs');
  
  const users = [
    {
      username: 'admin',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN' as const,
      fullName: 'Estate Administrator'
    },
    {
      username: 'security1',
      password: await bcrypt.hash('security123', 10),
      role: 'SECURITY' as const,
      fullName: ''
    },
    {
      username: 'security2',
      password: await bcrypt.hash('security123', 10),
      role: 'SECURITY' as const,
      fullName: ''
    }
  ];

  for (const user of users) {
    const createdUser = await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: user,
    });
    console.log(`✓ Created/Updated user: ${createdUser.username} (${createdUser.role})`);
  }

  // Seed Pass Packages
  const car = vehicleTypes.find(v => v.name === 'Car/SUV');
  if (car) {
    const packages = [
      {
        name: '10 Entry Pass - Car/SUV',
        entries: 10,
        price: 8000, // ₦1000 x 10 = ₦10000, 20% discount = ₦8000
        discount: 20,
        vehicleTypeId: 2 // Car/SUV
      },
      {
        name: '20 Entry Pass - Car/SUV',
        entries: 20,
        price: 14000, // ₦1000 x 20 = ₦20000, 30% discount = ₦14000
        discount: 30,
        vehicleTypeId: 2
      }
    ];

    for (const pkg of packages) {
      const passPackage = await prisma.passPackage.create({
        data: pkg,
      });
      console.log(`✓ Created pass package: ${passPackage.name} - ₦${passPackage.price}`);
    }
  }

  console.log('\n✅ Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
