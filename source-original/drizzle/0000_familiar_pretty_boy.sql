CREATE TABLE `media` (
	`id` text PRIMARY KEY NOT NULL,
	`mime` text NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL,
	`owner` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`kind` text NOT NULL,
	`category` text NOT NULL,
	`division` text,
	`status` text NOT NULL,
	`published_at` text NOT NULL,
	`excerpt` text NOT NULL,
	`content` text NOT NULL,
	`cover` text NOT NULL,
	`project` text NOT NULL,
	`source_url` text NOT NULL,
	`migration_status` text NOT NULL,
	`legacy_index` integer,
	`revision` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `posts_status_date` ON `posts` (`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `posts_division_status` ON `posts` (`division`,`status`);--> statement-breakpoint
CREATE TABLE `revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`snapshot` text NOT NULL,
	`created_at` text NOT NULL,
	`actor` text NOT NULL
);
