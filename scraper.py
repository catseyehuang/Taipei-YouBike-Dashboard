import os
import datetime
import requests
import pandas as pd

# 配置雙北 YouBike 2.0 API 端點
NEWTAIPEI_URL = "https://data.ntpc.gov.tw/api/datasets/010e5b15-3823-4b20-b401-b1cf000550c5/json?size=2000"
TAIPEI_URL = "https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json"

def scrape_and_append():
    # 1. 紀錄擷取當下的時間戳記 (作為時間序列分析的 Key)
    tz_tw = datetime.timezone(datetime.timedelta(hours=8))
    scrape_time = datetime.datetime.now(tz_tw).strftime('%Y-%m-%d %H:%M:%S')

    # 2. 獲取並清洗新北市即時快照
    try:
        resp_ntpc = requests.get(NEWTAIPEI_URL, timeout=30)
        df_ntpc = pd.DataFrame(resp_ntpc.json())
        df_ntpc = df_ntpc.rename(columns={'mday': 'update_time_display'})
        df_ntpc['city'] = 'New Taipei'
    except Exception as e:
        print(f"新北市資料獲取失敗: {e}")
        df_ntpc = pd.DataFrame()

    # 3. 獲取並清洗台北市即時快照
    try:
        resp_tpe = requests.get(TAIPEI_URL, timeout=30)
        df_tpe = pd.DataFrame(resp_tpe.json())
        df_tpe = df_tpe.rename(columns={
            'Quantity': 'tot_quantity',
            'available_rent_bikes': 'sbi_quantity',
            'available_return_bikes': 'bemp',
            'latitude': 'lat',
            'longitude': 'lng',
            'mday': 'update_time_display'
        })
        df_tpe['city'] = 'Taipei'
    except Exception as e:
        print(f"台北市資料獲取失敗: {e}")
        df_tpe = pd.DataFrame()

    # 4. 斷點防禦：若雙北皆失敗則終止管線
    if df_ntpc.empty and df_tpe.empty:
        print("雙北資料皆獲取失敗，終止本次寫入。")
        return

    # 5. 資料垂直合併 (Union)
    df_combined = pd.concat([df_ntpc, df_tpe], ignore_index=True)

    # 6. Schema 標準化與轉型
    final_cols = ['city', 'sna', 'sarea', 'tot_quantity', 'sbi_quantity', 'bemp', 'lat', 'lng', 'update_time_display']
    existing_cols = [col for col in final_cols if col in df_combined.columns]
    df_combined = df_combined[existing_cols].copy()

    numeric_cols = ['tot_quantity', 'sbi_quantity', 'bemp', 'lat', 'lng']
    for col in numeric_cols:
        if col in df_combined.columns:
            df_combined[col] = pd.to_numeric(df_combined[col], errors='coerce')

    # 7. 異常值過濾與衍生特徵工程
    df_combined = df_combined[df_combined['tot_quantity'] > 0].copy()
    df_combined['load_factor'] = (df_combined['sbi_quantity'] / df_combined['tot_quantity']) * 100

    def get_color(row):
        if row['sbi_quantity'] == 0 or row['load_factor'] < 10: return 'red'
        elif row['bemp'] == 0 or row['load_factor'] > 90: return 'orange'
        else: return 'green'
    df_combined['status_color'] = df_combined.apply(get_color, axis=1)

    # 8. 注入歷史維度欄位 (區分每一波快照的時間點)
    df_combined['scrape_time'] = scrape_time

    # 9. 增量附加寫入 (Incremental Append to CSV)
    output_dir = 'data'
    output_file = os.path.join(output_dir, 'history_data.csv')

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # 檢查檔案是否存在，決定是否寫入 Header
    file_exists = os.path.exists(output_file)
    df_combined.to_csv(output_file, mode='a', index=False, header=not file_exists, encoding='utf-8-sig')
    print(f"✅ 成功附加 {len(df_combined)} 筆站點數據至 {output_file}，時間戳記：{scrape_time}")

if __name__ == "__main__":
    scrape_and_append()
