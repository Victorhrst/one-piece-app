CREATE TABLE `affiliation_members` (
	`affiliation_id` text NOT NULL,
	`character_id` text NOT NULL,
	`role` text,
	`known_arc_id` text,
	FOREIGN KEY (`affiliation_id`) REFERENCES `affiliations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`known_arc_id`) REFERENCES `arcs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `affiliation_members_pair_idx` ON `affiliation_members` (`affiliation_id`,`character_id`);--> statement-breakpoint
CREATE INDEX `affiliation_members_arc_idx` ON `affiliation_members` (`known_arc_id`);--> statement-breakpoint
CREATE TABLE `affiliations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`kind` text DEFAULT 'Équipage ou organisation' NOT NULL,
	`description` text,
	`image_url` text,
	`first_arc_id` text,
	`source_url` text,
	`source_payload` text DEFAULT '{}' NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`first_arc_id`) REFERENCES `arcs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `affiliations_first_arc_idx` ON `affiliations` (`first_arc_id`);--> statement-breakpoint
CREATE INDEX `affiliations_name_idx` ON `affiliations` (`name`);--> statement-breakpoint
CREATE TABLE `arcs` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`saga` text NOT NULL,
	`sort_order` integer NOT NULL,
	`chapter_start` integer NOT NULL,
	`chapter_end` integer NOT NULL,
	`episode_start` integer NOT NULL,
	`episode_end` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `chapters` (
	`id` text PRIMARY KEY NOT NULL,
	`number` integer NOT NULL,
	`title` text,
	`volume` integer,
	`arc_id` text,
	`source_payload` text DEFAULT '{}' NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`arc_id`) REFERENCES `arcs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `chapters_number_idx` ON `chapters` (`number`);--> statement-breakpoint
CREATE INDEX `chapters_arc_idx` ON `chapters` (`arc_id`);--> statement-breakpoint
CREATE TABLE `characters` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`image_url` text,
	`description` text,
	`first_chapter` integer,
	`first_arc_id` text,
	`source_url` text,
	`source_payload` text DEFAULT '{}' NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`first_arc_id`) REFERENCES `arcs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `characters_first_arc_idx` ON `characters` (`first_arc_id`);--> statement-breakpoint
CREATE INDEX `characters_name_idx` ON `characters` (`name`);--> statement-breakpoint
CREATE TABLE `devil_fruits` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`model` text,
	`type` text,
	`sub_type` text,
	`image_url` text,
	`first_chapter` integer,
	`first_arc_id` text,
	`canon_status` text DEFAULT 'À confirmer' NOT NULL,
	`description` text,
	`source_url` text,
	`source_payload` text DEFAULT '{}' NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`first_arc_id`) REFERENCES `arcs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `devil_fruits_first_arc_idx` ON `devil_fruits` (`first_arc_id`);--> statement-breakpoint
CREATE INDEX `devil_fruits_name_idx` ON `devil_fruits` (`name`);--> statement-breakpoint
CREATE TABLE `episodes` (
	`id` text PRIMARY KEY NOT NULL,
	`number` integer NOT NULL,
	`title` text,
	`chapter_text` text,
	`arc_id` text,
	`source_payload` text DEFAULT '{}' NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`arc_id`) REFERENCES `arcs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `episodes_number_idx` ON `episodes` (`number`);--> statement-breakpoint
CREATE INDEX `episodes_arc_idx` ON `episodes` (`arc_id`);--> statement-breakpoint
CREATE TABLE `sync_state` (
	`source` text PRIMARY KEY NOT NULL,
	`synced_at` text NOT NULL,
	`record_count` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'ok' NOT NULL
);
