(function (root) {
  "use strict";

  const FREESECT = 0xffffffff;
  const ENDOFCHAIN = 0xfffffffe;
  const FATSECT = 0xfffffffd;
  const DIFSECT = 0xfffffffc;
  const MAX_CHAIN = 200000;

  function asBytes(input) {
    if (input instanceof Uint8Array) return input;
    if (input instanceof ArrayBuffer) return new Uint8Array(input);
    if (ArrayBuffer.isView(input)) {
      return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
    }
    throw new Error("Dosya verisi okunamadı.");
  }

  function dataView(bytes) {
    return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  function u16(view, offset) {
    return view.getUint16(offset, true);
  }

  function u32(view, offset) {
    return view.getUint32(offset, true);
  }

  function i32(value) {
    return value > 0x7fffffff ? value - 0x100000000 : value;
  }

  function decodeUtf16(bytes) {
    if (!bytes || !bytes.length) return "";
    try {
      return new TextDecoder("utf-16le").decode(bytes).replace(/\u0000+$/g, "");
    } catch (_) {
      let out = "";
      for (let i = 0; i + 1 < bytes.length; i += 2) {
        out += String.fromCharCode(bytes[i] | (bytes[i + 1] << 8));
      }
      return out.replace(/\u0000+$/g, "");
    }
  }

  function decodeLatin1(bytes) {
    if (!bytes || !bytes.length) return "";
    try {
      return new TextDecoder("windows-1252").decode(bytes);
    } catch (_) {
      let out = "";
      for (let i = 0; i < bytes.length; i += 1) out += String.fromCharCode(bytes[i]);
      return out;
    }
  }

  function parseOleWorkbook(input) {
    const bytes = asBytes(input);
    if (bytes.length < 512) throw new Error("XLS dosyası eksik veya bozuk.");
    const signature = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
    for (let i = 0; i < signature.length; i += 1) {
      if (bytes[i] !== signature[i]) {
        throw new Error("Bu dosya eski Excel BIFF8 (.xls) biçiminde değil.");
      }
    }

    const view = dataView(bytes);
    const sectorSize = 1 << u16(view, 30);
    const miniSectorSize = 1 << u16(view, 32);
    const fatSectorCount = u32(view, 44);
    const firstDirectorySector = u32(view, 48);
    const miniStreamCutoff = u32(view, 56);
    const firstMiniFatSector = u32(view, 60);
    const miniFatSectorCount = u32(view, 64);
    const firstDifatSector = u32(view, 68);
    const difatSectorCount = u32(view, 72);

    if (sectorSize !== 512 && sectorSize !== 4096) {
      throw new Error("XLS sektör yapısı desteklenmiyor.");
    }

    function sector(id) {
      const start = 512 + id * sectorSize;
      const end = start + sectorSize;
      if (id >= FREESECT || start < 512 || end > bytes.length) {
        throw new Error("XLS sektör zinciri bozuk.");
      }
      return bytes.subarray(start, end);
    }

    const difat = [];
    for (let i = 0; i < 109; i += 1) {
      const id = u32(view, 76 + i * 4);
      if (id !== FREESECT && id !== ENDOFCHAIN) difat.push(id);
    }

    let difatId = firstDifatSector;
    const difatEntriesPerSector = sectorSize / 4 - 1;
    for (let n = 0; n < difatSectorCount && difatId < FREESECT; n += 1) {
      const part = sector(difatId);
      const partView = dataView(part);
      for (let i = 0; i < difatEntriesPerSector; i += 1) {
        const id = u32(partView, i * 4);
        if (id !== FREESECT && id !== ENDOFCHAIN) difat.push(id);
      }
      difatId = u32(partView, sectorSize - 4);
    }

    if (fatSectorCount && difat.length < fatSectorCount) {
      throw new Error("XLS FAT tablosu eksik.");
    }

    const fat = [];
    difat.slice(0, fatSectorCount || difat.length).forEach(function (fatId) {
      const part = sector(fatId);
      const partView = dataView(part);
      for (let i = 0; i < sectorSize / 4; i += 1) fat.push(u32(partView, i * 4));
    });

    function regularChain(startId, expectedSize) {
      if (startId === ENDOFCHAIN || startId === FREESECT) return new Uint8Array(0);
      const chunks = [];
      let id = startId;
      const seen = new Set();
      let guard = 0;
      while (id !== ENDOFCHAIN && id !== FREESECT) {
        if (id === FATSECT || id === DIFSECT || id >= fat.length || seen.has(id)) {
          throw new Error("XLS dosya zinciri geçersiz.");
        }
        seen.add(id);
        chunks.push(sector(id));
        id = fat[id];
        guard += 1;
        if (guard > MAX_CHAIN) throw new Error("XLS dosya zinciri çok uzun.");
        if (expectedSize && chunks.length * sectorSize >= expectedSize) break;
      }
      const total = chunks.length * sectorSize;
      const out = new Uint8Array(total);
      chunks.forEach(function (chunk, index) {
        out.set(chunk, index * sectorSize);
      });
      return expectedSize ? out.subarray(0, Math.min(expectedSize, out.length)) : out;
    }

    const directoryBytes = regularChain(firstDirectorySector);
    const entries = [];
    for (let offset = 0; offset + 128 <= directoryBytes.length; offset += 128) {
      const entry = directoryBytes.subarray(offset, offset + 128);
      const entryView = dataView(entry);
      const nameLength = u16(entryView, 64);
      if (nameLength < 2 || nameLength > 64) continue;
      const name = decodeUtf16(entry.subarray(0, nameLength - 2));
      const type = entry[66];
      const startSector = u32(entryView, 116);
      const sizeLow = u32(entryView, 120);
      const sizeHigh = u32(entryView, 124);
      const size = sizeLow + sizeHigh * 0x100000000;
      entries.push({ name: name, type: type, startSector: startSector, size: size });
    }

    const rootEntry = entries.find(function (entry) { return entry.type === 5; });
    const workbookEntry = entries.find(function (entry) {
      return entry.type === 2 && /^(workbook|book)$/i.test(entry.name);
    });
    if (!workbookEntry) throw new Error("XLS içinde Workbook bölümü bulunamadı.");

    if (workbookEntry.size >= miniStreamCutoff || !rootEntry) {
      return regularChain(workbookEntry.startSector, workbookEntry.size);
    }

    const miniFatBytes = regularChain(firstMiniFatSector, miniFatSectorCount * sectorSize);
    const miniFatView = dataView(miniFatBytes);
    const miniFat = [];
    for (let i = 0; i + 4 <= miniFatBytes.length; i += 4) miniFat.push(u32(miniFatView, i));
    const rootStream = regularChain(rootEntry.startSector, rootEntry.size);
    const chunks = [];
    let miniId = workbookEntry.startSector;
    const seen = new Set();
    let guard = 0;
    while (miniId !== ENDOFCHAIN && miniId !== FREESECT) {
      if (miniId >= miniFat.length || seen.has(miniId)) throw new Error("XLS mini sektör zinciri bozuk.");
      seen.add(miniId);
      const start = miniId * miniSectorSize;
      const end = start + miniSectorSize;
      if (end > rootStream.length) throw new Error("XLS mini akışı eksik.");
      chunks.push(rootStream.subarray(start, end));
      miniId = miniFat[miniId];
      guard += 1;
      if (guard > MAX_CHAIN) throw new Error("XLS mini zinciri çok uzun.");
      if (chunks.length * miniSectorSize >= workbookEntry.size) break;
    }
    const out = new Uint8Array(chunks.length * miniSectorSize);
    chunks.forEach(function (chunk, index) { out.set(chunk, index * miniSectorSize); });
    return out.subarray(0, workbookEntry.size);
  }

  function recordList(workbook) {
    const view = dataView(workbook);
    const records = [];
    let offset = 0;
    while (offset + 4 <= workbook.length) {
      const id = u16(view, offset);
      const length = u16(view, offset + 2);
      const dataStart = offset + 4;
      const dataEnd = dataStart + length;
      if (dataEnd > workbook.length) break;
      records.push({ id: id, offset: offset, data: workbook.subarray(dataStart, dataEnd) });
      offset = dataEnd;
    }
    return records;
  }

  function parseBoundSheet(data) {
    if (data.length < 8) return null;
    const view = dataView(data);
    const offset = u32(view, 0);
    const nameLength = data[6];
    const flags = data[7];
    const wide = (flags & 1) === 1;
    const nameBytes = data.subarray(8, 8 + nameLength * (wide ? 2 : 1));
    const name = wide ? decodeUtf16(nameBytes) : decodeLatin1(nameBytes);
    return { offset: offset, name: name || "Sayfa" };
  }

  function parseUnicodeString(data, start) {
    let offset = start || 0;
    if (offset + 3 > data.length) return { value: "", next: data.length };
    const view = dataView(data);
    const length = u16(view, offset);
    offset += 2;
    const flags = data[offset++];
    const wide = (flags & 1) === 1;
    const rich = (flags & 8) === 8;
    const extended = (flags & 4) === 4;
    let runs = 0;
    let extensionLength = 0;
    if (rich && offset + 2 <= data.length) {
      runs = u16(view, offset);
      offset += 2;
    }
    if (extended && offset + 4 <= data.length) {
      extensionLength = u32(view, offset);
      offset += 4;
    }
    const byteLength = length * (wide ? 2 : 1);
    const textBytes = data.subarray(offset, Math.min(data.length, offset + byteLength));
    const value = wide ? decodeUtf16(textBytes) : decodeLatin1(textBytes);
    offset += byteLength + runs * 4 + extensionLength;
    return { value: value, next: offset };
  }

  function parseSst(records, startIndex) {
    const chunks = [];
    let index = startIndex;
    chunks.push(records[index].data);
    while (index + 1 < records.length && records[index + 1].id === 0x003c) {
      index += 1;
      chunks.push(records[index].data);
    }
    const length = chunks.reduce(function (sum, chunk) { return sum + chunk.length; }, 0);
    const merged = new Uint8Array(length);
    let cursor = 0;
    chunks.forEach(function (chunk) { merged.set(chunk, cursor); cursor += chunk.length; });
    if (merged.length < 8) return { strings: [], lastIndex: index };
    const mergedView = dataView(merged);
    const uniqueCount = u32(mergedView, 4);
    const strings = [];
    let offset = 8;
    for (let i = 0; i < uniqueCount && offset < merged.length; i += 1) {
      const parsed = parseUnicodeString(merged, offset);
      strings.push(parsed.value);
      if (parsed.next <= offset) break;
      offset = parsed.next;
    }
    return { strings: strings, lastIndex: index };
  }

  function decodeRk(raw) {
    const multiplied = (raw & 1) === 1;
    const integer = (raw & 2) === 2;
    let value;
    if (integer) {
      value = i32(raw) >> 2;
    } else {
      const buffer = new ArrayBuffer(8);
      const view = new DataView(buffer);
      view.setUint32(0, 0, true);
      view.setUint32(4, raw & 0xfffffffc, true);
      value = view.getFloat64(0, true);
    }
    return multiplied ? value / 100 : value;
  }

  function setCell(rows, row, column, value) {
    if (!rows.has(row)) rows.set(row, new Map());
    rows.get(row).set(column, value);
  }

  function parseSheet(workbook, start, end, sst) {
    const rows = new Map();
    const view = dataView(workbook);
    let offset = start;
    while (offset + 4 <= end && offset + 4 <= workbook.length) {
      const id = u16(view, offset);
      const length = u16(view, offset + 2);
      const dataStart = offset + 4;
      const dataEnd = dataStart + length;
      if (dataEnd > workbook.length || dataEnd > end) break;
      const data = workbook.subarray(dataStart, dataEnd);
      const cellView = dataView(data);

      if (id === 0x00fd && data.length >= 10) {
        const row = u16(cellView, 0);
        const column = u16(cellView, 2);
        const stringIndex = u32(cellView, 6);
        setCell(rows, row, column, sst[stringIndex] == null ? "" : sst[stringIndex]);
      } else if (id === 0x0203 && data.length >= 14) {
        setCell(rows, u16(cellView, 0), u16(cellView, 2), cellView.getFloat64(6, true));
      } else if (id === 0x027e && data.length >= 10) {
        setCell(rows, u16(cellView, 0), u16(cellView, 2), decodeRk(u32(cellView, 6)));
      } else if (id === 0x00bd && data.length >= 12) {
        const row = u16(cellView, 0);
        const firstColumn = u16(cellView, 2);
        const lastColumn = u16(cellView, data.length - 2);
        let itemOffset = 4;
        for (let column = firstColumn; column <= lastColumn && itemOffset + 6 <= data.length - 2; column += 1) {
          setCell(rows, row, column, decodeRk(u32(cellView, itemOffset + 2)));
          itemOffset += 6;
        }
      } else if ((id === 0x0204 || id === 0x00d6) && data.length >= 9) {
        const parsed = parseUnicodeString(data, 6);
        setCell(rows, u16(cellView, 0), u16(cellView, 2), parsed.value);
      } else if (id === 0x0006 && data.length >= 14) {
        const special = data[12] === 0xff && data[13] === 0xff;
        if (!special) setCell(rows, u16(cellView, 0), u16(cellView, 2), cellView.getFloat64(6, true));
      } else if (id === 0x0205 && data.length >= 8) {
        setCell(rows, u16(cellView, 0), u16(cellView, 2), data[6] === 1 ? Boolean(data[7]) : "");
      }
      offset = dataEnd;
    }
    return rows;
  }

  function canonicalHeader(value) {
    return String(value == null ? "" : value)
      .trim()
      .toLocaleLowerCase("tr-TR")
      .replace(/ı/g, "i")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9]+/g, "");
  }

  const HEADER_ALIASES = Object.freeze({
    index: "index",
    sira: "index",
    sirano: "index",
    agacid: "agacId",
    agacadi: "agacAdi",
    agacturu: "agacAdi",
    odunid: "odunId",
    odunadi: "odunAdi",
    odunturu: "odunAdi",
    urun: "odunAdi",
    urunturu: "odunAdi",
    kalitesinifi: "kaliteSinifi",
    boysinifi: "boySinifi",
    adet: "adet",
    miktar: "adet",
    cap: "cap",
    boy: "boy",
    uzunluk: "boy",
    hacim: "hacim",
    uretimtarihi: "uretimTarihi",
    tarih: "uretimTarihi",
    barkodno: "barkodNo",
    barkod: "barkodNo"
  });

  function rowsToTable(rows) {
    const rowNumbers = Array.from(rows.keys()).sort(function (a, b) { return a - b; });
    let headerRow = null;
    let columns = null;
    for (let index = 0; index < Math.min(rowNumbers.length, 30); index += 1) {
      const rowNumber = rowNumbers[index];
      const cells = rows.get(rowNumber);
      const found = {};
      cells.forEach(function (value, column) {
        const alias = HEADER_ALIASES[canonicalHeader(value)];
        if (alias) found[alias] = column;
      });
      const count = Object.keys(found).length;
      if (count >= 6 && found.barkodNo != null && found.cap != null && found.boy != null) {
        headerRow = rowNumber;
        columns = found;
        break;
      }
    }
    if (headerRow == null || !columns) return null;

    const output = [];
    rowNumbers.forEach(function (rowNumber) {
      if (rowNumber <= headerRow) return;
      const cells = rows.get(rowNumber);
      const item = {};
      Object.keys(columns).forEach(function (key) {
        item[key] = cells.has(columns[key]) ? cells.get(columns[key]) : "";
      });
      const hasData = Object.keys(item).some(function (key) {
        return String(item[key] == null ? "" : item[key]).trim() !== "";
      });
      if (hasData) output.push({ rowNumber: rowNumber + 1, values: item });
    });
    return { headerRow: headerRow + 1, columns: columns, rows: output };
  }

  function parseWorkbook(input) {
    const workbook = parseOleWorkbook(input);
    const records = recordList(workbook);
    const sheets = [];
    let sst = [];
    for (let i = 0; i < records.length; i += 1) {
      if (records[i].id === 0x0085) {
        const sheet = parseBoundSheet(records[i].data);
        if (sheet) sheets.push(sheet);
      } else if (records[i].id === 0x00fc) {
        const parsed = parseSst(records, i);
        sst = parsed.strings;
        i = parsed.lastIndex;
      }
    }
    if (!sheets.length) throw new Error("XLS içinde çalışma sayfası bulunamadı.");
    sheets.sort(function (a, b) { return a.offset - b.offset; });

    const parsedSheets = sheets.map(function (sheet, index) {
      const end = index + 1 < sheets.length ? sheets[index + 1].offset : workbook.length;
      const rows = parseSheet(workbook, sheet.offset, end, sst);
      return { name: sheet.name, table: rowsToTable(rows) };
    });

    let selected = parsedSheets.find(function (sheet) {
      return sheet.table && /^mesaha$/i.test(String(sheet.name || "").trim());
    });
    if (!selected) {
      selected = parsedSheets.find(function (sheet) {
        return sheet.table && !/örnek|ornek|sample/i.test(sheet.name || "");
      });
    }
    if (!selected) selected = parsedSheets.find(function (sheet) { return Boolean(sheet.table); });
    if (!selected || !selected.table) {
      throw new Error("Mesaha sütunları bulunamadı. agacAdi, odunAdi, adet, cap, boy, uretimTarihi ve barkodNo başlıklarını kontrol edin.");
    }
    return { sheetName: selected.name, table: selected.table, sheets: parsedSheets.map(function (sheet) { return sheet.name; }) };
  }

  function clean(value) {
    return String(value == null ? "" : value).trim();
  }

  function numberValue(value, fallback) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const normalized = clean(value).replace(/\s/g, "").replace(/,/g, ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function normalizeProduct(value) {
    const text = clean(value).toLocaleLowerCase("tr-TR");
    const ascii = text.replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c");
    if (ascii.indexOf("maden") >= 0) return "Maden Direk";
    if (ascii.indexOf("kagit") >= 0) return "Kağıtlık";
    if (ascii.indexOf("sanayi") >= 0) return "Sanayi Odunu";
    if (ascii.indexOf("tel") >= 0) return "Tel Direk";
    return "Tomruk";
  }

  function excelSerialToIso(serial) {
    if (!Number.isFinite(serial)) return "";
    const milliseconds = Math.round((serial - 25569) * 86400000);
    const date = new Date(milliseconds);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  }

  function normalizeDate(value) {
    if (typeof value === "number") return excelSerialToIso(value);
    const text = clean(value);
    let match = text.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/);
    if (match) return match[3] + "-" + match[2].padStart(2, "0") + "-" + match[1].padStart(2, "0");
    match = text.match(/^(\d{4})[.\/-](\d{1,2})[.\/-](\d{1,2})$/);
    if (match) return match[1] + "-" + match[2].padStart(2, "0") + "-" + match[3].padStart(2, "0");
    const date = new Date(text);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
  }

  function inferBolme(fileName) {
    const name = clean(fileName).replace(/\.[^.]+$/, "");
    let match = name.match(/^Mesaha_([^_]+)_\d{8}_\d{3,6}$/i);
    if (!match) match = name.match(/^Mesaha_([^_]+)/i);
    if (!match) return "";
    const value = clean(match[1]);
    return /^\d+[A-Za-zÇĞİÖŞÜçğıöşü-]*$/.test(value) ? value : "";
  }

  function safeFilePart(value) {
    return clean(value)
      .replace(/ı/g, "i").replace(/İ/g, "I").replace(/ğ/gi, "g").replace(/ü/gi, "u")
      .replace(/ş/gi, "s").replace(/ö/gi, "o").replace(/ç/gi, "c")
      .replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 48);
  }

  function timeStamp(date) {
    const d = date || new Date();
    const pad = function (value) { return String(value).padStart(2, "0"); };
    return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "_" + pad(d.getHours()) + pad(d.getMinutes());
  }

  function makeId(index) {
    return "xls_" + Date.now().toString(36) + "_" + index.toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  function convert(input, options) {
    const settings = options && options.settings && typeof options.settings === "object" ? options.settings : {};
    const fileName = options && options.fileName ? String(options.fileName) : "Mesaha.xls";
    const version = options && options.version ? String(options.version) : "local";
    const parsed = parseWorkbook(input);
    const bolmeNo = inferBolme(fileName) || clean(settings.bolmeNo);
    const seflik = clean(settings.seflik);
    const now = new Date().toISOString();
    const records = [];
    const seenBarcodes = new Set();
    let invalidRows = 0;
    let duplicateRows = 0;

    parsed.table.rows.forEach(function (entry, index) {
      const row = entry.values || {};
      const barcode = clean(row.barkodNo).toUpperCase();
      const treeType = clean(row.agacAdi);
      const productType = normalizeProduct(row.odunAdi);
      const diameterNumber = numberValue(row.cap, NaN);
      const lengthNumber = numberValue(row.boy, NaN);
      const quantityNumber = Math.max(1, Math.round(numberValue(row.adet, 1) || 1));
      const productionDate = normalizeDate(row.uretimTarihi) || clean(settings.mesahaDate) || now.slice(0, 10);
      if (!barcode || !treeType || !Number.isFinite(diameterNumber) || diameterNumber <= 0 || !Number.isFinite(lengthNumber) || lengthNumber <= 0) {
        invalidRows += 1;
        return;
      }
      if (seenBarcodes.has(barcode)) {
        duplicateRows += 1;
        return;
      }
      seenBarcodes.add(barcode);
      records.push({
        id: makeId(index + 1),
        barcode: barcode,
        diameter: String(diameterNumber),
        length: String(lengthNumber),
        quantity: quantityNumber,
        productType: productType,
        treeType: treeType,
        cutter: "",
        productionDate: productionDate,
        bolmeNo: bolmeNo,
        seflik: seflik,
        createdAt: now,
        updatedAt: "",
        xlsSource: {
          row: entry.rowNumber,
          agacId: row.agacId == null ? "" : row.agacId,
          odunId: row.odunId == null ? "" : row.odunId,
          kaliteSinifi: row.kaliteSinifi == null ? "" : row.kaliteSinifi,
          boySinifi: row.boySinifi == null ? "" : row.boySinifi,
          hacim: row.hacim == null ? "" : row.hacim
        }
      });
    });

    if (!records.length) throw new Error("Dönüştürülebilen geçerli Mesaha kaydı bulunamadı.");

    const outputSettings = Object.assign({}, settings);
    if (bolmeNo) outputSettings.bolmeNo = bolmeNo;
    if (records[0].productionDate) outputSettings.mesahaDate = records[0].productionDate;
    if (records[0].treeType) outputSettings.currentTree = records[0].treeType;
    if (records[0].productType) outputSettings.currentProduct = records[0].productType;
    outputSettings.diameter = "";
    outputSettings.barcode = "";
    outputSettings.quantity = "1";

    const backup = {
      version: version,
      exportedAt: now,
      source: {
        type: "mesaha-xls-converter",
        fileName: fileName,
        sheetName: parsed.sheetName,
        convertedAt: now,
        recordCount: records.length,
        invalidRows: invalidRows,
        duplicateRows: duplicateRows
      },
      records: records,
      settings: outputSettings
    };

    const filePart = bolmeNo ? "_" + safeFilePart(bolmeNo) : "";
    return {
      backup: backup,
      records: records,
      sheetName: parsed.sheetName,
      bolmeNo: bolmeNo,
      seflik: seflik,
      invalidRows: invalidRows,
      duplicateRows: duplicateRows,
      fileName: "mesaha_yedek_xls" + filePart + "_" + timeStamp(new Date()) + ".json"
    };
  }

  function downloadJson(result) {
    const blob = new Blob([JSON.stringify(result.backup, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = result.fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  function escapeHtml(value) {
    return clean(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function modalParts() {
    return {
      modal: document.getElementById("modernModal"),
      title: document.getElementById("modalTitle"),
      body: document.getElementById("modalBody"),
      actions: document.getElementById("modalActions"),
      closeButton: document.getElementById("modalCloseBtn")
    };
  }

  function closeConverterModal() {
    const parts = modalParts();
    if (!parts.modal) return;
    parts.modal.classList.add("hidden");
    parts.modal.classList.remove("mesaha-xls-converter-v590", "mesaha-xls-result-v590");
    const input = document.getElementById("xlsToBackupInputV590");
    if (input) input.value = "";
  }

  function showResult(result, originalName) {
    const parts = modalParts();
    if (!parts.modal || !parts.title || !parts.body || !parts.actions) {
      if (typeof root.toast === "function") root.toast(result.records.length + " kayıt yedeğe dönüştürüldü.");
      return;
    }
    parts.title.textContent = "Yedek dosyası hazır";
    parts.body.innerHTML =
      '<div class="xls-convert-result-v590">' +
        '<div><small>Kaynak dosya</small><b>' + escapeHtml(originalName) + '</b></div>' +
        '<div><small>Okunan sayfa</small><b>' + escapeHtml(result.sheetName) + '</b></div>' +
        '<div><small>Dönüştürülen kayıt</small><b>' + result.records.length + '</b></div>' +
        '<div><small>Bölme</small><b>' + escapeHtml(result.bolmeNo || "Dosyada bulunamadı") + '</b></div>' +
        (result.duplicateRows ? '<p class="warn">' + result.duplicateRows + ' yinelenen barkod atlandı.</p>' : '') +
        (result.invalidRows ? '<p class="warn">' + result.invalidRows + ' eksik veya geçersiz satır atlandı.</p>' : '') +
        '<p class="success">JSON yedek dosyası indirildi. Bu dosyayı Beyan ekranındaki <b>Yedek Yükle</b> butonuyla açabilirsiniz. Uygulamadaki mevcut kayıtlar değiştirilmedi.</p>' +
      '</div>';
    parts.actions.innerHTML = '<button class="btn green" id="xlsConvertCloseV590" type="button">Tamam</button>';
    parts.modal.classList.remove("hidden", "mesaha-xls-converter-v590");
    parts.modal.classList.add("mesaha-xls-result-v590");
    const button = document.getElementById("xlsConvertCloseV590");
    if (button) button.addEventListener("click", closeConverterModal, { once: true });
  }

  function selectedFileName(file) {
    return file && file.name ? String(file.name) : "Henüz dosya seçilmedi";
  }

  function openConverterModal() {
    const parts = modalParts();
    if (!parts.modal || !parts.title || !parts.body || !parts.actions) {
      const inputFallback = document.getElementById("xlsToBackupInputV590");
      if (inputFallback) inputFallback.click();
      return;
    }
    parts.title.textContent = "Mesaha Dosyasını Yedek Dosyasına Dönüştür";
    parts.body.innerHTML =
      '<div class="xls-converter-info-v590">' +
        '<div class="xls-converter-hero-v590"><span class="xls-converter-icon-v590" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24"><path d="M6 3.5h8l4 4v13H6z"/><path d="M14 3.5v4h4M8.5 12h7M8.5 15.5h5"/></svg>' +
        '</span><div><b>Mesaha Excel dosyasını uygulama yedeğine çevirir</b><p>Mesaha Dosyasını İndir ile oluşturulan eski Excel <code>.xls</code> dosyasını seçin. Sistem kayıtları okuyup Mesaha İO’nun Yedek Yükle bölümünde kullanılabilen <code>.json</code> yedek dosyasını hazırlar.</p></div></div>' +
        '<ul class="xls-converter-list-v590">' +
          '<li>Dönüştürme tamamen cihazınızda yapılır; dosya sunucuya gönderilmez.</li>' +
          '<li>Mevcut Mesaha kayıtlarınız silinmez veya değiştirilmez.</li>' +
          '<li>Eksik satırlar ve yinelenen barkodlar güvenli şekilde atlanır.</li>' +
          '<li>Oluşan JSON dosyasını daha sonra <b>Yedek Yükle</b> ile içeri aktarabilirsiniz.</li>' +
        '</ul>' +
        '<label class="xls-file-picker-v590" for="xlsToBackupInputV590">' +
          '<span class="xls-file-picker-icon-v590"><svg viewBox="0 0 24 24"><path d="M12 16V4M7.5 8.5 12 4l4.5 4.5M5 14v5.5h14V14"/></svg></span>' +
          '<span><b>Mesaha dosyasını seç</b><small id="xlsSelectedFileV590">Henüz dosya seçilmedi</small></span>' +
        '</label>' +
        '<div class="xls-converter-status-v590" id="xlsConverterStatusV590" hidden></div>' +
      '</div>';
    parts.actions.innerHTML =
      '<button class="btn soft" id="xlsConvertCancelV590" type="button">Vazgeç</button>' +
      '<button class="btn green" id="xlsConvertStartV590" type="button" disabled>Yedek Dosyasına Dönüştür</button>';
    parts.modal.classList.remove("hidden", "mesaha-xls-result-v590");
    parts.modal.classList.add("mesaha-xls-converter-v590");

    const input = document.getElementById("xlsToBackupInputV590");
    const fileLabel = document.getElementById("xlsSelectedFileV590");
    const startButton = document.getElementById("xlsConvertStartV590");
    const cancelButton = document.getElementById("xlsConvertCancelV590");
    const status = document.getElementById("xlsConverterStatusV590");
    if (input) input.value = "";
    if (fileLabel) fileLabel.textContent = "Henüz dosya seçilmedi";
    if (startButton) startButton.disabled = true;
    if (status) { status.hidden = true; status.textContent = ""; status.className = "xls-converter-status-v590"; }

    const refreshSelection = function () {
      const file = input && input.files ? input.files[0] : null;
      if (fileLabel) fileLabel.textContent = selectedFileName(file);
      if (startButton) startButton.disabled = !file;
    };
    if (input) input.onchange = refreshSelection;
    if (cancelButton) cancelButton.onclick = closeConverterModal;
    if (startButton) startButton.onclick = async function () {
      const file = input && input.files ? input.files[0] : null;
      if (!file) {
        refreshSelection();
        return;
      }
      startButton.disabled = true;
      startButton.textContent = "Dönüştürülüyor…";
      if (cancelButton) cancelButton.disabled = true;
      if (status) {
        status.hidden = false;
        status.className = "xls-converter-status-v590 is-working";
        status.textContent = "Dosya okunuyor ve yedek hazırlanıyor. Lütfen bekleyin.";
      }
      try {
        const buffer = await file.arrayBuffer();
        const stateSettings = root.state && root.state.settings ? root.state.settings : {};
        const version = root.MESAHA_VERSION && root.MESAHA_VERSION.version ? root.MESAHA_VERSION.version : "local";
        const result = convert(buffer, { fileName: file.name, settings: stateSettings, version: version });
        downloadJson(result);
        showResult(result, file.name);
        if (typeof root.toast === "function") root.toast(result.records.length + " kayıt yedeğe dönüştürüldü.");
      } catch (error) {
        if (root.MesahaErrorLog && typeof root.MesahaErrorLog.error === "function") {
          try { root.MesahaErrorLog.error("backup.xls.convert", error); } catch (_) {}
        }
        if (status) {
          status.hidden = false;
          status.className = "xls-converter-status-v590 is-error";
          status.textContent = error && error.message ? error.message : "Mesaha dosyası dönüştürülemedi.";
        }
        startButton.disabled = false;
        startButton.textContent = "Yedek Dosyasına Dönüştür";
        if (cancelButton) cancelButton.disabled = false;
      }
    };
  }

  function ensureStyle() {
    if (document.getElementById("mesaha-xls-converter-v590-style")) return;
    const style = document.createElement("style");
    style.id = "mesaha-xls-converter-v590-style";
    style.textContent =
      '#beyanView .records-action-grid-v530{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important}' +
      '#beyanView .records-action-grid-v530>#downloadXlsBtn{grid-column:1/-1!important;order:1!important}' +
      '#beyanView .records-action-grid-v530>#seflikSendFromRecordsV529{order:2!important}' +
      '#beyanView .records-action-grid-v530>#printBtn{order:3!important}' +
      '#beyanView .records-action-grid-v530>#restoreBtn{order:4!important}' +
      '#beyanView .records-action-grid-v530>#backupBtn{order:5!important}' +
      '#beyanView .records-action-grid-v530>#cloudBackupBtnV316{order:6!important}' +
      '#beyanView .records-action-grid-v530>#cloudRestoreBtnV316{order:7!important}' +
      '#beyanView .records-action-grid-v530>#xlsToBackupBtnV590{grid-column:1/-1!important;order:8!important;min-height:58px!important}' +
      '#xlsToBackupBtnV590{background:linear-gradient(135deg,#eef8f2 0%,#e5f3eb 100%)!important;border:1px solid #bcdccb!important;color:#174d38!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:10px!important;font-weight:900!important}' +
      '#xlsToBackupBtnV590 svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}' +
      '#modernModal.mesaha-xls-converter-v590 .modal-card,#modernModal.mesaha-xls-result-v590 .modal-card{max-width:min(94vw,680px)!important}' +
      '#modernModal.mesaha-xls-converter-v590 .modal-icon,#modernModal.mesaha-xls-result-v590 .modal-icon{display:none!important}' +
      '.xls-converter-info-v590{display:grid;gap:15px}' +
      '.xls-converter-hero-v590{display:flex;gap:13px;align-items:flex-start;padding:14px;border:1px solid #d8e9df;border-radius:18px;background:linear-gradient(180deg,#f8fcfa,#f1f8f4)}' +
      '.xls-converter-hero-v590 b{display:block;color:#143d2c;font-size:16px;margin-bottom:5px}' +
      '.xls-converter-hero-v590 p{margin:0;color:#5a7567;line-height:1.5}' +
      '.xls-converter-hero-v590 code{padding:2px 5px;border-radius:6px;background:#e3f0e8;color:#1f5b41}' +
      '.xls-converter-icon-v590{flex:0 0 46px;width:46px;height:46px;display:grid;place-items:center;border-radius:15px;background:#dff1e7;color:#176643}' +
      '.xls-converter-icon-v590 svg,.xls-file-picker-icon-v590 svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}' +
      '.xls-converter-list-v590{margin:0;padding:0;display:grid;gap:8px;list-style:none}' +
      '.xls-converter-list-v590 li{position:relative;padding:10px 12px 10px 38px;border-radius:14px;background:#f8fbf9;color:#486557;line-height:1.45}' +
      '.xls-converter-list-v590 li:before{content:"✓";position:absolute;left:13px;top:10px;width:18px;height:18px;display:grid;place-items:center;border-radius:50%;background:#daf0e3;color:#167044;font-weight:900;font-size:12px}' +
      '.xls-file-picker-v590{cursor:pointer;display:flex;align-items:center;gap:12px;padding:15px;border:1.5px dashed #8ebba3;border-radius:18px;background:#f4fbf7;transition:border-color .15s ease,background .15s ease,transform .15s ease}' +
      '.xls-file-picker-v590:active{transform:scale(.99)}.xls-file-picker-v590:hover{border-color:#258258;background:#edf8f2}' +
      '.xls-file-picker-icon-v590{width:44px;height:44px;display:grid;place-items:center;border-radius:14px;background:#dcefe4;color:#166742}' +
      '.xls-file-picker-v590 span:last-child{min-width:0;display:grid;gap:4px}.xls-file-picker-v590 b{color:#173e2d}.xls-file-picker-v590 small{color:#657d71;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:430px}' +
      '.xls-converter-status-v590{padding:11px 13px;border-radius:13px;line-height:1.45;font-weight:700}.xls-converter-status-v590.is-working{background:#eef6ff;color:#235c86}.xls-converter-status-v590.is-error{background:#fff0f0;color:#a52b2b}' +
      '.xls-convert-result-v590{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}' +
      '.xls-convert-result-v590>div{padding:12px;border:1px solid #dce9e2;border-radius:15px;background:#f8fcfa;display:flex;flex-direction:column;gap:4px}' +
      '.xls-convert-result-v590 small{color:#6b8177;font-weight:700}.xls-convert-result-v590 b{color:#173d2d;word-break:break-word}' +
      '.xls-convert-result-v590 p{grid-column:1/-1;margin:0;padding:11px 13px;border-radius:13px;line-height:1.45}.xls-convert-result-v590 .warn{background:#fff7df;color:#6f5311}.xls-convert-result-v590 .success{background:#eaf7ef;color:#24543f}' +
      '@media(max-width:520px){.xls-convert-result-v590{grid-template-columns:1fr}.xls-converter-hero-v590{align-items:center}.xls-converter-list-v590 li{padding-right:9px}.xls-file-picker-v590 small{max-width:245px}}';
    document.head.appendChild(style);
  }

  function arrangeButtons(grid) {
    if (!grid) return;
    const order = [
      ["downloadXlsBtn", "Mesaha Dosyasını İndir"],
      ["seflikSendFromRecordsV529", "Şefliğe Gönder"],
      ["printBtn", "Beyan İndir"],
      ["restoreBtn", "Yedek Yükle"],
      ["backupBtn", "Yedek Al"],
      ["cloudBackupBtnV316", "Drive’a Yükle"],
      ["cloudRestoreBtnV316", "Drive’dan Getir"],
      ["xlsToBackupBtnV590", ""]
    ];
    const nodes = [];
    order.forEach(function (item) {
      const node = document.getElementById(item[0]);
      if (!node) return;
      if (item[1] && clean(node.textContent) !== item[1]) node.textContent = item[1];
      nodes.push(node);
    });
    const current = Array.prototype.slice.call(grid.children).filter(function (node) {
      return nodes.indexOf(node) >= 0;
    });
    const sameOrder = current.length === nodes.length && current.every(function (node, index) {
      return node === nodes[index] && node.parentNode === grid;
    });
    if (!sameOrder) nodes.forEach(function (node) { grid.appendChild(node); });
  }

  function ensureUi() {
    const grid = document.querySelector("#beyanView .records-action-grid-v530, #beyanView .action-grid, .records-action-grid-v530");
    if (!grid) return false;
    ensureStyle();

    const oldButton = document.getElementById("xlsToBackupBtnV580");
    if (oldButton) oldButton.remove();
    const oldInput = document.getElementById("xlsToBackupInputV580");
    if (oldInput) oldInput.remove();

    let input = document.getElementById("xlsToBackupInputV590");
    if (!input) {
      input = document.createElement("input");
      input.id = "xlsToBackupInputV590";
      input.type = "file";
      input.accept = ".xls,application/vnd.ms-excel";
      input.hidden = true;
      document.body.appendChild(input);
    }

    let button = document.getElementById("xlsToBackupBtnV590");
    if (!button) {
      button = document.createElement("button");
      button.id = "xlsToBackupBtnV590";
      button.type = "button";
      button.className = "btn soft";
      button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3.5h9l5 5v12H5z"/><path d="M14 3.5v5h5M8 12h8M8 16h5"/></svg><span>Mesaha Dosyasını Yedek Dosyasına Dönüştür</span>';
      grid.appendChild(button);
    }
    if (!button.__xlsConverterBoundV590) {
      button.__xlsConverterBoundV590 = true;
      button.addEventListener("click", openConverterModal);
    }

    arrangeButtons(grid);

    const parts = modalParts();
    if (parts.closeButton && !parts.closeButton.__xlsConverterBoundV590) {
      parts.closeButton.__xlsConverterBoundV590 = true;
      parts.closeButton.addEventListener("click", function () {
        if (parts.modal && (parts.modal.classList.contains("mesaha-xls-converter-v590") || parts.modal.classList.contains("mesaha-xls-result-v590"))) {
          closeConverterModal();
        }
      });
    }
    return true;
  }

  function bootUi() {
    if (typeof document === "undefined") return;
    ensureUi();
    [120, 420, 900].forEach(function (delay) { setTimeout(ensureUi, delay); });
    root.addEventListener("mesaha:view-changed", function (event) {
      if (event && event.detail && event.detail.view === "beyan") setTimeout(ensureUi, 40);
    }, { passive: true });
  }

  const api = Object.freeze({
    parseWorkbook: parseWorkbook,
    convert: convert,
    inferBolme: inferBolme,
    normalizeDate: normalizeDate
  });
  root.MesahaXlsBackupConverter = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootUi, { once: true });
    else bootUi();
  }
})(typeof window !== "undefined" ? window : globalThis);
