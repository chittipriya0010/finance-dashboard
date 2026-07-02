// Each Indian bank's statement export uses different column names and date formats.
// This maps them all to a common shape: { date, description, debit, credit }
// Extend this file as you test against real exports — banks tweak formats occasionally.

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
dayjs.extend(customParseFormat);

function parseDate(value, formats) {
  for (const fmt of formats) {
    const d = dayjs(value, fmt, true);
    if (d.isValid()) return d.format("YYYY-MM-DD");
  }
  return null;
}

export const BANK_FORMATS = {
  SBI: {
    dateFormats: ["DD-MM-YYYY", "DD/MM/YY"],
    map: (row) => ({
      date: parseDate(row["Txn Date"] || row["Date"], ["DD-MM-YYYY", "DD/MM/YY"]),
      description: row["Description"] || row["Narration"] || "",
      debit: parseFloat(row["Debit"] || row["Withdrawal Amt"] || 0) || 0,
      credit: parseFloat(row["Credit"] || row["Deposit Amt"] || 0) || 0,
    }),
  },
  HDFC: {
    dateFormats: ["DD/MM/YY"],
    map: (row) => ({
      date: parseDate(row["Date"], ["DD/MM/YY", "DD/MM/YYYY"]),
      description: row["Narration"] || "",
      debit: parseFloat(row["Withdrawal Amt."] || row["Debit"] || 0) || 0,
      credit: parseFloat(row["Deposit Amt."] || row["Credit"] || 0) || 0,
    }),
  },
  ICICI: {
    dateFormats: ["DD-MM-YYYY"],
    map: (row) => ({
      date: parseDate(row["Value Date"] || row["Transaction Date"], ["DD-MM-YYYY"]),
      description: row["Transaction Remarks"] || row["Description"] || "",
      debit: parseFloat(row["Withdrawal Amount (INR )"] || row["Debit"] || 0) || 0,
      credit: parseFloat(row["Deposit Amount (INR )"] || row["Credit"] || 0) || 0,
    }),
  },
  AXIS: {
    dateFormats: ["DD-MM-YYYY"],
    map: (row) => ({
      date: parseDate(row["Tran Date"] || row["Date"], ["DD-MM-YYYY"]),
      description: row["PARTICULARS"] || row["Description"] || "",
      debit: parseFloat(row["DR"] || row["Debit"] || 0) || 0,
      credit: parseFloat(row["CR"] || row["Credit"] || 0) || 0,
    }),
  },
};
