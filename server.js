import express from 'express';
import router from './routes/index';

// eslint-disable-next-line import/prefer-default-export
export const app = express();
// eslint-disable-next-line jest/require-hook
app.use(express.json());

// eslint-disable-next-line jest/require-hook
app.use('/', router);

const PORT = process.env.PORT || 5000;

// eslint-disable-next-line jest/require-hook
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
