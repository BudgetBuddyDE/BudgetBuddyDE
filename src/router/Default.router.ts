import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.send('Hello World! from default router');
});

export default router;
