import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  category: string;
  type: 'income' | 'outcome';
  value: number;
}

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

interface List {
  transactions: Transaction[];
  balance: Balance;
}

class TransactionService {
  private transactionRepository = getCustomRepository(TransactionsRepository);

  private categoryRepository = getRepository(Category);

  public async list(): Promise<List> {
    const transactions = await this.transactionRepository.find();
    const balance = await this.transactionRepository.getBalance();
    return { transactions, balance };
  }

  // eslint-disable-next-line prettier/prettier
  public async store({ title, category, type, value }: Request): Promise<Transaction> {
    const { total } = await this.transactionRepository.getBalance();

    if (type === 'outcome' && total < value)
      throw new AppError('Insuficient balance');

    let transactcategory = await this.categoryRepository.findOne({
      where: { title: category },
    });

    if (!transactcategory) {
      transactcategory = this.categoryRepository.create({ title: category });
      await this.transactionRepository.save(transactcategory);
    }

    const transaction = this.transactionRepository.create({
      title,
      value,
      type,
      category: transactcategory,
    });

    await this.transactionRepository.save(transaction);

    return transaction;
  }

  public async delete(transId: string): Promise<void> {
    await this.transactionRepository.delete(transId);
  }

  // async import(): Promise<Transaction[]> {
  //   // TODO
  // }
}

export default new TransactionService();
