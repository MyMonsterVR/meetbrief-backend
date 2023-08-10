CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(255),
	`email` varchar(255),
	`password` varchar(255),
	`salt` varchar(255),
	`created_date` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP' ON UPDATE CURRENT_TIMESTAMP,
	`updated_date` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
	CONSTRAINT `users_username_unique` UNIQUE(`username`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
