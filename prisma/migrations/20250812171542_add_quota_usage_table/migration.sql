-- CreateTable
CREATE TABLE "quota_usage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "pointsUsed" INTEGER NOT NULL DEFAULT 0,
    "quotaLimit" INTEGER NOT NULL DEFAULT 150,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "quota_usage_date_key" ON "quota_usage"("date");
