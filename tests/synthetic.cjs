// DADOS SINTÉTICOS; NÃO USAR EM VEÍCULO
'use strict';

const { createHash } = require('node:crypto');

// No files are read or written. All nonzero bytes below are invented for tests.
// These metadata positions exercise the fixed checker; they are not ECU data.
function baseSynthetic() {
  const bytes = new Uint8Array(0x200000);
  const view = new DataView(bytes.buffer);
  const words = [
    [0x15BD80, 0x140008], [0x15BD7C, 0x17FFE8],
    [0x15BD84, 0x07D1C8], [0x15BD78, 0x0844C8],
    [0x15BD88, 1], [0x10030, 0x10238], [0x10034, 0x74A44],
    [0x1608C8, 0x10040], [0x10238, 0x12345678]
  ];
  for (const [address, value] of words) view.setUint32(address, value, false);
  const marker = { address: 0x4000, text: 'SYNTHETIC' };
  bytes.set(Buffer.from(marker.text, 'ascii'), marker.address);
  bytes.set([0x12, 0x34, 0x56, 0x78], 0x4100);
  const codeRange = [0x4200, 0x4240];
  for (let i = codeRange[0]; i < codeRange[1]; i++) bytes[i] = (i * 17 + 3) & 255;
  const addresses = Array.from({ length: 6 }, (_, index) => 0x140100 + index * 4);
  [1, 2, 3, 4, 5, 6].forEach((value, index) => view.setFloat32(addresses[index], value, false));
  // Invented VID marker plus an additive 16-bit inverse, without an identifier.
  bytes[0x100D5] = 0x2A;
  view.setUint16(0x100C0, 0xFFD6, false);
  let boot = 0;
  for (let address = 0x10238; address < 0x10238 + 0x74A44 - 3; address += 0x40) {
    boot = (boot + view.getUint32(address, false)) >>> 0;
  }
  view.setUint32(0x10038, boot, false);
  let principal = 0;
  for (const [start, end] of [[0x140008, 0x17FFE8], [0x07D1C8, 0x0844C8]]) {
    for (let address = start; address < end; address += 4) {
      principal = (principal + view.getUint32(address, false)) >>> 0;
    }
  }
  view.setUint32(0x15BD8C, (1 - principal) >>> 0, false);
  const profile = {
    id: 'synthetic-test-only', name: 'SYNTHETIC / test only', bytes: bytes.length,
    firmwareMarker: marker, codeRange,
    codeSHA256: createHash('sha256').update(bytes.subarray(...codeRange)).digest('hex'),
    guards: [{ address: 0x4100, hex: '12345678' }],
    maps: [{
      id: 'synthetic-map', name: 'Synthetic six cells', group: 'Tests',
      nx: 3, ny: 2, addresses, x: [0, 1, 2], y: [0, 1], unit: 'test units'
    }]
  };
  return { bytes, profile, mapId: 'synthetic-map' };
}

module.exports = { baseSynthetic };
