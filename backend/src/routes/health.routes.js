const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "API de Controla+ funcionando correctamente",
  });
});

module.exports = router;