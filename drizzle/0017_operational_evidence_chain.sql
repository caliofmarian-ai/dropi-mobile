CREATE TABLE `operationalEvidenceEvents` (
  `id` int AUTO_INCREMENT NOT NULL,
  `eventUid` varchar(36) NOT NULL,
  `channel` enum('C1','C2','C3','ADMIN') NOT NULL,
  `targetType` enum('order','b2b') NOT NULL,
  `targetId` int NOT NULL,
  `physicalDeliveryId` int,
  `actorUserId` int,
  `actorRole` varchar(64),
  `eventType` enum('assignment','pickup','execution_started','transfer','geofence_entered','fallback','stop','delivery_completed','delivery_failed') NOT NULL,
  `custodyFromUserId` int,
  `custodyToUserId` int,
  `latitude` decimal(10,8),
  `longitude` decimal(11,8),
  `vehicleType` varchar(32),
  `details` json,
  `evidenceHash` varchar(64) NOT NULL,
  `occurredAt` timestamp NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `operationalEvidenceEvents_id` PRIMARY KEY(`id`),
  CONSTRAINT `operationalEvidenceEvents_eventUid_unique` UNIQUE(`eventUid`)
);
--> statement-breakpoint
CREATE INDEX `operationalEvidence_target_time_idx` ON `operationalEvidenceEvents` (`channel`,`targetType`,`targetId`,`occurredAt`);
--> statement-breakpoint
CREATE INDEX `operationalEvidence_actor_idx` ON `operationalEvidenceEvents` (`actorUserId`,`occurredAt`);
--> statement-breakpoint
CREATE TABLE `flightTelemetrySamples` (
  `id` int AUTO_INCREMENT NOT NULL,
  `channel` enum('C1','C2','C3','ADMIN') NOT NULL,
  `targetType` enum('order','b2b') NOT NULL,
  `targetId` int NOT NULL,
  `pilotUserId` int NOT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `speed` decimal(8,3) NOT NULL,
  `heading` decimal(7,3) NOT NULL,
  `altitude` decimal(10,3),
  `vehicleType` varchar(32) NOT NULL,
  `evidenceHash` varchar(64) NOT NULL,
  `recordedAt` timestamp NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `flightTelemetrySamples_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `flightTelemetry_target_time_idx` ON `flightTelemetrySamples` (`channel`,`targetType`,`targetId`,`recordedAt`);
--> statement-breakpoint
CREATE TABLE `deliveryProofs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `proofUid` varchar(36) NOT NULL,
  `channel` enum('C1','C2','C3','ADMIN') NOT NULL,
  `targetType` enum('order','b2b') NOT NULL,
  `targetId` int NOT NULL,
  `receptionMethod` enum('personal_handover','leave_at_door','leave_at_gate','leave_in_yard','drone_reception','droneport_pickup','fallback_handover') NOT NULL,
  `recordedByUserId` int NOT NULL,
  `recipientUserId` int,
  `artifactUrl` varchar(1000),
  `artifactHash` varchar(128),
  `notes` text,
  `latitude` decimal(10,8),
  `longitude` decimal(11,8),
  `evidenceHash` varchar(64) NOT NULL,
  `completedAt` timestamp NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `deliveryProofs_id` PRIMARY KEY(`id`),
  CONSTRAINT `deliveryProofs_proofUid_unique` UNIQUE(`proofUid`)
);
--> statement-breakpoint
CREATE INDEX `deliveryProof_target_idx` ON `deliveryProofs` (`channel`,`targetType`,`targetId`,`completedAt`);
--> statement-breakpoint
CREATE TABLE `deliveryProofAttestations` (
  `id` int AUTO_INCREMENT NOT NULL,
  `proofId` int NOT NULL,
  `signerUserId` int,
  `signerRole` varchar(64) NOT NULL,
  `attestationKind` enum('recorded_by','recipient_confirmed','system_verified') NOT NULL,
  `evidenceHash` varchar(64) NOT NULL,
  `attestedAt` timestamp NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `deliveryProofAttestations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `deliveryProofAttestations_proof_idx` ON `deliveryProofAttestations` (`proofId`,`attestedAt`);
