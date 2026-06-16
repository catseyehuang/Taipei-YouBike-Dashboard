// ==========================================
// 🚀 YouBike 雙北即時資料 GAS 自動抓取與清洗管線 (雙市全欄位防禦版)
// ==========================================

function scrapeYouBikeData() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Data");
  
  // 1. 如果是空白表單，寫入標準 Header
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'city', 'sno', 'sna', 'sarea', 'tot_quantity', 'sbi_quantity', 
      'bemp', 'lat', 'lng', 'update_time_display', 'load_factor', 
      'status_color', 'scrape_time'
    ]);
  }

  var nptcUrl = "https://data.ntpc.gov.tw/api/datasets/010e5b15-3823-4b20-b401-b1cf000550c5/json?size=2000";
  var tpeUrl = "https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json";
  var scrapeTime = Utilities.formatDate(new Date(), "Asia/Taipei", "yyyy-MM-dd HH:mm:ss");
  
  var rowsToAppend = []; 

  // ==========================================
  // 2. 抓取新北市資料 (多重欄位防禦)
  // ==========================================
  try {
    var ntpcRes = UrlFetchApp.fetch(nptcUrl, {muteHttpExceptions: true});
    if (ntpcRes.getResponseCode() === 200) {
      var ntpcData = JSON.parse(ntpcRes.getContentText());
      
      if (Array.isArray(ntpcData) && ntpcData.length > 0) {
        // 💡 抓漏神器：印出第一筆原始資料，看看欄位到底叫什麼名字！
        Logger.log("🔍 [抓漏] 新北市第一筆原始資料：" + JSON.stringify(ntpcData[0]));

        var startCount = rowsToAppend.length;
        ntpcData.forEach(function(item) {
          // 🛡️ 同時支援新北的長欄位與短欄位變體
          var tot = parseInt(item.tot_quantity || item.tot || item.Quantity || 0); 
          
          if (tot > 0) { 
            var sbi = parseInt(item.sbi_quantity || item.sbi || item.available_rent_bikes || 0);
            var bemp = parseInt(item.bemp || item.available_return_bikes || 0);
            var lat = parseFloat(item.lat || item.latitude || 0);
            var lng = parseFloat(item.lng || item.longitude || 0);
            var updateTime = unifyDateTimeFormat(item.mday || item.updateTime || scrapeTime); 
            
            var load_factor = (sbi / tot) * 100;
            var status = 'green';
            if (sbi === 0 || load_factor < 10) status = 'red';
            else if (bemp === 0 || load_factor > 90) status = 'orange';

            rowsToAppend.push([
              'New Taipei', item.sno || '未知', item.sna || '未知', item.sarea || '未知', 
              tot, sbi, bemp, lat, lng, updateTime, load_factor, status, scrapeTime
            ]);
          }
        });
        Logger.log("🔵 新北市 API 成功解析了 " + (rowsToAppend.length - startCount) + " 筆測站。");
      }
    }
  } catch(e) { Logger.log("❌ 新北市執行崩潰：" + e); }

  // ==========================================
  // 3. 抓取台北市資料
  // ==========================================
  try {
    var tpeRes = UrlFetchApp.fetch(tpeUrl, {muteHttpExceptions: true});
    if (tpeRes.getResponseCode() === 200) {
      var tpeData = JSON.parse(tpeRes.getContentText());
      
      if (Array.isArray(tpeData) && tpeData.length > 0) {
        // 💡 抓漏：若還是 0 筆，可以打開日誌看這行到底印出什麼欄位
        Logger.log("🔍 [抓漏] 台北市第一筆原始資料結構：" + JSON.stringify(tpeData[0]));
        
        var startCount = rowsToAppend.length;
        tpeData.forEach(function(item) {
          // 🛡️ 同時支援台北的簡寫 (tot) 與說明的長寫 (quantity / Quantity)
          var tot = parseInt(item.tot || item.quantity || item.Quantity || item.tot_quantity || 0);
          
          if (tot > 0) { 
            var sbi = parseInt(item.sbi || item.available_rent_bikes || item.sbi_quantity || 0);
            var bemp = parseInt(item.bemp || item.available_return_bikes || 0);
            var lat = parseFloat(item.lat || item.latitude || 0);
            var lng = parseFloat(item.lng || item.longitude || 0);
            
            var updateTime = unifyDateTimeFormat(item.mday || item.updateTime || scrapeTime);
            
            var load_factor = (sbi / tot) * 100;
            var status = 'green';
            if (sbi === 0 || load_factor < 10) status = 'red';
            else if (bemp === 0 || load_factor > 90) status = 'orange';

            rowsToAppend.push([
              'Taipei', item.sno || '未知', item.sna || '未知', item.sarea || '未知', 
              tot, sbi, bemp, lat, lng, updateTime, load_factor, status, scrapeTime
            ]);
          }
        });
        Logger.log("🟢 台北市 API 成功解析了 " + (rowsToAppend.length - startCount) + " 筆測站。");
      }
    }
  } catch(e) { Logger.log("❌ 台北市執行崩潰：" + e); }

  // ==========================================
  // 4. 數據匯流批次寫入與格式鎖定 (Format Locking)
  // ==========================================
  if (rowsToAppend.length > 0) {
    var ntpcCount = rowsToAppend.filter(function(r) { return r[0] === 'New Taipei'; }).length;
    var tpeCount = rowsToAppend.filter(function(r) { return r[0] === 'Taipei'; }).length;

    var lastRow = sheet.getLastRow();
    var startRow = lastRow + 1;
    // 寫入原始數據
    sheet.getRange(startRow, 1, rowsToAppend.length, rowsToAppend[0].length).setValues(rowsToAppend);

    sheet.getRange(startRow, 8, rowsToAppend.length, 2).setNumberFormat("0.000000");

    sheet.getRange(startRow, 10, rowsToAppend.length, 1).setNumberFormat("@");


    
    //Logger.log("--------------------------------------------------");
    Logger.log("✅ 數據匯流寫入完成！本波總計寫入: " + rowsToAppend.length + " 筆");
    Logger.log("   👉 新北市有效數據: " + ntpcCount + " 筆");
    Logger.log("   👉 台北市有效數據: " + tpeCount + " 筆");
    //Logger.log("--------------------------------------------------");
  } else {
    Logger.log("🚨 終極警報：本次無任何數據寫入！");
  }
}

// ==========================================
// 🛠️ 輔助工具：雙北時間格式無縫標準化解析器
// ==========================================
function unifyDateTimeFormat(timeStr) {
  if (!timeStr) return "";
  var str = timeStr.toString().trim();
  
  // 匹配台北市格式: 20260616T084902
  var matchTight = str.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/);
  if (matchTight) {
    return matchTight[1] + "-" + matchTight[2] + "-" + matchTight[3] + " " + matchTight[4] + ":" + matchTight[5] + ":" + matchTight[6];
  }
  
  // 匹配新北市格式: 2026-06-16 10:23:03 (若已經符合則直接回傳)
  var matchStandard = str.match(/^(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})$/);
  if (matchStandard) {
    return str;
  }
  
  return str; // 額外防禦
}
