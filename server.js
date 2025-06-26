const express = require('express');
const sharp = require('sharp');
const app = express();

app.use(express.json({ limit: '50mb' }));

app.post('/optimize', async (req, res) => {
  try {
    const { data } = req.body; // base64 string
    const format = req.query.format || 'png';
    const targetKB = parseInt(req.query.targetKB) || 0;
    const inputBuffer = Buffer.from(data, 'base64');
    let output;

    if (format === 'jpeg' || format === 'jpg') {
      // Binary search for quality to fit under targetKB
      let minQ = 10, maxQ = 100, bestBuffer = null;
      while (minQ <= maxQ) {
        const q = Math.floor((minQ + maxQ) / 2);
        const buff = await sharp(inputBuffer).jpeg({ quality: q, mozjpeg: true }).toBuffer();
        const sizeKB = buff.length / 1024;
        if (sizeKB <= targetKB) {
          bestBuffer = buff;
          minQ = q + 1;
        } else {
          maxQ = q - 1;
        }
      }
      output = bestBuffer || await sharp(inputBuffer).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
      res.type('image/jpeg');
    } else {
      // PNG: try palette reduction, but mostly just compressionLevel
      let buff = await sharp(inputBuffer).png({ compressionLevel: 9, palette: true }).toBuffer();
      if (targetKB > 0 && buff.length / 1024 > targetKB) {
        // Try reducing colors if still too big
        buff = await sharp(inputBuffer).png({ compressionLevel: 9, palette: true, colors: 64 }).toBuffer();
      }
      output = buff;
      res.type('image/png');
    }
    res.send(output);
  } catch (err) {
    res.status(500).send('Optimization failed: ' + err.message);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));