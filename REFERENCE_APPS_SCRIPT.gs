/**
 * SISTEM INVENTARIS LAB SMAN 2 PASURUAN
 * Versi Terintegrasi: Validasi Stok & Identitas Peminjam
 * 
 * Gunakan script ini sebagai pengganti script Anda di Google Apps Script editor.
 * Jangan lupa untuk melakukan "Deploy" -> "New Deployment" (Web App) setelah update.
 */

const DB_SHEETS = {
  USERS: "users",
  ITEMS: "master_items",
  TRANS: "transactions",
  SETTINGS: "settings"
};

/**
 * 1. SETUP & INISIALISASI
 * Jalankan fungsi ini (setupLabInventory) untuk memastikan kolom person_name tersedia.
 */
function setupLabInventory() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const config = [
    {
      name: DB_SHEETS.USERS,
      headers: ["id", "username", "password", "role", "status"],
      initial: [[1, "admin", "admin123", "admin", "active"]]
    },
    {
      name: DB_SHEETS.ITEMS,
      headers: ["item_code", "name", "category", "total_stock", "current_stock", "unit", "location", "min_stock", "image_url"],
      initial: []
    },
    {
      name: DB_SHEETS.TRANS,
      headers: ["transaction_id", "timestamp", "item_code", "user_id", "type", "quantity", "person_name"],
      initial: []
    },
    {
      name: DB_SHEETS.SETTINGS,
      headers: ["logo_url", "bg_url"],
      initial: [["", ""]]
    }
  ];

  config.forEach(sheetConf => {
    let sheet = ss.getSheetByName(sheetConf.name);
    if (!sheet) sheet = ss.insertSheet(sheetConf.name);
    
    // Update Header (Pastikan kolom person_name ada di sheet transactions)
    sheet.getRange(1, 1, 1, sheetConf.headers.length)
         .setValues([sheetConf.headers])
         .setFontWeight("bold")
         .setBackground("#f3f3f3");
    sheet.setFrozenRows(1);

    // Initial Data
    if (sheetConf.initial.length > 0 && sheet.getLastRow() <= 1) {
      sheet.getRange(2, 1, sheetConf.initial.length, sheetConf.initial[0].length).setValues(sheetConf.initial);
    }
    
    // Auto Resize
    for (let i = 1; i <= sheetConf.headers.length; i++) sheet.autoResizeColumn(i);
  });

  SpreadsheetApp.getUi().alert("🔧 Setup Selesai! Basis data telah diperbarui dengan kolom identitas person_name.");
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🚀 Inventaris Lab')
      .addItem('Setup / Update Database', 'setupLabInventory')
      .addToUi();
}

/**
 * 2. API WEB APP (GATEWAY)
 */
function doGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  try {
    if (action === 'getItems') {
      const rows = ss.getSheetByName(DB_SHEETS.ITEMS).getDataRange().getValues().slice(1);
      return createJsonResponse(rows.map(r => ({
        item_code: r[0], name: r[1], category: r[2], 
        total_stock: Number(r[3]), current_stock: Number(r[4]), unit: r[5],
        location: r[6], min_stock: r[7], image_url: r[8] || ""
      })));
    }
    
    if (action === 'getHistory') {
      const transRows = ss.getSheetByName(DB_SHEETS.TRANS).getDataRange().getValues().slice(1);
      const itemsRows = ss.getSheetByName(DB_SHEETS.ITEMS).getDataRange().getValues().slice(1);
      const usersRows = ss.getSheetByName(DB_SHEETS.USERS).getDataRange().getValues().slice(1);
      
      // Map for items: code -> name
      const itemMap = {};
      itemsRows.forEach(r => { if(r[0]) itemMap[r[0]] = r[1]; });

      // Map for users: id -> username AND username -> username
      const userMap = {};
      usersRows.forEach(r => { 
        if(r[0]) userMap[r[0].toString()] = r[1]; 
        if(r[1]) userMap[r[1].toString()] = r[1]; 
      });
      
      return createJsonResponse(transRows.map((r, i) => ({
        id: i, 
        transaction_id: r[0],
        timestamp: r[1], 
        item_code: r[2],
        item_name: itemMap[r[2]] || 'Barang Dihapus',
        username: userMap[r[3]?.toString()] || r[3] || 'Unknown',
        type: r[4], 
        quantity: r[5], 
        person_name: r[6] || "-" 
      })).reverse());
    }

    if (action === 'getSettings') {
      const data = ss.getSheetByName(DB_SHEETS.SETTINGS).getRange(2, 1, 1, 2).getValues()[0];
      return createJsonResponse({ logo_url: data[0] || "", bg_url: data[1] || "" });
    }

    if (action === 'generateReport') {
      const transactionType = e.parameter.transactionType;
      const personName = e.parameter.personName;
      const url = generateTransactionReport(transactionType, personName);
      return createJsonResponse({ url: url });
    }
  } catch (err) {
    return createJsonResponse({ error: err.message });
  }
}

/**
 * GENERATE SUMMARY REPORT FOR A PERSON
 */
function generateTransactionReport(transactionType, personName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const transSheet = ss.getSheetByName(DB_SHEETS.TRANS);
  const transRows = transSheet.getDataRange().getValues().slice(1);
  const itemsRows = ss.getSheetByName(DB_SHEETS.ITEMS).getDataRange().getValues().slice(1);
  
  // Map for items: code -> name
  const itemMap = {};
  itemsRows.forEach(r => { if(r[0]) itemMap[r[0]] = r[1]; });

  // Filter transactions
  const filtered = transRows.filter(r => {
    const rType = r[4];
    const rPerson = r[6];
    const matchesType = !transactionType || rType === transactionType;
    const matchesPerson = !personName || (rPerson && rPerson.toString().toLowerCase() === personName.toString().toLowerCase());
    return matchesType && matchesPerson;
  });

  if (filtered.length === 0) {
    throw new Error(`Tidak ditemukan data transaksi untuk ${personName || 'Semua'} dengan tipe ${transactionType || 'Semua'}`);
  }

  const docName = `REKAP_${transactionType ? transactionType.toUpperCase() : 'SEMUA'}_${personName || 'SEMUA'}_${Date.now()}`;
  const doc = DocumentApp.create(docName);
  const body = doc.getBody();

  // Header (same style)
  const settings = ss.getSheetByName(DB_SHEETS.SETTINGS).getRange(2, 1, 1, 2).getValues()[0];
  const logoUrl = settings[0];

  if (logoUrl) {
    try {
      const response = UrlFetchApp.fetch(logoUrl);
      const image = response.getBlob();
      const img = body.insertImage(0, image);
      img.setWidth(80);
      img.setHeight(80);
      img.getParent().asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    } catch (e) {}
  }

  const header = body.appendParagraph("SMAN 2 PASURUAN\nLABORATORIUM SAINS & KOMPUTER");
  header.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  header.setFontSize(14);
  header.setBold(true);
  body.appendHorizontalRule();

  const title = body.appendParagraph(`LAPORAN REKAPITULASI TRANSAKSI`);
  title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  title.setBold(true);
  title.setFontSize(11);

  const infoStyle = {};
  infoStyle[DocumentApp.Attribute.FONT_SIZE] = 9;
  
  body.appendParagraph(`Nama Personel: ${personName || 'Semua'}`).setAttributes(infoStyle);
  body.appendParagraph(`Tipe Transaksi: ${transactionType || 'Semua'}`).setAttributes(infoStyle);
  body.appendParagraph(`Tanggal Laporan: ${new Date().toLocaleString('id-ID')}`).setAttributes(infoStyle);
  body.appendParagraph("");

  // Table
  const tableData = [["Tanggal", "Kode Barang", "Nama Barang", "Jumlah", "Tipe"]];
  filtered.forEach(r => {
    const dateStr = new Date(r[1]).toLocaleString('id-ID');
    tableData.push([dateStr, r[2], itemMap[r[2]] || "Unknown", r[5].toString(), r[4]]);
  });

  const table = body.appendTable(tableData);
  table.setBorderWidth(1);
  
  // Set Table Style (80% width approx and centered font)
  const tableStyle = {};
  tableStyle[DocumentApp.Attribute.FONT_SIZE] = 8.5;
  table.setAttributes(tableStyle);
  
  // Distribute columns to ~80% of page (468pt * 0.8 / 5 cols)
  const colWidth = 374 / 5;
  for (let i = 0; i < 5; i++) {
    table.setColumnWidth(i, colWidth);
  }

  // Signature Section
  body.appendParagraph("\n\n");
  const signatureTable = body.appendTable([
    ["Mengetahui,", "Pasuruan, " + new Date().toLocaleDateString('id-ID')],
    ["Admin Laboratorium,", "Peminjam/Personel,"],
    ["\n\n\n", ""],
    ["Dimas Putra Pribadi", "( " + (personName || '....................') + " )"],
    ["NIP. 199708302025041003", ""]
  ]);
  signatureTable.setBorderWidth(0);
  signatureTable.setAttributes(tableStyle); // Use same small font
  
  // Align cells
  for (let i = 0; i < 5; i++) {
    signatureTable.getRow(i).getCell(0).setPaddingTop(5).setPaddingBottom(5);
    signatureTable.getRow(i).getCell(1).setPaddingTop(5).setPaddingBottom(5);
  }

  body.appendParagraph("\n\n").appendHorizontalRule();
  const footer = body.appendParagraph(`Dicetak secara otomatis oleh Sistem Inventaris Labsman2Pasuruan pada ${new Date()}`);
  footer.setItalic(true).setFontSize(8);

  doc.saveAndClose();

  // Set permissions
  try {
    const file = DriveApp.getFileById(doc.getId());
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch(e) {}

  return doc.getUrl();
}

/**
 * GENERATE PRINTABLE DOCUMENT
 */
function generateTransactionDoc(data, transactionId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settings = ss.getSheetByName(DB_SHEETS.SETTINGS).getRange(2, 1, 1, 2).getValues()[0];
  const logoUrl = settings[0];
  
  const docName = `SURAT_${data.type.toUpperCase()}_${data.person_name}_${transactionId}`;
  const doc = DocumentApp.create(docName);
  const body = doc.getBody();
  
  // Header
  const header = body.insertParagraph(0, "SMAN 2 PASURUAN\nLABORATORIUM SAINS & KOMPUTER");
  header.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  header.setFontSize(14);
  header.setBold(true);
  body.appendHorizontalRule();
  
  const title = body.appendParagraph(`SURAT BUKTI ${data.type.toUpperCase()}`);
  title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  title.setBold(true);
  title.setFontSize(11);

  const infoStyle = {};
  infoStyle[DocumentApp.Attribute.FONT_SIZE] = 9;

  body.appendParagraph(`ID Transaksi: ${transactionId}`).setAttributes(infoStyle);
  body.appendParagraph(`Tanggal: ${new Date().toLocaleString('id-ID')}`).setAttributes(infoStyle);
  body.appendParagraph(`Nama Personel: ${data.person_name}`).setAttributes(infoStyle);
  body.appendParagraph(`Operator: ${data.user_id}`).setAttributes(infoStyle);
  body.appendParagraph("");

  // Transaction Audit Code (QR Code)
  try {
    const qrUrl = `https://bwipjs-api.metafloor.com/?bcid=qrcode&text=${transactionId}&scale=2&rotate=N`;
    const qrImage = body.appendImage(UrlFetchApp.fetch(qrUrl).getBlob());
    qrImage.setHeight(80).setWidth(80);
    body.appendParagraph("Transaction QR Code").setAttributes({ ...infoStyle, italic: true, bold: true }).setAlignment(DocumentApp.HorizontalAlignment.LEFT);
  } catch(err) {
    body.appendParagraph(`Audit Code: ${transactionId}`).setAttributes(infoStyle);
  }

  body.appendParagraph("");
  
  // Items Table
  const tableData = [["Kode Barang", "Nama Barang", "Jumlah", "Tipe"]];
  data.items.forEach(item => {
    // We need to find the name if it's not in the request
    const itemsData = ss.getSheetByName(DB_SHEETS.ITEMS).getDataRange().getValues();
    const itemName = itemsData.find(row => row[0] == item.item_code)?.[1] || "Unknown";
    tableData.push([item.item_code, itemName, item.quantity.toString(), data.type]);
  });
  
  const table = body.appendTable(tableData);
  table.setBorderWidth(1);
  
  // Set Table Style (80% width approx)
  const tableStyle = {};
  tableStyle[DocumentApp.Attribute.FONT_SIZE] = 8.5;
  table.setAttributes(tableStyle);
  
  const colWidth = 374 / 4; // 4 columns
  for (let i = 0; i < 4; i++) {
    table.setColumnWidth(i, colWidth);
  }
  
  // Signature Section
  body.appendParagraph("\n\n");
  const signatureTable = body.appendTable([
    ["Mengetahui,", "Pasuruan, " + new Date().toLocaleDateString('id-ID')],
    ["Admin Laboratorium,", "Peminjam/Personel,"],
    ["\n\n\n", ""],
    ["Dimas Putra Pribadi", "( " + data.person_name + " )"],
    ["NIP. 199708302025041003", ""]
  ]);
  signatureTable.setBorderWidth(0);
  signatureTable.setAttributes(tableStyle);

  // Align cells
  for (let i = 0; i < 5; i++) {
    signatureTable.getRow(i).getCell(0).setPaddingTop(5).setPaddingBottom(5);
    signatureTable.getRow(i).getCell(1).setPaddingTop(5).setPaddingBottom(5);
  }

  body.appendParagraph("\n\n").appendHorizontalRule();
  const footer = body.appendParagraph(`Dicetak secara otomatis oleh Sistem Inventaris Labsman2Pasuruan pada ${new Date()}`);
  footer.setItalic(true).setFontSize(8);

  doc.saveAndClose();
  
  // Set permissions for viewing
  try {
    const file = DriveApp.getFileById(doc.getId());
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch(e) {
    // If Drive API is not fully enabled, the user might need to manually set permissions
  }
  
  return doc.getUrl();
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;

  try {
    switch (action) {
      case 'login':
        return loginUser(data);
      case 'register':
        return registerUser(data);
      case 'syncStructure':
        return syncStructure();
      case 'syncByQR':
        return syncByQR(data);
      case 'getUsers':
        return getUsers();
      case 'updateUserStatus':
        return updateUserStatus(data);
      case 'addItem':
        return addItem(data);
      case 'addMultipleTransactions':
        return createJsonResponse(processTransactions(data));
      case 'updateSettings':
        return updateSettings(data);
      default:
        return createJsonResponse({ error: 'Action not found' });
    }
  } catch (err) {
    return createJsonResponse({ error: err.message });
  }
}

/**
 * 3. LOGIKA TRANSAKSI & VALIDASI STOK
 */
function processTransactions(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const itemSheet = ss.getSheetByName(DB_SHEETS.ITEMS);
  const transSheet = ss.getSheetByName(DB_SHEETS.TRANS);
  const itemsData = itemSheet.getDataRange().getValues();
  
  const updates = [];
  const errors = [];

  // Validasi Nama Wajib
  if (!data.person_name || data.person_name.trim() === "") {
    return { error: "Identitas Nama Peminjam/Pengembali harus diisi." };
  }

  data.items.forEach(req => {
    const rowIndex = itemsData.findIndex(row => row[0] == req.item_code);
    if (rowIndex === -1) {
      errors.push(`Barang ${req.item_code} tidak ditemukan.`);
      return;
    }

    const item = itemsData[rowIndex];
    const itemName = item[1];
    const totalStock = Number(item[3]);
    const currentStock = Number(item[4]);
    const qty = Number(req.quantity);
    let newStock = currentStock;

    if (data.type === 'pinjam') {
      // CEK NEGATIF STOK
      if (currentStock - qty < 0) {
        errors.push(`PENOLAKAN: Stok ${itemName} tidak mencukupi untuk dipinjam ${qty} (Tersedia: ${currentStock}).`);
      } else {
        newStock = currentStock - qty;
      }
    } else if (data.type === 'kembali') {
      // CEK OVERLOAD STOK
      if (currentStock + qty > totalStock) {
        errors.push(`PENOLAKAN: Pengembalian ${qty} ${itemName} akan melebihi total stok maksimal (${totalStock}). Stok saat ini: ${currentStock}.`);
      } else {
        newStock = currentStock + qty;
      }
    }

    updates.push({ rowIdx: rowIndex + 1, newStock: newStock, itemCode: req.item_code, qty: qty });
  });

  if (errors.length > 0) return { error: errors.join(" | ") };

  // EKSEKUSI JIKA SEMUA VALID
  const timestamp = new Date().toISOString();
  const transactionId = Date.now().toString(); // ID for document naming

  updates.forEach(upd => {
    itemSheet.getRange(upd.rowIdx, 5).setValue(upd.newStock); 
    transSheet.appendRow([
      transactionId,
      timestamp, 
      upd.itemCode, 
      data.user_id, 
      data.type, 
      upd.qty, 
      data.person_name.trim() 
    ]);
  });

  // Generate Document Link
  let docUrl = "";
  try {
    docUrl = generateTransactionDoc(data, transactionId);
  } catch (e) {
    // Optionally log error but don't fail transaction
  }

  return { message: 'Success', docUrl: docUrl };
}

function syncStructure() {
  try {
    setupLabInventory();
    return createJsonResponse({success: true, message: 'Database structure synced successfully.'});
  } catch (error) {
    return createJsonResponse({error: error.message});
  }
}

/**
 * 4. SYNC BY QR CODE
 */
function syncByQR(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const transSheet = ss.getSheetByName(DB_SHEETS.TRANS);
    const itemSheet = ss.getSheetByName(DB_SHEETS.ITEMS);
    
    const transRows = transSheet.getDataRange().getValues();
    const qrText = data.qr_text;
    
    // Find items in transactions with this transaction ID
    const itemsToReturn = [];
    const alreadyReturned = transRows.filter(r => r[0] == qrText && r[4] == 'kembali').map(r => r[2]);

    for (let i = 1; i < transRows.length; i++) {
        const row = transRows[i];
        const tid = row[0];
        const itemCode = row[2];
        const type = row[4];
        
        if (tid == qrText && type == 'pinjam' && !alreadyReturned.includes(itemCode)) {
            itemsToReturn.push({
                item_code: itemCode,
                quantity: row[5],
                person_name: row[6]
            });
        }
    }
    
    if (itemsToReturn.length === 0) return createJsonResponse({error: 'Tidak ditemukan barang yang dipinjam untuk kode ini (atau sudah dikembalikan).'});
    
    const retTransactionId = "RET-" + Utilities.getUuid().substring(0, 8);
    const timestamp = new Date().toISOString();
    
    itemsToReturn.forEach(item => {
        transSheet.appendRow([
            qrText, 
            timestamp,
            item.item_code,
            data.user_id,
            'kembali',
            item.quantity,
            item.person_name
        ]);
        
        const items = itemSheet.getDataRange().getValues();
        for (let j = 1; j < items.length; j++) {
            if (items[j][0] == item.item_code) {
                const currentStock = Number(items[j][4]) || 0;
                itemSheet.getRange(j + 1, 5).setValue(currentStock + Number(item.quantity));
                break;
            }
        }
    });

    return createJsonResponse({ success: true, transactionId: retTransactionId });
  } catch (error) {
    return createJsonResponse({error: error.message});
  }
}

function getUsers() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(DB_SHEETS.USERS);
    if (!sheet) return createJsonResponse([]);
    
    const rows = sheet.getDataRange().getValues().slice(1);
    return createJsonResponse(rows.map(r => ({
      id: r[0],
      username: r[1],
      role: r[3],
      status: r[4] || 'active'
    })));
  } catch (error) {
    return createJsonResponse({error: error.message});
  }
}

function updateUserStatus(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(DB_SHEETS.USERS);
    const rows = sheet.getDataRange().getValues();
    
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] == data.userId) {
        sheet.getRange(i + 1, 5).setValue(data.status); // Column E is status
        return createJsonResponse({success: true});
      }
    }
    return createJsonResponse({error: 'User not found'});
  } catch (error) {
    return createJsonResponse({error: error.message});
  }
}

function loginUser(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(DB_SHEETS.USERS);
  if (!sheet) return createJsonResponse({error: 'Database USERS belum tersedia. Jalankan Setup.'});
  
  const users = sheet.getDataRange().getValues().slice(1);
  const user = users.find(r => r[1] == data.username && r[2] == data.password);
  
  if (user) return createJsonResponse({id: user[0], username: user[1], role: user[3], status: user[4] || 'active'});
  return createJsonResponse({error: 'Username atau Password salah.'});
}

function registerUser(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(DB_SHEETS.USERS);
  if (!sheet) return createJsonResponse({error: 'Database USERS belum tersedia. Jalankan Setup.'});

  const users = sheet.getDataRange().getValues().slice(1);
  const exists = users.find(r => r[1] == data.username);
  
  if (exists) return createJsonResponse({error: 'Username sudah digunakan.'});
  
  const newId = users.length > 0 ? Number(users[users.length-1][0]) + 1 : 1;
  const role = data.role || 'user'; // Default to user
  const status = role === 'admin' ? 'active' : 'pending';
  
  sheet.appendRow([newId, data.username, data.password, role, status]);
  
  return createJsonResponse({id: newId, username: data.username, role: role, status: status});
}

function addItem(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const itemSheet = ss.getSheetByName(DB_SHEETS.ITEMS);
  itemSheet.appendRow([
    data.item_code, 
    data.name, 
    data.category, 
    data.total_stock, 
    data.total_stock, 
    data.unit, 
    data.location, 
    data.min_stock, 
    data.image_url || ""
  ]);
  return createJsonResponse({message: 'Success'});
}

function updateSettings(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.getSheetByName(DB_SHEETS.SETTINGS).getRange(2, 1, 1, 2).setValues([[data.logo_url, data.bg_url]]);
  return createJsonResponse({ message: 'Success' });
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
