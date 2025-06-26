const express = require('express');
const sharp = require('sharp');
const multer = require('multer');
const app = express();
const upload = multer();

app.post('/compress', upload.single('image'), async (req, res) => {
  const targetKB = parseInt(req.body.targetKB);
  if (!req.file || !targetKB) return res.status(400).send('Missing params');

  const inputBuffer = req.file.buffer;
  let format = req.body.format === 'png' ? 'png' : 'jpeg';

  let minQ = 1, maxQ = 100, bestBuffer = null;

  while (minQ <= maxQ) {
    const q = Math.floor((minQ + maxQ) / 2);
    let buff;
    if (format === 'jpeg') {
      buff = await sharp(inputBuffer).jpeg({ quality: q }).toBuffer();
    } else {
      buff = await sharp(inputBuffer).png({ compressionLevel: 9 }).toBuffer();
    }
    const sizeKB = buff.length / 1024;
    if (sizeKB <= targetKB) {
      bestBuffer = buff;
      minQ = q + 1;
    } else {
      maxQ = q - 1;
    }
  }

  if (!bestBuffer) return res.status(400).send('Cannot compress to target size');

  res.set('Content-Type', format === 'jpeg' ? 'image/jpeg' : 'image/png');
  res.send(bestBuffer);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));