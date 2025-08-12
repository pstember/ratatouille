-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_recipes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "externalId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "image" TEXT,
    "servings" INTEGER,
    "readyInMinutes" INTEGER,
    "sourceUrl" TEXT,
    "sourceName" TEXT,
    "summary" TEXT,
    "instructions" TEXT,
    "isNew" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_recipes" ("createdAt", "externalId", "id", "image", "instructions", "readyInMinutes", "servings", "sourceName", "sourceUrl", "summary", "title", "updatedAt") SELECT "createdAt", "externalId", "id", "image", "instructions", "readyInMinutes", "servings", "sourceName", "sourceUrl", "summary", "title", "updatedAt" FROM "recipes";
DROP TABLE "recipes";
ALTER TABLE "new_recipes" RENAME TO "recipes";
CREATE UNIQUE INDEX "recipes_externalId_key" ON "recipes"("externalId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
