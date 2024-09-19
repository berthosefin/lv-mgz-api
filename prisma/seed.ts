import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  // Hash the password
  const hashedPassword =
    '$2a$12$K15Bsnu.FyjTSiEr5MmZe.FuG.vm51SUfM.nZF/gThqJN75k/mMJy'; // password123

  // Upsert user to create or update if exists
  const user = await prisma.user.upsert({
    where: { email: 'user@test.com' },
    update: {}, // No update fields needed
    create: {
      id: randomUUID(),
      username: 'test',
      email: 'user@test.com',
      hashedPassword,
    },
  });

  // Upsert store to create or update if exists
  const store = await prisma.store.upsert({
    where: { name: 'Test Store' },
    update: {}, // No update fields needed
    create: {
      id: randomUUID(),
      name: 'Test Store',
      description: 'A store for testing purposes',
      status: 'active',
      nif: '123456789',
      stat: '123456789',
      address: '123 Test Street',
      city: 'Test City',
      phone: '1234567890',
      email: 'user@test.com',
      user: { connect: { id: user.id } }, // Connect the user relation
    },
  });

  // Upsert cash desk for the store
  const cashDesk = await prisma.cashDesk.upsert({
    where: { storeId: store.id },
    update: {}, // No update fields needed
    create: {
      id: randomUUID(),
      currentAmount: 0, // Set initial amount to 0
      store: { connect: { id: store.id } }, // Connect the store relation
    },
  });

  // Create or upsert multiple articles for the store
  const articles = await Promise.all(
    Array.from({ length: 10 }).map((_, i) =>
      prisma.article.upsert({
        where: {
          name_storeId: { name: `Article ${i + 1}`, storeId: store.id },
        }, // Use unique constraint
        update: {}, // No update fields needed
        create: {
          id: randomUUID(),
          name: `Article ${i + 1}`,
          purchasePrice: Math.floor(Math.random() * 5000 + 1000), // Prices between 1,000 and 6,000 without decimals
          sellingPrice: Math.floor(Math.random() * 7000 + 2000), // Prices between 2,000 and 9,000 without decimals
          stock: Math.floor(Math.random() * 100) + 50,
          unit: 'piece',
          store: { connect: { id: store.id } }, // Connect the store relation
        },
      }),
    ),
  );

  // Upsert client for the store
  const client = await prisma.client.upsert({
    where: { name_storeId: { name: 'Test Client', storeId: store.id } },
    update: {}, // No update fields needed
    create: {
      id: randomUUID(),
      name: 'Test Client',
      email: 'client@test.com',
      phone: '0987654321',
      address: '456 Client Road',
      city: 'Client City',
      store: { connect: { id: store.id } }, // Connect the store relation
    },
  });

  // Upsert order for the client
  const order = await prisma.order.upsert({
    where: { id: randomUUID() }, // Generate random ID for now (can be optimized)
    update: {}, // No update fields needed
    create: {
      id: randomUUID(),
      client: { connect: { id: client.id } }, // Connect the client relation
      store: { connect: { id: store.id } }, // Connect the store relation
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
          order: { connect: { id: order.id } }, // Connect the order relation
          article: { connect: { id: article.id } }, // Connect the article relation
          quantity: Math.floor(Math.random() * 10) + 1,
        },
      }),
    ),
  );

  // Upsert invoice for the order
  const invoice = await prisma.invoice.upsert({
    where: { orderId: order.id }, // Unique relation to order
    update: {}, // No update fields needed
    create: {
      id: randomUUID(),
      order: { connect: { id: order.id } }, // Connect the order relation
      client: { connect: { id: client.id } }, // Connect the client relation
      store: { connect: { id: store.id } }, // Connect the store relation
      amount: orderItems.reduce(
        (total, item) =>
          total +
          item.quantity *
            articles.find((a) => a.id === item.articleId)!.sellingPrice,
        0,
      ),
      isPaid: false,
    },
  });

  // Create invoice items
  await Promise.all(
    orderItems.map((orderItem) =>
      prisma.invoiceItem.create({
        data: {
          id: randomUUID(),
          invoice: { connect: { id: invoice.id } }, // Connect the invoice relation
          article: { connect: { id: orderItem.articleId } }, // Connect the article relation
          quantity: orderItem.quantity,
        },
      }),
    ),
  );

  // Create transactions for the cash desk
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
        label,
        cashDesk: { connect: { id: cashDesk.id } }, // Connect the cash desk relation
        createdAt: new Date(date),
        updatedAt: new Date(date),
        articles: {
          connect: articles.map((article) => ({ id: article.id })), // Connect all articles
        },
      },
    });
  }

  console.log('Database seeded successfully with upsert and connect.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
