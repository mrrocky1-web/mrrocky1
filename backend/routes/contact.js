const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  const { name, email, message } = req.body;
  console.log(`Support Query from ${name} (${email}): ${message}`);
  res.json({ success: true, message: 'Your message has been sent to Customer Support (fhub0021@gmail.com)!' });
});

module.exports = router;
