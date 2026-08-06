// generate_icons.js - Script to generate valid PNG icon files for extension
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(width, height) {
  // Simple PNG generator using zlib
  const bufferSize = width * height * 4 + height;
  const rawData = Buffer.alloc(bufferSize);
  let pos = 0;

  for (let y = 0; y < height; y++) {
    rawData[pos++] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      // Create a nice purple-cyan gradient icon with circle shape
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const radius = width * 0.45;

      if (dist <= radius) {
        // Gradient color: purple (#8b5cf6) to cyan (#06b6d4)
        const t = x / width;
        const r = Math.round(139 * (1 - t) + 6 * t);
        const g = Math.round(92 * (1 - t) + 182 * t);
        const b = Math.round(246 * (1 - t) + 212 * t);
        rawData[pos++] = r; // R
        rawData[pos++] = g; // G
        rawData[pos++] = b; // B
        rawData[pos++] = 255; // A
      } else {
        rawData[pos++] = 0;
        rawData[pos++] = 0;
        rawData[pos++] = 0;
        rawData[pos++] = 0; // Transparent
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  // PNG Signature
  const pngHeader = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([pngHeader, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(12 + len);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const crc = crc32(buf.subarray(4, 8 + len));
  buf.writeInt32BE(crc, 8 + len);
  return buf;
}

// CRC32 implementation
function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    let byte = buf[i];
    for (let j = 0; j < 8; j++) {
      let bit = (crc ^ byte) & 1;
      crc = (crc >>> 1) ^ (bit ? 0xedb88320 : 0);
      byte >>>= 1;
    }
  }
  return (crc ^ -1);
}

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

[16, 48, 128].forEach(size => {
  const pngBuffer = createPNG(size, size);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), pngBuffer);
  console.log(`Generated icon${size}.png`);
});
