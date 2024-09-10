// HTML要素のテキストを取得する
// 連続した空白、改行を削除
function getNodeText(node) {
    let text = "";
    if (node.nodeType === Node.ELEMENT_NODE) text = node.innerText;
    else if (node.nodeType === Node.TEXT_NODE) text = node.textContent;
    return text.split('\n').map(s => s.trim().replaceAll(/(\s)\s+/g, "$1")).filter(s => s.length !== 0).join('\n')
}

// ポイント履歴の全ページの内容を再帰的に取得
async function getPointData(dom) {
    const result = [];

    // 1ページ分のポイント履歴を取得
    const tbody = dom.querySelector("table.history-table > tbody");
    const rows = tbody.querySelectorAll("tr.get, tr.use");
    for (const row of rows) {
        // 日付 (2024/01/01)
        const dateTag = row.querySelector("td.date").cloneNode(true);  // HTML要素を改変するためコピー
        dateTag.querySelector("br").replaceWith('/');
        const date = getNodeText(dateTag);

        // サービス (サービス名のみ, 利用明細などの詳細は含まない)
        const service = getNodeText(row.querySelector("td.service a"));

        // 内容 (改行を含むテキスト)
        // 詳細があるものは別の列"詳細"に記載
        const detailTag = row.querySelector("td.detail").cloneNode(true);  // HTML要素を改変するためコピー
        let popover = "";  // "詳細"列のテキスト
        const popoverTag = detailTag.querySelector("div.history-popover");  // 詳細の処理
        if (popoverTag != null) {
            popoverTag.querySelector("div.btn-layout-center").remove();  // 閉じるボタンの削除
            popover = getNodeText(popoverTag.querySelector("div.popover-content"));
            popoverTag.remove();  // 詳細が"内容"列に含まれないように削除
        }
        const detail = getNodeText(detailTag);  // "内容"列のテキスト
        
        // 動作 (利用|獲得（期間限定）|獲得（通常）)
        // 獲得の場合は通常ポイントと期間限定ポイントに分けて記載
        let action = getNodeText(row.querySelector("td.action"));
        if (action.includes("獲得")) action = action.includes("期間限定") ? "獲得（期間限定）" : "獲得（通常）";

        // ポイント (数値)
        const point = parseInt(
            getNodeText(row.querySelector("td.point")).split('\n').shift().replaceAll(/[^\-\d.]/g, ""),
            10
        );

        // 備考 (改行を含むテキスト)
        // "■"は文字として記載
        const noteTag = row.querySelector("td.note").cloneNode(true);  // HTML要素を改変するためコピー
        for (const icon of noteTag.querySelectorAll("div.note-icon"))
            icon.replaceWith("■" + icon.innerText.trim());  // アイコンを文字に置換
        const note = getNodeText(noteTag);

        // 結果格納
        result.push([date, service, detail, popover, action, point, note]);
    }

    // 次のページを取得
    const nextBtn = Array.from(dom.querySelectorAll("ul.pagination a")).at(-1);  // NEXTボタンを取得
    if (nextBtn.innerText === 'NEXT') {
        try {
            const response = await fetch(nextBtn.getAttribute("href"));  // NEXTボタンのURLにアクセス
            if (!response.ok)
                throw new Error(response.statusText);
            const text = await response.text();
            const dom = new DOMParser().parseFromString(text, "text/html");  // 遷移先のDOM
            result.push(...(await getPointData(dom)));  // 再帰呼び出し
        } catch (error) {
            console.error(error);
        }
    }

    return result;
}

// ダウンロードするファイル情報
const fileName = 'pointData.csv';  // ダウンロードするファイル名
const delimiter = ',';  // 区切り文字
const header = ['日付', 'サービス', '内容', '詳細', '動作', 'ポイント', '備考'];  // CSVヘッダー

// 全てのページの情報を取得
getPointData(document).then(dataArray => {
    // CSVダウンロード
    dataArray.unshift(header);
    // "文字列"は引用符で囲う
    const dataStr = dataArray.map(arr => arr.map(s => (typeof s === "string") ? `"${s}"` : s).join(delimiter)).join('\n');
    // const dataStr = dataArray.map(arr => arr.map(s => (typeof s === "string") ? s.replaceAll("\n", "  ") : s).join(delimiter)).join('\n');  // 改行コードを含めない場合
    const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
    const blob = new Blob([bom, dataStr], {type: "text/csv"});

    const downloadTag = document.createElement('a');
    downloadTag.download = fileName;
    downloadTag.href = URL.createObjectURL(blob);
    downloadTag.click();
    URL.revokeObjectURL(downloadTag.href);
})
