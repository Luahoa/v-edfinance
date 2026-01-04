-- CreateTable
CREATE TABLE "OptimizationLog" (
    "id" TEXT NOT NULL,
    "queryText" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "performanceGain" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION,
    "embedding" vector(384),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedAt" TIMESTAMP(3),

    CONSTRAINT "OptimizationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OptimizationLog_createdAt_idx" ON "OptimizationLog"("createdAt");
