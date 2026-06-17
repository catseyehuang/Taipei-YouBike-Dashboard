// ==========================================
// 🚀 YouBike 原始資料下載管線 (Data Lake Ingestion)
// ==========================================

function downloadRawYouBikeJSON() {
  // ⚠️ 請在這裡貼上你剛剛複製的 Google Drive Folder ID
  var folderId = "1gPi4PK0AifkNEL2sFuje3LBSlRNxzbHT"; 
  var folder = DriveApp.getFolderById(folderId);
  
  var nptcUrl = "https://data.ntpc.gov.tw/api/datasets/010e5b15-3823-4b20-b401-b1cf000550c5/json?size=2000";
  var tpeUrl = "https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json";
  
  // 取得現在時間作為檔名 (例如: 20260616_120500)
  var timestamp = Utilities.formatDate(new Date(), "Asia/Taipei", "yyyyMMdd_HHmmss");
  
  // 1. 下載新北市原始 JSON 並存檔
  try {
    var ntpcRes = UrlFetchApp.fetch(nptcUrl, {muteHttpExceptions: true});
    if (ntpcRes.getResponseCode() === 200) {
      var fileName = "NTPC_" + timestamp + ".json";
      folder.createFile(fileName, ntpcRes.getContentText(), MimeType.PLAIN_TEXT);
      Logger.log("✅ 成功儲存新北市 JSON: " + fileName);
    }
  } catch(e) { Logger.log("❌ 新北市下載失敗: " + e); }

  // 2. 下載台北市原始 JSON 並存檔
  try {
    var tpeRes = UrlFetchApp.fetch(tpeUrl, {muteHttpExceptions: true});
    if (tpeRes.getResponseCode() === 200) {
      var fileName = "TPE_" + timestamp + ".json";
      folder.createFile(fileName, tpeRes.getContentText(), MimeType.PLAIN_TEXT);
      Logger.log("✅ 成功儲存台北市 JSON: " + fileName);
    }
  } catch(e) { Logger.log("❌ 台北市下載失敗: " + e); }
}
