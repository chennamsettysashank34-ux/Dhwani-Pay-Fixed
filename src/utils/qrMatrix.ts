/**
 * Lightweight, zero-dependency QR Code Matrix Generator in TypeScript
 * Implements standard QR Code (Byte mode, Error Correction Level M/L)
 * Spec: ISO/IEC 18004
 */

export type QRMatrix = boolean[][];

// Polynomial division for Reed-Solomon error correction
const GF256_EXP = new Uint8Array(512);
const GF256_LOG = new Uint8Array(256);

(function initGF() {
  let val = 1;
  for (let i = 0; i < 255; i++) {
    GF256_EXP[i] = val;
    GF256_EXP[i + 255] = val;
    GF256_LOG[val] = i;
    val = (val << 1) ^ (val >= 128 ? 0x11d : 0);
  }
})();

function gfMultiply(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return GF256_EXP[GF256_LOG[x] + GF256_LOG[y]];
}

function rsComputeSyndromes(data: Uint8Array, numEcBytes: number): Uint8Array {
  let gen = new Uint8Array([1]);
  for (let i = 0; i < numEcBytes; i++) {
    const nextGen = new Uint8Array(gen.length + 1);
    const factor = GF256_EXP[i];
    for (let j = 0; j < gen.length; j++) {
      nextGen[j] ^= gfMultiply(gen[j], factor);
      nextGen[j + 1] ^= gen[j];
    }
    gen = nextGen;
  }

  const remainder = new Uint8Array(numEcBytes);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ remainder[0];
    for (let j = 0; j < numEcBytes - 1; j++) {
      remainder[j] = remainder[j + 1] ^ gfMultiply(gen[numEcBytes - 1 - j], factor);
    }
    remainder[numEcBytes - 1] = gfMultiply(gen[0], factor);
  }
  return remainder;
}

const VERSION_SPECS = [
  { version: 1, size: 21, dataBytes: 16, ecBytes: 10 },
  { version: 2, size: 25, dataBytes: 28, ecBytes: 16 },
  { version: 3, size: 29, dataBytes: 44, ecBytes: 26 },
  { version: 4, size: 33, dataBytes: 64, ecBytes: 18 * 2 },
  { version: 5, size: 37, dataBytes: 86, ecBytes: 24 * 2 },
  { version: 6, size: 41, dataBytes: 108, ecBytes: 16 * 4 },
  { version: 7, size: 45, dataBytes: 124, ecBytes: 18 * 4 },
  { version: 8, size: 49, dataBytes: 154, ecBytes: 22 * 4 },
  { version: 9, size: 53, dataBytes: 182, ecBytes: 22 * 5 },
  { version: 10, size: 57, dataBytes: 216, ecBytes: 26 * 5 },
];

export function generateQRMatrix(text: string): QRMatrix {
  const utf8Bytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    let charCode = text.charCodeAt(i);
    if (charCode < 0x80) {
      utf8Bytes.push(charCode);
    } else if (charCode < 0x800) {
      utf8Bytes.push(0xc0 | (charCode >> 6), 0x80 | (charCode & 0x3f));
    } else {
      utf8Bytes.push(0xe0 | (charCode >> 12), 0x80 | ((charCode >> 6) & 0x3f), 0x80 | (charCode & 0x3f));
    }
  }

  const neededBytes = utf8Bytes.length + 3;
  let spec = VERSION_SPECS.find((s) => s.dataBytes >= neededBytes);
  if (!spec) {
    spec = VERSION_SPECS[VERSION_SPECS.length - 1];
  }

  const { size, dataBytes, ecBytes } = spec;

  const bits: number[] = [];
  function pushBits(val: number, length: number) {
    for (let i = length - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  }

  pushBits(0b0100, 4); // Byte mode indicator
  pushBits(utf8Bytes.length, 8); // Character count
  for (const b of utf8Bytes) {
    pushBits(b, 8);
  }

  const padBitsNeeded = dataBytes * 8 - bits.length;
  const termLength = Math.min(4, Math.max(0, padBitsNeeded));
  pushBits(0, termLength);

  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const padPatterns = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < dataBytes * 8) {
    pushBits(padPatterns[padIdx % 2], 8);
    padIdx++;
  }

  const dataArray = new Uint8Array(dataBytes);
  for (let i = 0; i < dataBytes; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bits[i * 8 + j];
    }
    dataArray[i] = b;
  }

  const ecArray = rsComputeSyndromes(dataArray, ecBytes);
  const codewords = new Uint8Array(dataBytes + ecBytes);
  codewords.set(dataArray, 0);
  codewords.set(ecArray, dataBytes);

  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunctionModule: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  function setModule(r: number, c: number, val: boolean) {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      matrix[r][c] = val;
      isFunctionModule[r][c] = true;
    }
  }

  function drawFinderPattern(row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
            const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
            const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
            setModule(nr, nc, isBorder || isCenter);
          } else {
            setModule(nr, nc, false);
          }
        }
      }
    }
  }

  drawFinderPattern(0, 0);
  drawFinderPattern(0, size - 7);
  drawFinderPattern(size - 7, 0);

  for (let i = 8; i < size - 8; i++) {
    const val = i % 2 === 0;
    setModule(6, i, val);
    setModule(i, 6, val);
  }

  setModule(4 * spec.version + 9, 8, true);

  for (let i = 0; i <= 8; i++) {
    if (i !== 6) {
      isFunctionModule[8][i] = true;
      isFunctionModule[i][8] = true;
    }
  }
  for (let i = 0; i < 8; i++) {
    isFunctionModule[8][size - 1 - i] = true;
    isFunctionModule[size - 1 - i][8] = true;
  }

  let byteIndex = 0;
  let bitIndex = 7;
  let upwards = true;

  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--;

    for (let vert = 0; vert < size; vert++) {
      const row = upwards ? size - 1 - vert : vert;

      for (let colOffset = 0; colOffset < 2; colOffset++) {
        const col = right - colOffset;
        if (!isFunctionModule[row][col]) {
          let bit = false;
          if (byteIndex < codewords.length) {
            bit = ((codewords[byteIndex] >> bitIndex) & 1) === 1;
            bitIndex--;
            if (bitIndex < 0) {
              bitIndex = 7;
              byteIndex++;
            }
          }

          const mask = (row + col) % 2 === 0;
          matrix[row][col] = bit !== mask;
        }
      }
    }
    upwards = !upwards;
  }

  const formatInfo = 0b101010000010010;
  for (let i = 0; i < 15; i++) {
    const bit = ((formatInfo >> (14 - i)) & 1) === 1;
    if (i <= 5) matrix[8][i] = bit;
    else if (i === 6) matrix[8][7] = bit;
    else if (i === 7) matrix[8][8] = bit;
    else if (i === 8) matrix[7][8] = bit;
    else matrix[14 - i][8] = bit;

    if (i < 7) {
      matrix[size - 1 - i][8] = bit;
    } else {
      matrix[8][size - 8 + (i - 7)] = bit;
    }
  }

  return matrix;
}
