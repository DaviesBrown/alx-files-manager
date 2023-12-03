import express from "express";
import router from "./routes/index";

const app = express();
app.use(express.json());

app.use('/', router);
/* app.get("/", (req, res) => {
    req.params
}) */

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
