-- CreateTable
CREATE TABLE "recipe_allergens" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "recipeId" INTEGER NOT NULL,
    "allergen" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'warning',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recipe_allergens_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "recipe_allergens_recipeId_allergen_key" ON "recipe_allergens"("recipeId", "allergen");
