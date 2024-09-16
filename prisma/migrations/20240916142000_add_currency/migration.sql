-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Store" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT,
    "nif" TEXT,
    "stat" TEXT,
    "address" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Store_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Store" ("address", "city", "createdAt", "description", "email", "id", "name", "nif", "phone", "stat", "status", "updatedAt", "userId") SELECT "address", "city", "createdAt", "description", "email", "id", "name", "nif", "phone", "stat", "status", "updatedAt", "userId" FROM "Store";
DROP TABLE "Store";
ALTER TABLE "new_Store" RENAME TO "Store";
CREATE UNIQUE INDEX "Store_name_key" ON "Store"("name");
CREATE UNIQUE INDEX "Store_userId_key" ON "Store"("userId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
