-- CreateTable
CREATE TABLE "HiddenRecipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HiddenRecipe_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "HiddenRecipe_userId_idx" ON "HiddenRecipe"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "HiddenRecipe_userId_recipeId_key" ON "HiddenRecipe"("userId", "recipeId");
