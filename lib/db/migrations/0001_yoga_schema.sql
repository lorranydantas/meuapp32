CREATE TABLE IF NOT EXISTS "categories" (
    "id" serial PRIMARY KEY NOT NULL,
    "slug" varchar(50) NOT NULL,
    "title" varchar(100) NOT NULL,
    "icon" varchar(100),
    CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);

CREATE TABLE IF NOT EXISTS "courses" (
    "id" serial PRIMARY KEY NOT NULL,
    "category_id" integer NOT NULL,
    "teacher_id" integer NOT NULL,
    "title" varchar(150) NOT NULL,
    "description" text,
    "level" varchar(50),
    "cover_url" text,
    "is_published" integer DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS "lessons" (
    "id" serial PRIMARY KEY NOT NULL,
    "course_id" integer NOT NULL,
    "title" varchar(150) NOT NULL,
    "duration_min" integer,
    "video_path" text,
    "order_index" integer
);

CREATE TABLE IF NOT EXISTS "progress" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL,
    "lesson_id" integer NOT NULL,
    "completed_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL,
    "stripe_customer_id" text,
    "status" varchar(20) NOT NULL,
    "current_period_end" timestamp
);

CREATE TABLE IF NOT EXISTS "teachers" (
    "id" integer PRIMARY KEY NOT NULL,
    "bio" text,
    "instagram_url" varchar(255),
    "revenue_share" integer DEFAULT 0 NOT NULL
);

ALTER TABLE "courses" ADD CONSTRAINT "courses_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "courses" ADD CONSTRAINT "courses_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "progress" ADD CONSTRAINT "progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "progress" ADD CONSTRAINT "progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
