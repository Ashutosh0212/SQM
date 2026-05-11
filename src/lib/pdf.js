import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const PDF_RASTER_SCALE = 2;
export const PDF_JPEG_QUALITY = 0.96;

const PDF_CAPTURE_CLONE_CSS = [
  '#page-wrapper{padding:1.25rem!important;overflow:visible!important;min-width:820px!important}',
  '#quotation-page{width:794px!important;max-width:794px!important;min-width:794px!important;min-height:1123px!important;height:auto!important;padding:0!important;box-sizing:border-box!important;background-size:794px 1123px!important;background-repeat:repeat-y!important}',
  '#quotation-page-inner{padding:248px 62px 58px!important;box-sizing:border-box!important;min-height:1123px!important;-webkit-box-decoration-break:clone!important;box-decoration-break:clone!important}',
  '.items-table-wrap{overflow-x:visible!important}.items-table{min-width:666px!important;table-layout:fixed!important}',
  '.items-table tbody td input[type=number]{min-height:28px!important;line-height:normal!important;padding:8px 4px 8px 0!important;box-sizing:border-box!important;overflow:visible!important;-webkit-appearance:none!important;appearance:none!important}',
  '.items-table tbody td.r{padding-top:7px!important;padding-bottom:9px!important;vertical-align:middle!important}',
  '.meta-row{flex-direction:row!important;align-items:flex-start!important;gap:12px!important}',
  '.meta-row .to-col{max-width:84%!important}.date-block{text-align:right!important}',
  '.footer-row{flex-direction:row!important;align-items:flex-end!important;gap:0!important}',
  '.sign-block{align-self:auto!important;max-width:none!important}.total-box{width:220px!important;max-width:none!important}',
  '.items-table col.del-col,.items-table thead th.del-col,.items-table tbody td.del-col{display:none!important;visibility:collapse!important;width:0!important;min-width:0!important;padding:0!important;border-width:0!important}',
].join('');

function injectCloneCaptureStyles(doc) {
  if (!doc?.head) return;
  const st = doc.createElement('style');
  st.setAttribute('type', 'text/css');
  st.appendChild(doc.createTextNode(PDF_CAPTURE_CLONE_CSS));
  doc.head.appendChild(st);
}

/**
 * html2canvas inconsistently renders form controls vs what you see when printing —
 * rasterize editable fields into plain markup for a stable screenshot.
 */
function prepareQuotDocCloneForPdf(doc) {
  const root = doc.getElementById('quotation-page');
  if (!root) return;

  root.querySelectorAll('textarea').forEach((ta) => {
    const div = doc.createElement('div');
    div.textContent = ta.value ?? '';
    div.setAttribute('data-pdf-ta-snapshot', '1');
    div.style.cssText =
      'display:block;width:100%;margin-bottom:6px;box-sizing:border-box;' +
      "font-family:'Inter',sans-serif;font-size:10px;line-height:1.45;" +
      'color:#0f172a;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;' +
      'padding:2px 0;border:none;background:transparent;';
    ta.parentNode?.replaceChild(div, ta);
  });

  root.querySelectorAll('input[type="text"]').forEach((inp) => {
    const span = doc.createElement('span');
    span.textContent = inp.value != null ? String(inp.value) : '';
    span.setAttribute('data-pdf-text-snapshot', '1');
    span.style.cssText =
      'display:block;width:100%;box-sizing:border-box;' +
      'white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;' +
      "font-family:'Inter',sans-serif;font-size:10px;line-height:1.4;color:#0f172a;" +
      'padding:2px 0;margin:0;';
    inp.parentNode?.replaceChild(span, inp);
  });

  root.querySelectorAll('input[type="number"]').forEach((inp) => {
    const td = inp.parentNode;
    if (!td || td.nodeName !== 'TD') return;
    const span = doc.createElement('span');
    let v = inp.value != null ? String(inp.value).trim() : '';
    if (v === '') v = String(inp.placeholder || '').trim();
    span.textContent = v;
    span.setAttribute('data-pdf-num-snapshot', '1');
    span.style.cssText =
      'display:block;width:100%;text-align:right;white-space:nowrap;overflow:visible;' +
      "font-family:'Inter',sans-serif;font-size:10px;line-height:1.65;" +
      'color:#0f172a;font-variant-numeric:tabular-nums;font-weight:400;' +
      'padding:5px 4px 6px 0;margin:0;box-sizing:border-box;';
    td.replaceChild(span, inp);
  });
}

function waitPaint(delayMs = 56) {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(resolve, delayMs);
      });
    });
  });
}

/** So html2canvas does not rasterize clipped overflow from a scrolled preview pane. */
function saveAndResetAncestorScrollHosts(startEl) {
  const saved = [];
  for (
    let el = startEl?.parentElement;
    el && el !== document.documentElement;
    el = el.parentElement
  ) {
    if (el.scrollTop || el.scrollLeft) {
      saved.push({
        el,
        top: el.scrollTop,
        left: el.scrollLeft,
      });
      el.scrollTop = 0;
      el.scrollLeft = 0;
    }
  }
  const html = document.documentElement;
  const body = document.body;
  saved.push({ el: html, top: html.scrollTop, left: html.scrollLeft });
  if (body)
    saved.push({ el: body, top: body.scrollTop, left: body.scrollLeft });
  html.scrollTop = 0;
  html.scrollLeft = 0;
  if (body) {
    body.scrollTop = 0;
    body.scrollLeft = 0;
  }
  return saved;
}

function restoreAncestorScrollHosts(saved) {
  for (let i = saved.length - 1; i >= 0; i--) {
    const { el, top, left } = saved[i];
    el.scrollTop = top;
    el.scrollLeft = left;
  }
}

/** @param {HTMLElement | null} page */
export async function buildQuotationPdfBlob(page) {
  if (!page) throw new Error('pdf-lib-missing');

  const scrollSaved = saveAndResetAncestorScrollHosts(page);
  const rootEl = document.documentElement;
  rootEl.classList.add('pdf-capture', 'pdf-capture-a4');
  window.scrollTo(0, 0);

  try {
    if (document.fonts?.ready) await document.fonts.ready.catch(() => {});
    await waitPaint(72);

    const winW = Math.max(
      window.innerWidth || 0,
      1480,
      page.scrollWidth + 120
    );
    const winH = Math.max(
      window.innerHeight || 0,
      page.scrollHeight + 620,
      2600
    );

    const canvas = await html2canvas(page, {
      scale: PDF_RASTER_SCALE,
      useCORS: true,
      allowTaint: false,
      letterRendering: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: winW,
      windowHeight: winH,
      scrollX: 0,
      scrollY: 0,
      onclone(clonedDoc) {
        const letterheadPath = `${import.meta.env.BASE_URL}letterhead-a4.png`;
        clonedDoc.documentElement.style.setProperty(
          '--quot-letterhead',
          `url("${letterheadPath}")`
        );
        injectCloneCaptureStyles(clonedDoc);
        prepareQuotDocCloneForPdf(clonedDoc);
      },
    });

    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    const cw = canvas.width;
    const ch = canvas.height;
    if (cw < 16 || ch < 16) throw new Error('pdf-canvas-empty');

    const pageSlicePx = Math.max(96, Math.round((cw * pdfH) / pdfW));
    let srcY = 0;
    let sliceIndex = 0;
    while (srcY < ch) {
      if (sliceIndex > 0) pdf.addPage();
      const cropH = Math.min(pageSlicePx, ch - srcY);
      if (cropH <= 0) break;
      sliceIndex += 1;

      const slab = document.createElement('canvas');
      slab.width = cw;
      slab.height = cropH;
      const sctx = slab.getContext('2d');
      sctx.fillStyle = '#ffffff';
      sctx.fillRect(0, 0, cw, cropH);
      sctx.drawImage(canvas, 0, srcY, cw, cropH, 0, 0, cw, cropH);
      const sliceImg = slab.toDataURL('image/jpeg', PDF_JPEG_QUALITY);
      const displayW = pdfW;
      const displayH = (cropH / cw) * pdfW;
      pdf.addImage(sliceImg, 'JPEG', 0, 0, displayW, displayH);
      srcY += cropH;
    }

    return pdf.output('blob');
  } finally {
    rootEl.classList.remove('pdf-capture', 'pdf-capture-a4');
    restoreAncestorScrollHosts(scrollSaved);
  }
}
