---
version: alpha
name: StudyOS
description: "繁體中文備考、排課與試卷檢討工具"
colors:
  primary: "#346F68"
  background: "#F5F4EF"
  surface: "#FFFEFA"
  text: "#252C28"
  dark-background: "#191A1D"
  dark-surface: "#23252A"
  dark-primary: "#91E6C1"
  dark-text: "#F2F3F6"
typography:
  body:
    fontFamily: "system-ui, PingFang TC, Microsoft JhengHei, LINE Seed TW, sans-serif"
    fontSize: "1rem"
    lineHeight: 1.58
rounded:
  sm: "14px"
  md: "18px"
  lg: "24px"
spacing:
  compact: "8px"
  control-gap: "12px"
  section-gap: "16px"
components:
  button: {}
  dialog: {}
  field: {}
---

# StudyOS 介面約定

StudyOS 用於繁體中文排課、知識點複習、整卷作答與逐題檢討。以試卷原題號、日期與作答狀態組織資訊。手機先露出下一個可執行動作，寬版用額外空間並排內容與清單。

`index.html` 的 CSS 變數與主題覆寫是執行時色票來源。本檔記錄既有方向，實際控制項沿用 `--accent`、`--surface`、`--elevated`、`--text` 與 `--ui-*`。淺色用暖白和藍綠，深色用中性炭灰和薄荷綠。長文沿用正文尺度與自然換行。

- 沿用 `.btn`、`.study-field`、`.study-actions` 和共用 `dialog`。主要動作用實底按鈕，次要操作沿用中性底。驗證與保存由原表單處理。
- 手機頁尾保留浮動導覽的安全區。長彈窗以一處為主要捲動區，重要操作保留可見，鍵盤焦點應可捲到操作列上方。
- 試卷以原題號定位。短題組直接呈現，長題組可以展開完整原文。檢討先看答案差異，詳解維持獨立欄位。
- 科目與章節使用原生下拉選單。日期與時間依現有平台元件處理，包含裝置原生欄位及既有的時分滾輪。
