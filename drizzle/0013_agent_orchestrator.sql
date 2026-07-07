-- AI Agent Orchestrator tables (Sprint Agent)
-- agentTasks: queue of tasks for the 29 DROPi AI agents
CREATE TABLE `agentTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orchestratorRunId` varchar(36),
	`dropiRole` enum('customer','merchant','delivery_partner','support_agent','analyst','compliance_officer','fraud_detection','performance_monitor','incident_responder','operations_manager','logistics_coordinator','fleet_manager','c2_compliance_officer','c2_performance_monitor','c2_incident_responder','data_analyst','quality_assurance','emergency_coordinator','dispatch_manager','resource_allocator','communication_officer','c3_data_analyst','incident_commander','system_administrator','security_officer','audit_manager','configuration_manager','analytics_manager','support_coordinator') NOT NULL,
	`channel` enum('C1','C2','C3','ADMIN') NOT NULL,
	`taskType` varchar(100) NOT NULL,
	`payload` json,
	`status` enum('pending','running','done','failed','cancelled') NOT NULL DEFAULT 'pending',
	`priority` int NOT NULL DEFAULT 5,
	`result` json,
	`errorMessage` text,
	`createdBy` int,
	`agentUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`startedAt` timestamp,
	`completedAt` timestamp,
	CONSTRAINT `agentTasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
-- agentState: live status of each AI agent
CREATE TABLE `agentState` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentUserId` int NOT NULL,
	`dropiRole` enum('customer','merchant','delivery_partner','support_agent','analyst','compliance_officer','fraud_detection','performance_monitor','incident_responder','operations_manager','logistics_coordinator','fleet_manager','c2_compliance_officer','c2_performance_monitor','c2_incident_responder','data_analyst','quality_assurance','emergency_coordinator','dispatch_manager','resource_allocator','communication_officer','c3_data_analyst','incident_commander','system_administrator','security_officer','audit_manager','configuration_manager','analytics_manager','support_coordinator') NOT NULL,
	`channel` enum('C1','C2','C3','ADMIN') NOT NULL,
	`status` enum('idle','running','waiting') NOT NULL DEFAULT 'idle',
	`currentTaskId` int,
	`context` json,
	`lastActiveAt` timestamp NOT NULL DEFAULT (now()),
	`lastReportAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agentState_id` PRIMARY KEY(`id`),
	CONSTRAINT `agentState_agentUserId_unique` UNIQUE(`agentUserId`)
);
--> statement-breakpoint
-- agentReports: structured output for each completed task
CREATE TABLE `agentReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentUserId` int NOT NULL,
	`dropiRole` enum('customer','merchant','delivery_partner','support_agent','analyst','compliance_officer','fraud_detection','performance_monitor','incident_responder','operations_manager','logistics_coordinator','fleet_manager','c2_compliance_officer','c2_performance_monitor','c2_incident_responder','data_analyst','quality_assurance','emergency_coordinator','dispatch_manager','resource_allocator','communication_officer','c3_data_analyst','incident_commander','system_administrator','security_officer','audit_manager','configuration_manager','analytics_manager','support_coordinator') NOT NULL,
	`taskId` int,
	`channel` enum('C1','C2','C3','ADMIN') NOT NULL,
	`mode` enum('autonomous','assistant') NOT NULL DEFAULT 'autonomous',
	`period` varchar(50),
	`actionsExecuted` json,
	`bugsFound` json,
	`logicIssues` json,
	`suggestions` json,
	`edgeCases` json,
	`overallStatus` enum('ok','attention','critical') NOT NULL DEFAULT 'ok',
	`summary` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agentReports_id` PRIMARY KEY(`id`)
);
