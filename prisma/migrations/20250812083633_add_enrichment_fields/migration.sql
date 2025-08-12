-- CreateTable
CREATE TABLE "enrichment_stats" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "searchQuery" TEXT NOT NULL,
    "recipesEnriched" INTEGER NOT NULL,
    "enrichmentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quotaUsed" INTEGER NOT NULL,
    "searchMode" TEXT NOT NULL
);

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
    "cuisine" TEXT,
    "isNew" BOOLEAN NOT NULL DEFAULT true,
    "enrichedFromSpoonacular" BOOLEAN NOT NULL DEFAULT false,
    "enrichmentDate" DATETIME,
    "originalSource" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_recipes" ("createdAt", "cuisine", "externalId", "id", "image", "instructions", "isNew", "readyInMinutes", "servings", "sourceName", "sourceUrl", "summary", "title", "updatedAt") SELECT "createdAt", "cuisine", "externalId", "id", "image", "instructions", "isNew", "readyInMinutes", "servings", "sourceName", "sourceUrl", "summary", "title", "updatedAt" FROM "recipes";
DROP TABLE "recipes";
ALTER TABLE "new_recipes" RENAME TO "recipes";
CREATE UNIQUE INDEX "recipes_externalId_key" ON "recipes"("externalId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
