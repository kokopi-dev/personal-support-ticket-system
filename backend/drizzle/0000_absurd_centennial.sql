CREATE TABLE `tickets` (
	`id` integer PRIMARY KEY NOT NULL,
	`subject` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`createdAt` text NOT NULL
);
