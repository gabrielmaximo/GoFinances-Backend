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
  public async list(): Promise<List> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const transactions = await transactionRepository.find();
    const balance = await transactionRepository.getBalance();
    return { transactions, balance };
  }

  // eslint-disable-next-line prettier/prettier
  public async store({ title, category, type, value }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);
    const { total } = await transactionRepository.getBalance();

    if (type === 'outcome' && total < value)
      throw new AppError('Insuficient balance');

    let transactcategory = await categoryRepository.findOne({
      where: { title: category },
    });

    if (!transactcategory) {
      transactcategory = categoryRepository.create({ title: category });
      await transactionRepository.save(transactcategory);
    }

    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category: transactcategory,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }

  public async delete(transId: string): Promise<void> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    await transactionRepository.delete(transId);
  }

  // async import(): Promise<Transaction[]> {
  //   // TODO
  // }
}

export default new TransactionService();
