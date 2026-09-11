-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" UUID NOT NULL,
    "stockId" UUID NOT NULL,
    "price" DECIMAL(18,2) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PriceHistory_stockId_idx" ON "PriceHistory"("stockId");

-- CreateIndex
CREATE INDEX "PriceHistory_timestamp_idx" ON "PriceHistory"("timestamp");

-- CreateIndex
CREATE INDEX "PriceHistory_stockId_timestamp_idx" ON "PriceHistory"("stockId", "timestamp");

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
