-- CreateTable
CREATE TABLE "TaskTransferAudit" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "fromUserId" INTEGER NOT NULL,
    "toUserId" INTEGER NOT NULL,
    "transferredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskTransferAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskTransferAudit_taskId_transferredAt_idx" ON "TaskTransferAudit"("taskId", "transferredAt");

-- CreateIndex
CREATE INDEX "TaskTransferAudit_fromUserId_transferredAt_idx" ON "TaskTransferAudit"("fromUserId", "transferredAt");
