import express from "express";
import router from "./routes/index";

export const app = express();
app.use(express.json());

app.use('/', router);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
