const mongoose = require("mongoose");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const Data = require("../models/data");

const BATCH_SIZE = 1000;

const runAsync = (db, query, params) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve();
    });
  });
};

async function processBatchOfDocuments(cursor, sqliteDb) {
  let count = 0;

  while (count < BATCH_SIZE) {
    const doc = await cursor.next();
    if (!doc) return false;

    await runAsync(sqliteDb, `
      INSERT OR REPLACE INTO updatedcliffdatas
      (id, title, filename, filetype, filesize, url, filedetails, baseurl, __v)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        doc.id,
        doc.title,
        doc.filename,
        doc.filetype,
        doc.filesize,
        doc.url,
        doc.filedetails,
        doc.baseurl,
        doc.__v
      ]
    );

    count++;
  }

  console.log(`✅ Processed batch of ${count} documents`);
  return true;
}

async function transferDataToSQLite(projectname) {
  const dbPath = path.join(process.cwd(), "..", "..", "Projects", projectname, "searchdatawithfts.db");
  const sqliteDb = new sqlite3.Database(dbPath);

  await new Promise((res, rej) => {
    sqliteDb.run(`
      CREATE VIRTUAL TABLE IF NOT EXISTS updatedcliffdatas
      USING fts5(
        id,
        title,
        filename,
        filetype,
        filesize UNINDEXED,
        url,
        filedetails,
        baseurl,
        __v UNINDEXED
      )
    `, (err) => err ? rej(err) : res());
  });

  const cursor = Data.find().cursor();
  let batchNumber = 0;

  while (true) {
    const moreDocs = await processBatchOfDocuments(cursor, sqliteDb);
    if (!moreDocs) break;
    batchNumber++;
    console.log(`📦 Batch ${batchNumber} done`);
  }

  sqliteDb.close();
  console.log("🎉 All documents transferred to SQLite");
}

module.exports = { transferDataToSQLite };
