/*
  Warnings:

  - You are about to drop the `_keywordtopost` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `posts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_keywordtopost` DROP FOREIGN KEY `_KeywordToPost_A_fkey`;

-- DropForeignKey
ALTER TABLE `_keywordtopost` DROP FOREIGN KEY `_KeywordToPost_B_fkey`;

-- AlterTable
ALTER TABLE `keywords` MODIFY `name` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `_keywordtopost`;

-- DropTable
DROP TABLE `posts`;

-- CreateTable
CREATE TABLE `quizes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `question` VARCHAR(191) NOT NULL,
    `answer` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_KeywordToQuiz` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_KeywordToQuiz_AB_unique`(`A`, `B`),
    INDEX `_KeywordToQuiz_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_KeywordToQuiz` ADD CONSTRAINT `_KeywordToQuiz_A_fkey` FOREIGN KEY (`A`) REFERENCES `keywords`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_KeywordToQuiz` ADD CONSTRAINT `_KeywordToQuiz_B_fkey` FOREIGN KEY (`B`) REFERENCES `quizes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
