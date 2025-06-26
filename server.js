const express = require('express');
const sharp = require('sharp');
const app = express();

app.use(express.json({ limit: '50mb' }));

app.post('/optimize', async (req, res) => {
  try {
    const { data } = req.body; // base64 string
    const format = req.query.format || 'png';
    const inputBuffer = Buffer.from(data, 'base64');
    let output;
    if (format === 'jpeg' || format === 'jpg') {
      output = await sharp(inputBuffer).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
      res.type('image/jpeg');
    } else {
      output = await sharp(inputBuffer).png({ compressionLevel: 9, palette: true }).toBuffer();
      res.type('image/png');
    }
    res.send(output);
  } catch (err) {
    res.status(500).send('Optimization failed: ' + err.message);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));