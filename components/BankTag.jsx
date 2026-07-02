const BANK_COLORS = {
  SBI: "#2E6F40",
  HDFC: "#B4592F",
  ICICI: "#8A4FA3",
  AXIS: "#2E5C8A",
};

export default function BankTag({ bank }) {
  const color = BANK_COLORS[bank?.toUpperCase()] || "#5A6670";
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wide"
      style={{ backgroundColor: `${color}18`, color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {bank}
    </span>
  );
}
