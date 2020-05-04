import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();

    const incomes = transactions
      .filter(transaction => transaction.type === 'income')
      .reduce(
        (sum, { value }) =>
          parseFloat(sum.toString()) + parseFloat(value.toString()),
        0,
      );

    const outcomes = transactions
      .filter(transaction => transaction.type === 'outcome')
      .reduce(
        (sum, { value }) =>
          parseFloat(sum.toString()) + parseFloat(value.toString()),
        0,
      );

    return {
      income: incomes,
      outcome: outcomes,
      total: incomes - outcomes,
    };
  }
}

export default TransactionsRepository;
