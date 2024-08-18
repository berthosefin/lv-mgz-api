import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  // Hash the password
  const hashedPassword =
    '$2a$12$K15Bsnu.FyjTSiEr5MmZe.FuG.vm51SUfM.nZF/gThqJN75k/mMJy'; // password123

  // Create a user with the hashed password
  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      username: 'test',
      hashed_password: hashedPassword, // Use the hashed password
    },
  });

  // Create a store for the user
  const store = await prisma.store.create({
    data: {
      id: randomUUID(),
      name: 'Test Store',
      userId: user.id,
    },
  });

  // Create a cash desk for the store
  const cashDesk = await prisma.cashDesk.create({
    data: {
      id: randomUUID(),
      currentAmount: 1000000, // Set initial amount to 1,000,000 without decimals
      storeId: store.id,
    },
  });

  // Create multiple articles for the store with prices in 4 digits
  const articles = await Promise.all(
    Array.from({ length: 10 }).map((_, i) =>
      prisma.article.create({
        data: {
          id: randomUUID(),
          name: `Article ${i + 1}`,
          purchasePrice: Math.floor(Math.random() * 5000 + 1000), // Prices between 1,000 and 6,000 without decimals
          sellingPrice: Math.floor(Math.random() * 7000 + 2000), // Prices between 2,000 and 9,000 without decimals
          stock: Math.floor(Math.random() * 100) + 50,
          unit: 'piece',
          storeId: store.id,
        },
      }),
    ),
  );

  // Create transactions for the cash desk throughout the year
  const startDate = new Date(new Date().getFullYear(), 0, 1);
  const endDate = new Date();

  for (
    let date = startDate;
    date <= endDate;
    date.setDate(date.getDate() + 1)
  ) {
    const type = Math.random() > 0.5 ? 'IN' : 'OUT';
    const amount = Math.floor(Math.random() * 5000 + 1000); // Transaction amounts between 1,000 and 6,000 without decimals
    const label = type === 'IN' ? 'Vente' : 'Achat'; // Label based on transaction type

    await prisma.transaction.create({
      data: {
        id: randomUUID(),
        type,
        amount,
        label: `${label}`,
        cashDeskId: cashDesk.id,
        createdAt: new Date(date),
        updatedAt: new Date(date),
        articles: {
          connect: articles.map((article) => ({ id: article.id })),
        },
      },
    });
  }

  console.log('Database seeded with modified fictive data');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
