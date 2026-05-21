export function parseNum(v) {
  const n = parseFloat(String(v ?? '').replace(/,/g, ''));
  return Number.isNaN(n) ? 0 : n;
}

export function roundMoney(v) {
  return Math.round(v * 100) / 100;
}

export function hasStoredAmt(val) {
  return String(val ?? '').trim() !== '';
}

function lineMult(discountPct, cdPct) {
  const discMult = 1 - parseNum(discountPct) / 100;
  const cdMult = 1 - parseNum(cdPct) / 100;
  return Math.max(0, discMult * cdMult);
}

function pctFromDiscAmt(gross, amtVal) {
  if (gross <= 0) return '';
  return String(roundMoney((parseNum(amtVal) / gross) * 100));
}

function pctFromCdAmt(afterDisc, amtVal) {
  if (afterDisc <= 0) return '';
  return String(roundMoney((parseNum(amtVal) / afterDisc) * 100));
}

function grossFromTaxable(taxable, discAmt, cdPct, cdAmtStored) {
  if (hasStoredAmt(cdAmtStored)) {
    return taxable + discAmt + parseNum(cdAmtStored);
  }
  const cdMult = 1 - parseNum(cdPct) / 100;
  if (cdMult <= 0) return taxable + discAmt;
  return taxable / cdMult + discAmt;
}

/** Given line total (incl. tax), derive per-unit rate after discount & CD. */
export function rateFromAmount(amountVal, row) {
  const amount = parseNum(amountVal);
  const qty = parseNum(row.qty);
  const taxPct = parseNum(row.taxPct);
  if (qty <= 0 || amount <= 0) return '';
  const taxMult = 1 + taxPct / 100;
  const taxable = amount / taxMult;

  const discAmtStored = hasStoredAmt(row.discountAmt);
  const cdAmtStored = hasStoredAmt(row.cdAmt);

  if (discAmtStored && cdAmtStored) {
    const rate =
      (taxable + parseNum(row.discountAmt) + parseNum(row.cdAmt)) / qty;
    return String(roundMoney(rate));
  }

  if (discAmtStored) {
    const discAmt = parseNum(row.discountAmt);
    const gross = grossFromTaxable(taxable, discAmt, row.cdPct, row.cdAmt);
    return String(roundMoney(gross / qty));
  }

  if (cdAmtStored) {
    const gross = parseNum(row.rate) * qty || 0;
    const discAmt = hasStoredAmt(row.discountAmt)
      ? parseNum(row.discountAmt)
      : (gross * parseNum(row.discountPct)) / 100;
    const rate = (taxable + discAmt + parseNum(row.cdAmt)) / qty;
    return String(roundMoney(rate));
  }

  const mult = lineMult(row.discountPct, row.cdPct);
  if (mult <= 0) return '';
  const rate = amount / (qty * taxMult * mult);
  return String(roundMoney(rate));
}

/** Plain number string for editing (no commas / forced decimals). */
export function amountPlainStr(n) {
  if (!n) return '';
  const r = roundMoney(n);
  return Number.isInteger(r) ? String(r) : String(r);
}

export function discAmtEditStr(row, computed) {
  if (hasStoredAmt(row.discountAmt)) {
    return amountPlainStr(parseNum(row.discountAmt));
  }
  return amountPlainStr(computed);
}

export function cdAmtEditStr(row, computed) {
  if (hasStoredAmt(row.cdAmt)) {
    return amountPlainStr(parseNum(row.cdAmt));
  }
  return amountPlainStr(computed);
}

/** String for amount input — derived from rate × qty + tax. */
export function amountEditStr(row) {
  const { amount } = poRowCalc(row);
  return amountPlainStr(amount);
}

/** Scale line rates so row amounts sum to the entered grand total. */
export function rowsFromGrandTotal(rows, grandTotalVal) {
  const target = parseNum(grandTotalVal);
  if (target <= 0) return rows;
  const { amount: current } = poTotals(rows);
  if (current <= 0) {
    if (rows.length === 1) {
      const row = rows[0];
      return [
        {
          ...row,
          rate: rateFromAmount(String(target), row),
        },
      ];
    }
    return rows;
  }
  return rows.map((row) => {
    const c = poRowCalc(row);
    const share = (c.amount / current) * target;
    return {
      ...row,
      rate: rateFromAmount(String(roundMoney(share)), row),
    };
  });
}

export function poRowCalc(row) {
  const qty = parseNum(row.qty) || 0;
  const rate = parseNum(row.rate);
  const taxPct = parseNum(row.taxPct) || 0;
  const discountPct = parseNum(row.discountPct) || 0;
  const cdPct = parseNum(row.cdPct) || 0;
  const gross = rate * qty;
  const discAmt = hasStoredAmt(row.discountAmt)
    ? parseNum(row.discountAmt)
    : (gross * discountPct) / 100;
  const afterDisc = gross - discAmt;
  const cdAmt = hasStoredAmt(row.cdAmt)
    ? parseNum(row.cdAmt)
    : (afterDisc * cdPct) / 100;
  const taxable = afterDisc - cdAmt;
  const tax = (taxable * taxPct) / 100;
  const amount = taxable + tax;
  return {
    qty,
    rate,
    taxPct,
    discountPct,
    cdPct,
    gross,
    discAmt,
    cdAmt,
    taxable,
    tax,
    amount,
  };
}

export function poTotals(rows) {
  let taxable = 0;
  let tax = 0;
  let amount = 0;
  let qtySum = 0;
  let discSum = 0;
  let cdSum = 0;
  rows.forEach((row) => {
    const c = poRowCalc(row);
    taxable += c.taxable;
    tax += c.tax;
    amount += c.amount;
    qtySum += c.qty;
    discSum += c.discAmt;
    cdSum += c.cdAmt;
  });
  const cgst = tax / 2;
  const sgst = tax / 2;
  return { taxable, tax, amount, cgst, sgst, qtySum, discSum, cdSum };
}

export function fmtPoNum(n) {
  const rounded = Math.round(n * 100) / 100;
  return rounded.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function fmtPoMoney(n) {
  return '₹ ' + fmtPoNum(n);
}

/** Apply row field update with discount/CD amount ↔ percent sync. */
export function applyPoRowField(row, field, value) {
  let next = { ...row, [field]: value };

  if (field === 'discountAmt') {
    const gross = parseNum(next.rate) * parseNum(next.qty);
    return {
      ...next,
      discountPct: pctFromDiscAmt(gross, value),
    };
  }
  if (field === 'discountPct') {
    return { ...next, discountAmt: '' };
  }
  if (field === 'cdAmt') {
    const gross = parseNum(next.rate) * parseNum(next.qty);
    const discAmt = hasStoredAmt(next.discountAmt)
      ? parseNum(next.discountAmt)
      : (gross * parseNum(next.discountPct)) / 100;
    return {
      ...next,
      cdPct: pctFromCdAmt(gross - discAmt, value),
    };
  }
  if (field === 'cdPct') {
    return { ...next, cdAmt: '' };
  }
  if (field === 'amount') {
    return { ...next, rate: rateFromAmount(value, next) };
  }
  if (field === 'rate' || field === 'qty') {
    if (hasStoredAmt(next.discountAmt)) {
      const gross = parseNum(next.rate) * parseNum(next.qty);
      next = { ...next, discountPct: pctFromDiscAmt(gross, next.discountAmt) };
    }
    if (hasStoredAmt(next.cdAmt)) {
      const gross = parseNum(next.rate) * parseNum(next.qty);
      const discAmt = hasStoredAmt(next.discountAmt)
        ? parseNum(next.discountAmt)
        : (gross * parseNum(next.discountPct)) / 100;
      next = { ...next, cdPct: pctFromCdAmt(gross - discAmt, next.cdAmt) };
    }
  }

  return next;
}
