import type { FinancialData, YearStatement } from "./types";

// Maps flexible CSV field names to canonical YearStatement keys
const ITEM_MAP: Record<string, keyof YearStatement> = {
  // year
  year: "year",
  fiscal_year: "year",
  "fiscal year": "year",

  // revenue
  revenue: "revenue",
  "total revenue": "revenue",
  "net revenue": "revenue",
  sales: "revenue",
  "total sales": "revenue",
  "net sales": "revenue",

  // costOfRevenue
  cogs: "costOfRevenue",
  "cost of revenue": "costOfRevenue",
  "cost of goods sold": "costOfRevenue",
  "cost of sales": "costOfRevenue",
  costofsales: "costOfRevenue",
  costofrevenue: "costOfRevenue",

  // grossProfit
  "gross profit": "grossProfit",
  grossprofit: "grossProfit",

  // operatingExpenses
  "operating expenses": "operatingExpenses",
  opex: "operatingExpenses",
  "total operating expenses": "operatingExpenses",
  operatingexpenses: "operatingExpenses",

  // operatingIncome
  "operating income": "operatingIncome",
  ebit: "operatingIncome",
  "income from operations": "operatingIncome",
  operatingincome: "operatingIncome",

  // interestExpense
  "interest expense": "interestExpense",
  interestexpense: "interestExpense",
  "interest and debt expense": "interestExpense",

  // netIncome
  "net income": "netIncome",
  netincome: "netIncome",
  "net profit": "netIncome",
  "net earnings": "netIncome",
  "profit after tax": "netIncome",

  // depreciation
  depreciation: "depreciation",
  "depreciation and amortization": "depreciation",
  "d&a": "depreciation",
  "depreciation & amortization": "depreciation",
  da: "depreciation",

  // sgaExpenses
  "sg&a": "sgaExpenses",
  sga: "sgaExpenses",
  "sga expenses": "sgaExpenses",
  "selling general and administrative": "sgaExpenses",
  "selling, general and administrative": "sgaExpenses",
  sgaexpenses: "sgaExpenses",

  // ebitda
  ebitda: "ebitda",
  "earnings before interest taxes depreciation amortization": "ebitda",

  // cash
  cash: "cash",
  "cash and cash equivalents": "cash",
  "cash & equivalents": "cash",
  "cash and equivalents": "cash",
  cashandcashequivalents: "cash",

  // accountsReceivable
  "accounts receivable": "accountsReceivable",
  ar: "accountsReceivable",
  receivables: "accountsReceivable",
  "trade receivables": "accountsReceivable",
  accountsreceivable: "accountsReceivable",

  // inventory
  inventory: "inventory",
  inventories: "inventory",

  // currentAssets
  "current assets": "currentAssets",
  "total current assets": "currentAssets",
  currentassets: "currentAssets",

  // totalAssets
  "total assets": "totalAssets",
  totalassets: "totalAssets",

  // ppe
  ppe: "ppe",
  "property plant and equipment": "ppe",
  "property, plant and equipment": "ppe",
  "property plant equipment": "ppe",
  "net ppe": "ppe",

  // currentLiabilities
  "current liabilities": "currentLiabilities",
  "total current liabilities": "currentLiabilities",
  currentliabilities: "currentLiabilities",

  // longTermDebt
  "long term debt": "longTermDebt",
  "long-term debt": "longTermDebt",
  longtermdebt: "longTermDebt",
  ltd: "longTermDebt",

  // totalLiabilities
  "total liabilities": "totalLiabilities",
  totalliabilities: "totalLiabilities",
  liabilities: "totalLiabilities",

  // totalEquity
  "total equity": "totalEquity",
  "shareholders equity": "totalEquity",
  "shareholders' equity": "totalEquity",
  "total shareholders equity": "totalEquity",
  equity: "totalEquity",
  totalequity: "totalEquity",
  "stockholders equity": "totalEquity",
  "stockholders' equity": "totalEquity",

  // operatingCashFlow
  "operating cash flow": "operatingCashFlow",
  "cash from operations": "operatingCashFlow",
  "net cash from operating activities": "operatingCashFlow",
  "cash flow from operations": "operatingCashFlow",
  ocf: "operatingCashFlow",
  operatingcashflow: "operatingCashFlow",

  // investingCashFlow
  "investing cash flow": "investingCashFlow",
  "cash from investing": "investingCashFlow",
  "net cash from investing activities": "investingCashFlow",
  investingcashflow: "investingCashFlow",

  // financingCashFlow
  "financing cash flow": "financingCashFlow",
  "cash from financing": "financingCashFlow",
  "net cash from financing activities": "financingCashFlow",
  financingcashflow: "financingCashFlow",

  // capitalExpenditures
  capex: "capitalExpenditures",
  "capital expenditures": "capitalExpenditures",
  "capital expenditure": "capitalExpenditures",
  capitalexpenditures: "capitalExpenditures",
  "purchases of property plant and equipment": "capitalExpenditures",
};

function normalizeKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

function parseNumber(raw: string): number {
  if (!raw || raw.trim() === "" || raw.trim() === "-") return 0;
  // Remove currency symbols, commas, parentheses (negative notation), spaces
  const cleaned = raw
    .trim()
    .replace(/[$€£¥,]/g, "")
    .replace(/\s/g, "")
    .replace(/\(([0-9.]+)\)/, "-$1"); // (1234) => -1234
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

function createEmptyStatement(year: number): YearStatement {
  return {
    year,
    revenue: 0,
    costOfRevenue: 0,
    grossProfit: 0,
    operatingExpenses: 0,
    operatingIncome: 0,
    interestExpense: 0,
    netIncome: 0,
    depreciation: 0,
    sgaExpenses: 0,
    ebitda: 0,
    cash: 0,
    accountsReceivable: 0,
    inventory: 0,
    currentAssets: 0,
    totalAssets: 0,
    ppe: 0,
    currentLiabilities: 0,
    longTermDebt: 0,
    totalLiabilities: 0,
    totalEquity: 0,
    operatingCashFlow: 0,
    investingCashFlow: 0,
    financingCashFlow: 0,
    capitalExpenditures: 0,
  };
}

/**
 * Parse CSV in the format: year,item,value
 * e.g.:
 *   2022,Revenue,5000000
 *   2022,Net Income,450000
 */
export function parseCSV(csv: string, companyName: string): FinancialData {
  const lines = csv
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const yearMap = new Map<number, YearStatement>();

  // Detect if first line is header
  let startIdx = 0;
  const firstLine = lines[0]?.toLowerCase() ?? "";
  if (firstLine.includes("year") && firstLine.includes("item")) {
    startIdx = 1;
  }

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Support comma and semicolon delimiters
    const delimiter = line.includes(";") ? ";" : ",";
    const parts = line.split(delimiter);
    if (parts.length < 3) continue;

    const yearRaw = parts[0].trim();
    const itemRaw = parts[1].trim();
    const valueRaw = parts.slice(2).join(",").trim(); // re-join in case value has commas

    const year = parseInt(yearRaw, 10);
    if (isNaN(year)) continue;

    const normalizedItem = normalizeKey(itemRaw);
    const canonicalKey = ITEM_MAP[normalizedItem];
    if (!canonicalKey) continue;

    if (!yearMap.has(year)) {
      yearMap.set(year, createEmptyStatement(year));
    }

    const stmt = yearMap.get(year)!;
    (stmt as Record<string, number>)[canonicalKey] = parseNumber(valueRaw);
  }

  // Sort statements by year
  const statements = Array.from(yearMap.values()).sort(
    (a, b) => a.year - b.year,
  );

  // Derive computed fields if missing
  for (const stmt of statements) {
    if (
      stmt.grossProfit === 0 &&
      stmt.revenue !== 0 &&
      stmt.costOfRevenue !== 0
    ) {
      stmt.grossProfit = stmt.revenue - stmt.costOfRevenue;
    }
    if (
      stmt.ebitda === 0 &&
      stmt.operatingIncome !== 0 &&
      stmt.depreciation !== 0
    ) {
      stmt.ebitda = stmt.operatingIncome + stmt.depreciation;
    }
  }

  const years = statements.map((s) => s.year);

  return {
    companyName,
    sector: "general",
    years,
    statements,
  };
}

/**
 * Load company data from /data/*.json files (Next.js public data folder).
 * Only works in Node.js / server context.
 */
export async function loadCompanyData(
  name: string,
): Promise<FinancialData | null> {
  try {
    // Dynamic import to avoid bundling issues
    const fs = await import("fs/promises");
    const path = await import("path");
    const filePath = path.join(
      process.cwd(),
      "data",
      `${name.toLowerCase().replace(/\s+/g, "_")}.json`,
    );
    const raw = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw) as FinancialData;
    return parsed;
  } catch {
    return null;
  }
}

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate that a FinancialData object has the minimum required fields.
 */
export function validateData(data: FinancialData): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.companyName || data.companyName.trim() === "") {
    errors.push({ field: "companyName", message: "Company name is required." });
  }

  if (!data.statements || data.statements.length === 0) {
    errors.push({
      field: "statements",
      message: "At least one year of financial data is required.",
    });
    return errors;
  }

  const requiredFields: (keyof YearStatement)[] = [
    "year",
    "revenue",
    "netIncome",
    "totalAssets",
    "totalEquity",
    "totalLiabilities",
    "operatingCashFlow",
  ];

  for (const stmt of data.statements) {
    for (const field of requiredFields) {
      if (stmt[field] === undefined || stmt[field] === null) {
        errors.push({
          field: `statements[${stmt.year}].${field}`,
          message: `Missing required field "${field}" for year ${stmt.year}.`,
        });
      }
    }
    if (stmt.totalAssets === 0) {
      errors.push({
        field: `statements[${stmt.year}].totalAssets`,
        message: `Total assets cannot be zero for year ${stmt.year}.`,
      });
    }
    if (stmt.revenue === 0) {
      errors.push({
        field: `statements[${stmt.year}].revenue`,
        message: `Revenue is zero for year ${stmt.year} — some ratios will not be meaningful.`,
      });
    }
  }

  return errors;
}
