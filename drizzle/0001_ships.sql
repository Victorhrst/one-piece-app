CREATE TABLE `ships` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text,
	`image_url` text,
	`first_chapter` integer,
	`first_arc_id` text,
	`affiliation` text,
	`source_url` text,
	`source_payload` text DEFAULT '{}' NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`first_arc_id`) REFERENCES `arcs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `ships_first_arc_idx` ON `ships` (`first_arc_id`);
--> statement-breakpoint
CREATE INDEX `ships_name_idx` ON `ships` (`name`);
