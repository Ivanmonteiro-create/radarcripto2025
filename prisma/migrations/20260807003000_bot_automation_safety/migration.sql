CREATE UNIQUE INDEX "Order_one_pending_per_bot"
ON "Order" ("botId")
WHERE "status" IN ('PENDING', 'UNKNOWN', 'OPEN', 'PARTIALLY_FILLED');

CREATE UNIQUE INDEX "Position_one_open_per_bot"
ON "Position" ("botId")
WHERE "isOpen" = true;
