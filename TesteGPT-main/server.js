require("dotenv").config();

const app = require("./src/app");

const { port } = require("./src/config/env");

app.listen(port, () => {
  console.log(
    `Servidor rodando na porta ${port}`
  );
});