-- CreateTable
CREATE TABLE "Log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "start" DATETIME NOT NULL,
    "end" DATETIME,
    "category_id" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "task_id" TEXT,
    "day_key" TEXT NOT NULL,
    "duration_sec" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Log_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "plan_sec" INTEGER,
    "due" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Log_day_key_idx" ON "Log"("day_key");

-- CreateIndex
CREATE INDEX "Log_category_id_idx" ON "Log"("category_id");

-- CreateIndex
CREATE INDEX "Log_start_idx" ON "Log"("start");
