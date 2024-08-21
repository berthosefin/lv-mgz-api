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
      description: 'A store for testing purposes',
      status: 'active',
      nif: '123456789',
      stat: '123456789',
      address: '123 Test Street',
      city: 'Test City',
      phone: '1234567890',
      email: 'test@store.com',
    },
  });

  // Create a cash desk for the store
  const cashDesk = await prisma.cashDesk.create({
    data: {
      id: randomUUID(),
      currentAmount: 0, // Set initial amount to 0
      storeId: store.id,
    },
  });

  // Create multiple articles for the store
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

  // Create a client
  const client = await prisma.client.create({
    data: {
      id: randomUUID(),
      name: 'Test Client',
      email: 'client@test.com',
      phone: '0987654321',
      address: '456 Client Road',
      city: 'Client City',
      storeId: store.id,
    },
  });

  // Create an order for the client
  const order = await prisma.order.create({
    data: {
      id: randomUUID(),
      clientId: client.id,
      status: 'PENDING',
      isPaid: false,
      isDelivered: false,
    },
  });

  // Create order items
  const orderItems = await Promise.all(
    articles.slice(0, 5).map((article) =>
      prisma.orderItem.create({
        data: {
          id: randomUUID(),
          orderId: order.id,
          articleId: article.id,
          quantity: Math.floor(Math.random() * 10) + 1,
        },
      }),
    ),
  );

  // Create an invoice for the order
  const invoice = await prisma.invoice.create({
    data: {
      id: randomUUID(),
      orderId: order.id,
      clientId: client.id,
      amount: orderItems.reduce(
        (total, item) =>
          total +
          item.quantity *
            articles.find((a) => a.id === item.articleId)!.sellingPrice,
        0,
      ),
      status: 'UNPAID',
    },
  });

  // Create invoice items
  await Promise.all(
    orderItems.map((orderItem) =>
      prisma.invoiceItem.create({
        data: {
          id: randomUUID(),
          invoiceId: invoice.id,
          articleId: orderItem.articleId,
          quantity: orderItem.quantity,
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
    const amount = Math.floor(Math.random() * 5000 + 1000); // Transaction amounts between 1,000 and 6,000
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
