import zlib from "node:zlib";

export interface ZipFileEntry {
  name: string;
  data: string | Buffer;
}

/**
 * Membuat buffer berkas ZIP standar (PKZIP 2.0) tanpa dependensi eksternal.
 * Menggunakan kompresi DEFLATE murni dari node:zlib dan perhitungan CRC32.
 */
export function createZipArchive(files: ZipFileEntry[]): Buffer {
  const localHeaders: Buffer[] = [];
  const cdHeaders: Buffer[] = [];
  let offset = 0;

  for (const { name, data } of files) {
    const uncompressed = Buffer.isBuffer(data) ? data : Buffer.from(data, "utf8");
    const crc = zlib.crc32(uncompressed);
    const compressed = zlib.deflateRawSync(uncompressed);
    const nameBuf = Buffer.from(name, "utf8");

    // Local file header (30 bytes + name length)
    const local = Buffer.alloc(30 + nameBuf.length);
    local.writeUInt32LE(0x04034b50, 0); // Local file header signature
    local.writeUInt16LE(20, 4); // Version needed to extract (2.0)
    local.writeUInt16LE(0, 6); // General purpose bit flag
    local.writeUInt16LE(8, 8); // Compression method: Deflate
    local.writeUInt16LE(0, 10); // File last mod time
    local.writeUInt16LE(0, 12); // File last mod date
    local.writeUInt32LE(crc, 14); // CRC-32
    local.writeUInt32LE(compressed.length, 18); // Compressed size
    local.writeUInt32LE(uncompressed.length, 22); // Uncompressed size
    local.writeUInt16LE(nameBuf.length, 26); // Filename length
    local.writeUInt16LE(0, 28); // Extra field length
    nameBuf.copy(local, 30);

    localHeaders.push(local, compressed);

    // Central directory header (46 bytes + name length)
    const cd = Buffer.alloc(46 + nameBuf.length);
    cd.writeUInt32LE(0x02014b50, 0); // Central file header signature
    cd.writeUInt16LE(20, 4); // Version made by
    cd.writeUInt16LE(20, 6); // Version needed to extract
    cd.writeUInt16LE(0, 8); // General purpose bit flag
    cd.writeUInt16LE(8, 10); // Compression method: Deflate
    cd.writeUInt16LE(0, 12); // File last mod time
    cd.writeUInt16LE(0, 14); // File last mod date
    cd.writeUInt32LE(crc, 16); // CRC-32
    cd.writeUInt32LE(compressed.length, 20); // Compressed size
    cd.writeUInt32LE(uncompressed.length, 24); // Uncompressed size
    cd.writeUInt16LE(nameBuf.length, 28); // Filename length
    cd.writeUInt16LE(0, 30); // Extra field length
    cd.writeUInt16LE(0, 32); // File comment length
    cd.writeUInt16LE(0, 34); // Disk number where file starts
    cd.writeUInt16LE(0, 36); // Internal file attributes
    cd.writeUInt32LE(0, 38); // External file attributes
    cd.writeUInt32LE(offset, 42); // Relative offset of local file header
    nameBuf.copy(cd, 46);

    cdHeaders.push(cd);
    offset += local.length + compressed.length;
  }

  const cdBuf = Buffer.concat(cdHeaders);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // End of central directory signature
  eocd.writeUInt16LE(0, 4); // Number of this disk
  eocd.writeUInt16LE(0, 6); // Disk where central directory starts
  eocd.writeUInt16LE(files.length, 8); // Total number of entries in central directory on this disk
  eocd.writeUInt16LE(files.length, 10); // Total number of entries in central directory
  eocd.writeUInt32LE(cdBuf.length, 12); // Size of central directory
  eocd.writeUInt32LE(offset, 16); // Offset of start of central directory
  eocd.writeUInt16LE(0, 20); // ZIP file comment length

  return Buffer.concat([...localHeaders, cdBuf, eocd]);
}

