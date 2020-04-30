import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export default class RelationTransactionCategory1587517740059
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createForeignKey(
      'transactions',
      new TableForeignKey({
        name: 'TransactionCategories',
        referencedTableName: 'categories',
        columnNames: ['category_id'],
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('transactions', 'TransactionCategories');
  }
}
