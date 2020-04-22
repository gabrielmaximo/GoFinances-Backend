import { MigrationInterface, QueryRunner } from 'typeorm';

export default class RenameCategoryToCategories1587519249149
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    queryRunner.renameTable('category', 'categories');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    queryRunner.renameTable('categories', 'category');
  }
}
