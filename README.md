# ExportRakutenPointHistory
楽天ポイント履歴をCSVファイルとしてダウンロードするブックマークレットです。

# 使い方
## 準備
ブラウザでブックマークを作成し、URLに以下のコードを貼り付けてください。
```
javascript:(function(url) { s = document.createElement("script"); s.src = url; document.body.appendChild(s); })('https://yuki-gu.github.io/ExportRakutenPointHistory/main.js');
```

## CSVファイルのダウンロード
楽天PointClubの[ポイント実績](https://point.rakuten.co.jp/history/?l-id=point_top_history_pc)のページにアクセスし、
ブックマークをクリックすればダウンロードが始まります。  
「さらに絞り込む」から期間を選択することもできます。
