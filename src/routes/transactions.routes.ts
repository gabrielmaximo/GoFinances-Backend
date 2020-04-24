import { Router, response } from 'express';
import multer from 'multer';
import TransactionService from '../services/TransactionService';
import uploadConfig from '../config/upload';

const transactionsRouter = Router();
const upload = multer(uploadConfig);

transactionsRouter.get('/', async (req, res) => {
  return res.json(await TransactionService.list());
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

  return res.status(204).json();
});

transactionsRouter.post('/import', upload.single('file'), async (req, res) => {
  const importedTransactions = await TransactionService.import(req.file.path);

  return res.json(importedTransactions);
});

export default transactionsRouter;
