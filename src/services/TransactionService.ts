import { getCustomRepository, getRepository, In } from 'typeorm';
import csvParse from 'csv-parse';
import { createReadStream, promises } from 'fs';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface RequestDTO {
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
  public async store({ title, category, type, value }: RequestDTO): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);
    const { total } = await transactionRepository.getBalance();

    if (type === 'outcome' && total < value)
      throw new AppError('Insuficient balance');

    let categoryExists = await categoryRepository.findOne({
      where: { title: category },
    });

    if (!categoryExists) {
      categoryExists = categoryRepository.create({ title: category });
      await categoryRepository.save(categoryExists);
    }

    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category: categoryExists,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }

  public async delete(transId: string): Promise<void> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const transactionExists = await transactionRepository.findOne(transId);

    if (!transactionExists) throw new AppError('Transactions not found', 404);

    await transactionRepository.delete(transId);
  }

  async import(filePath: string): Promise<any> {
    const readStream = createReadStream(filePath);
    const parsers = csvParse({ from_line: 2 });
    const parseCSV = readStream.pipe(parsers);
    const importedTransactions: RequestDTO[] = [];
    const categories: string[] = [];
    const categoryRepository = getRepository(Category);
    const transactionRepository = getCustomRepository(TransactionsRepository);

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (title && type && value) {
        categories.push(category);
        importedTransactions.push({ title, type, value, category });
      }
    });
    await new Promise(resolve => parseCSV.on('end', resolve));

    const fileBalance = importedTransactions.reduce(
      (accumulator, transaction) => {
        if (transaction.type === 'income')
          accumulator.income += Number(transaction.value);
        else accumulator.outcome += Number(transaction.value);
        return accumulator;
      },
      { income: 0, outcome: 0, total: 0 },
    );

    fileBalance.total = fileBalance.income - fileBalance.outcome;

    const balance = await transactionRepository.getBalance();

    const test = fileBalance.total + balance.total;
    if (test < 0) {
      await promises.unlink(filePath);
      throw new AppError('Insuficient balance to acept this import');
    }

    const existentCategories = await categoryRepository.find({
      where: { title: In(categories) },
    });

    const existentCategoriesTitles = existentCategories.map(it => it.title);

    const addCategories = categories
      .filter(cat => !existentCategoriesTitles.includes(cat))
      .filter((cat, i, arr) => arr.indexOf(cat) === i);

    const newCategories = categoryRepository.create(
      addCategories.map(title => ({ title })),
    );

    categoryRepository.save(newCategories);

    const finalCategories = [...newCategories, ...existentCategories];

    const createdTransactions = transactionRepository.create(
      importedTransactions.map(transact => ({
        title: transact.title,
        type: transact.type,
        value: transact.value,
        category: finalCategories.find(cat => cat.title === transact.category),
      })),
    );

    await promises.unlink(filePath);

    await transactionRepository.save(createdTransactions);

    return createdTransactions;
  }
}

export default new TransactionService();
