import { useState, useCallback, useEffect } from "react";
import BankTag from "./BankTag";

const STATUS = { IDLE: "idle", DRAGGING: "dragging", UPLOADING: "uploading", DONE: "done", ERROR: "error" };

export default function UploadModal({ open, onClose, onUploaded, onAddAccount }) {
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState("");
  const [status, setStatus] = useState(STATUS.IDLE);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    if (!open) return;
    fetch("/api/accounts")
      .then(r => r.json())
      .then(data => {
        setAccounts(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length && !accountId) setAccountId(String(data[0].id));
      })
      .catch(() => setAccounts([]));
  }, [open]);

  const reset = () => {
    setStatus(STATUS.IDLE);
    setResult(null);
    setErrorMsg("");
    setFileName("");
  };

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    if (!accountId) {
      setStatus(STATUS.ERROR);
      setErrorMsg("Pick an account first — that's how we know which bank's column format to use.");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setStatus(STATUS.ERROR);
      setErrorMsg("Only CSV files are supported right now. Export your statement as CSV from netbanking.");
      return;
    }

    const account = accounts.find(a => String(a.id) === String(accountId));
    setFileName(file.name);
    setStatus(STATUS.UPLOADING);
    setErrorMsg("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bank", account.bank);
    formData.append("account_id", accountId);

    try {
      const res = await fetch("/api/transactions/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setResult(data);
      setStatus(STATUS.DONE);
      onUploaded?.();
    } catch (err) {
      setStatus(STATUS.ERROR);
      setErrorMsg(err.message);
    }
  }, [accountId, accounts, onUploaded]);

  const onDrop = (e) => {
    e.preventDefault();
    setStatus(STATUS.UPLOADING);
    handleFile(e.dataTransfer.files?.[0]);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div
        className="bg-paper border border-line rounded-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl text-ink">Upload a statement</h2>
          <button onClick={() => { reset(); onClose(); }} className="text-slate hover:text-ink text-sm">✕</button>
        </div>

        <label className="block text-[11px] font-mono uppercase tracking-wide text-slate mb-2">Account</label>
        {accounts.length === 0 ? (
          <div className="border border-dashed border-line rounded-xl px-4 py-5 mb-5 text-center">
            <p className="text-sm text-slate mb-3">No accounts yet — add one to know which bank's column format to expect.</p>
            <button
              onClick={onAddAccount}
              className="px-4 py-2 rounded-lg bg-ink text-paper text-sm font-medium hover:bg-ink/90"
            >
              Add an account
            </button>
          </div>
        ) : (
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full border border-line rounded-lg px-3 py-2 mb-5 bg-white text-sm font-body"
          >
            {accounts.map(a => (
              <option key={a.id} value={a.id}>
                {a.bank} · {a.account_type} · ••••{(a.account_number_masked || "").slice(-4)}
              </option>
            ))}
          </select>
        )}

        {accounts.length > 0 && status !== STATUS.DONE && (
          <div
            onDragOver={(e) => { e.preventDefault(); setStatus(STATUS.DRAGGING); }}
            onDragLeave={() => setStatus(STATUS.IDLE)}
            onDrop={onDrop}
            className={`border-2 border-dashed rounded-xl px-6 py-10 text-center transition-colors ${
              status === STATUS.DRAGGING ? "border-clay bg-clay/5" : "border-line"
            }`}
          >
            {status === STATUS.UPLOADING ? (
              <p className="text-sm text-slate font-mono">Parsing {fileName}…</p>
            ) : (
              <>
                <p className="text-sm text-ink mb-2">Drag a CSV statement here</p>
                <p className="text-xs text-slate mb-4">or</p>
                <label className="inline-block px-4 py-2 rounded-lg bg-ink text-paper text-sm cursor-pointer hover:bg-ink/90">
                  Choose file
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />
                </label>
              </>
            )}
          </div>
        )}

        {status === STATUS.ERROR && (
          <p className="mt-4 text-sm text-clay">{errorMsg}</p>
        )}

        {status === STATUS.DONE && result && (
          <div className="mt-1">
            <div className="border border-line rounded-xl p-4 bg-white/60 mb-4">
              <p className="text-sm text-ink mb-1">
                <span className="font-medium">{result.inserted}</span> transactions imported from{" "}
                <BankTag bank={result.bank} />
              </p>
              {result.skipped > 0 && (
                <p className="text-xs text-slate">{result.skipped} rows skipped (no date or zero amount — check column mapping if this seems high)</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={reset}
                className="flex-1 px-4 py-2 rounded-lg border border-line text-sm text-ink hover:bg-white"
              >
                Upload another
              </button>
              <button
                onClick={() => { reset(); onClose(); }}
                className="flex-1 px-4 py-2 rounded-lg bg-moss text-paper text-sm hover:bg-moss/90"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
