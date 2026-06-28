CREATE TABLE `apiRequestLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`apiKeyId` int NOT NULL,
	`storeId` int NOT NULL,
	`method` varchar(10) NOT NULL,
	`endpoint` varchar(200) NOT NULL,
	`statusCode` int NOT NULL,
	`responseTimeMs` int NOT NULL,
	`requestBodySize` int DEFAULT 0,
	`responseBodySize` int DEFAULT 0,
	`ipAddress` varchar(45),
	`userAgent` varchar(500),
	`errorCode` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `apiRequestLogs_id` PRIMARY KEY(`id`)
);
