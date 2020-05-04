// import AppError from '../errors/AppError';

import { getCustomRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  transaction_id: string;
}

class DeleteTransactionService {
  public async execute({ transaction_id }: Request): Promise<void> {
    const transactionRepository = getCustomRepository(TransactionsRepository);

    await transactionRepository.delete({ id: transaction_id });
  }
}

export default DeleteTransactionService;
