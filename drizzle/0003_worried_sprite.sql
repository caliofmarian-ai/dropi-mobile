CREATE TABLE `roleApplications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`requestedRole` enum('customer','merchant','delivery_partner','support_agent','analyst','compliance_officer','fraud_detection','performance_monitor','incident_responder','operations_manager','logistics_coordinator','fleet_manager','c2_compliance_officer','c2_performance_monitor','c2_incident_responder','data_analyst','quality_assurance','emergency_coordinator','dispatch_manager','resource_allocator','communication_officer','c3_data_analyst','incident_commander','system_administrator','security_officer','audit_manager','configuration_manager','analytics_manager','support_coordinator') NOT NULL,
	`requestedChannel` enum('C1','C2','C3','ADMIN') NOT NULL,
	`motivation` text,
	`qualifications` text,
	`documentUrls` json,
	`status` enum('pending','under_review','approved','rejected','withdrawn') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`rejectionReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roleApplications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`documentType` enum('driving_license','drone_license','vehicle_registration','insurance','background_check','other') NOT NULL,
	`documentUrl` varchar(500),
	`licenseNumber` varchar(100),
	`expiryDate` timestamp,
	`vehicleType` enum('drone','car','van','ebike','motorcycle'),
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`rejectionReason` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `verifications_id` PRIMARY KEY(`id`)
);
