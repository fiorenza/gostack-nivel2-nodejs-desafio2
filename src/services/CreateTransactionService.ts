import { getRepository, getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const categoryRepository = getRepository(Category);
    const transactionRepository = getCustomRepository(TransactionsRepository);

    const categoryModel = await categoryRepository.findOne({
      where: { title: category },
    });

    let category_id = '';
    if (categoryModel) {
      category_id = categoryModel.id;
    } else {
      const newCategoryModel = categoryRepository.create({
        title: category,
      });
      await categoryRepository.save(newCategoryModel);
      category_id = newCategoryModel.id;
    }

    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category_id,
    });

    if (transaction.type === 'outcome') {
      const { total } = await transactionRepository.getBalance();

      if (total < transaction.value) {
        throw new AppError(
          'You can not make this transaction, insufficient balance',
          400,
        );
      }
    }

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
