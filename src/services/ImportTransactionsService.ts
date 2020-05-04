import fs from 'fs';
import parse from 'csv-parse/lib/sync';
import { getRepository, getCustomRepository, In } from 'typeorm';

import path from 'path';
import TransactionRepository from '../repositories/TransactionsRepository';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import uploadConfig from '../config/upload';

interface RequestDTO {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  async execute(filename: string): Promise<Transaction[]> {
    const csvFilePath = path.join(uploadConfig.directory, filename);
    const file = fs.readFileSync(csvFilePath);
    const transactions: RequestDTO[] = await parse(file, {
      columns: true,
      delimiter: ', ',
      skip_lines_with_empty_values: true,
    });

    const transactionRepository = getCustomRepository(TransactionRepository);
    const categoriesRepository = getRepository(Category);

    const categoriesFromInputs = transactions.map(
      transaction => transaction.category,
    );
    const existentCategories = await categoriesRepository.find({
      where: { title: In(categoriesFromInputs) },
    });
    const existentCategoriesTitle = existentCategories.map(
      category => category.title,
    );

    const addCategories = categoriesFromInputs
      .filter(category => !existentCategoriesTitle.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      addCategories.map(title => ({ title })),
    );

    await categoriesRepository.save(newCategories);

    const allCategories = [...existentCategories, ...newCategories];

    const inputedTransactions = transactionRepository.create(
      transactions.map(({ category, ...transaction }: RequestDTO) => ({
        ...transaction,
        category_id: this.returnCategoryId(
          allCategories.find(({ title }) => title === category),
        ),
      })),
    );

    await transactionRepository.save(inputedTransactions);

    await fs.promises.unlink(csvFilePath);

    return inputedTransactions;
  }

  private returnCategoryId({ id }: any): string {
    return id;
  }
}

export default ImportTransactionsService;
