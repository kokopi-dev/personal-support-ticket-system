CREATE TABLE `ticket_replies` (
	`id` text PRIMARY KEY NOT NULL,
	`ticketId` text NOT NULL,
	`userId` text,
	`body` text NOT NULL,
	`authorRole` text DEFAULT 'user' NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`ticketId`) REFERENCES `tickets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
