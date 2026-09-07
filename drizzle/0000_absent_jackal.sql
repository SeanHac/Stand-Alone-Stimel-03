CREATE TABLE `patients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`first_name` text,
	`last_name` text,
	`date_of_birth` text,
	`gender` text,
	`phone_number` text,
	`email` text,
	`address` text,
	`clinical_diagnosis` text,
	`affected_side` text,
	`sensory_status` integer,
	`muscle_tone` integer,
	`start_date` text,
	`emergency_contact` text,
	`notes` text,
	`status` text DEFAULT 'Active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `programs` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`short_description` text NOT NULL,
	`biofeedback` text,
	`treatment_duration` text,
	`pause_packet_ratio` integer NOT NULL,
	`packet_duration` text NOT NULL,
	`dose` text NOT NULL,
	`note` text
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`patient_id` integer NOT NULL,
	`program_id` integer NOT NULL,
	`session_date` text,
	`treatment_duration_min` text,
	`biofeedback` text,
	`affected_side` text,
	`pain_score` integer,
	`general_feeling` integer,
	`perceived_improvement` integer,
	`muscle_response` integer,
	`patient_tolerance` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`medical_license_number` text NOT NULL,
	`username` text NOT NULL,
	`state` text NOT NULL,
	`city` text NOT NULL,
	`full_address` text NOT NULL,
	`password_hash` text NOT NULL,
	`password_salt` blob NOT NULL,
	`recovery_key_hash` text NOT NULL,
	`recovery_key_salt` blob NOT NULL,
	`dek_wrapped_by_password` blob NOT NULL,
	`dek_wrapped_by_recovery` blob NOT NULL,
	`disclaimer_accepted_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "users_single_row" CHECK("users"."id" = 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);