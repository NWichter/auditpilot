"use client";

import { useRef, useState, useCallback } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
}

const CSV_TEMPLATE = `year,item,value
2022,Revenue,5000000
2022,Cost of Revenue,2800000
2022,Gross Profit,2200000
2022,Operating Expenses,1200000
2022,Operating Income,1000000
2022,Interest Expense,80000
2022,Net Income,750000
2022,Depreciation,150000
2022,SG&A,600000
2022,EBITDA,1150000
2022,Cash and Cash Equivalents,900000
2022,Accounts Receivable,650000
2022,Inventory,400000
2022,Current Assets,2100000
2022,Total Assets,8500000
2022,PPE,3200000
2022,Current Liabilities,1100000
2022,Long Term Debt,2500000
2022,Total Liabilities,4800000
2022,Total Equity,3700000
2022,Operating Cash Flow,980000
2022,Investing Cash Flow,-420000
2022,Financing Cash Flow,-310000
2022,Capital Expenditures,420000
2023,Revenue,5600000
2023,Cost of Revenue,3100000
2023,Gross Profit,2500000
2023,Operating Expenses,1350000
2023,Operating Income,1150000
2023,Interest Expense,90000
2023,Net Income,860000
2023,Depreciation,170000
2023,SG&A,680000
2023,EBITDA,1320000
2023,Cash and Cash Equivalents,1100000
2023,Accounts Receivable,720000
2023,Inventory,430000
2023,Current Assets,2400000
2023,Total Assets,9200000
2023,PPE,3500000
2023,Current Liabilities,1200000
2023,Long Term Debt,2400000
2023,Total Liabilities,4900000
2023,Total Equity,4300000
2023,Operating Cash Flow,1050000
2023,Investing Cash Flow,-480000
2023,Financing Cash Flow,-350000
2023,Capital Expenditures,480000
`;

function downloadTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "financial_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function UploadZone({ onFileSelect }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith(".csv")) return;
      setSelectedFile(file.name);
      onFileSelect(file);
    },
    [onFileSelect],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <div className="w-full space-y-3">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 cursor-pointer transition-colors",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/30",
        )}
      >
        <Upload
          className={cn(
            "h-10 w-10 transition-colors",
            isDragOver ? "text-primary" : "text-muted-foreground",
          )}
        />
        {selectedFile ? (
          <p className="text-sm font-medium text-foreground">{selectedFile}</p>
        ) : (
          <p className="text-sm text-muted-foreground text-center">
            Drop your financial statements here
          </p>
        )}
        <p className="text-xs text-muted-foreground/60">
          or{" "}
          <span className="text-primary underline underline-offset-2">
            click to browse
          </span>
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={onInputChange}
        />
      </div>
      <div className="flex justify-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            downloadTemplate();
          }}
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
        >
          Download CSV Template
        </button>
      </div>
    </div>
  );
}
