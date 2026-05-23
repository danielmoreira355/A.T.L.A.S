const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "A.T.L.A.S online",
    message: "Shopify AI automation server is running."
  });
});

app.listen(PORT, () => {
  console.log(`A.T.L.A.S server running on port ${PORT}`);
});
