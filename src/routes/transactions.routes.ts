import { Router } from 'express';

import TransactionService from '../services/TransactionService';

const transactionsRouter = Router();

transactionsRouter.get('/', async (req, res) => {
  return res.json(TransactionService.list());
});

transactionsRouter.post('/', async (req, res) => {
  const { title, category, type, value } = req.body;

  const transact = await TransactionService.store({
    title,
    category,
    type,
    value,
  });

  return res.status(201).json(transact);
});

transactionsRouter.delete('/:id', async (req, res) => {
  await TransactionService.delete(req.params.id);

  return res.json();
});

// transactionsRouter.post('/import', async (req, res) => {
//   // TODO
// });

export default transactionsRouter;
