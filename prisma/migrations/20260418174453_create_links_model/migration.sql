-- CreateTable
CREATE TABLE "links" (
    "shortCode" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT (NOW() + '3 years'::interval),

    CONSTRAINT "links_pkey" PRIMARY KEY ("shortCode")
);

-- CreateIndex
CREATE UNIQUE INDEX "links_shortCode_key" ON "links"("shortCode");
