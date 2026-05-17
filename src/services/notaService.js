// ============================================================
//  notaService.js  –  Canvas-based nota generator
//  Tidak menggunakan html2canvas / DOM rendering
//  Zoom browser tidak berpengaruh pada hasil gambar
// ============================================================

export const notaService = {

  // ----------------------------------------------------------
  //  DATA HELPERS
  // ----------------------------------------------------------

  generateNotaData(proyek) {
    const totalHarga  = proyek.total_harga  || 0
    const dpDibayar   = proyek.dp_dibayar   || 0
    const sisaTagihan = totalHarga - dpDibayar
    const brand       = proyek.brand || 'SERAGAMAN'

    let backgroundImage = ''
    let lunasImage      = ''

    if (brand === 'CLOTHINGWELL') {
      backgroundImage = '/src/assets/nota_clothingwell.jpg'
      lunasImage      = '/src/assets/label_lunas_clothingwell.png'
    } else if (brand === 'KAMPUS APPAREL') {
      backgroundImage = '/src/assets/nota_kampusapparel.jpg'
      lunasImage      = '/src/assets/label_lunas_kampusapparel.png'
    } else {
      backgroundImage = '/src/assets/nota_seragaman.jpg'
      lunasImage      = '/src/assets/label_lunas_seragaman.png'
    }

    return {
      brand,
      backgroundImage,
      lunasImage,
      totalHarga,
      dpDibayar,
      sisaTagihan,
      notaNumber: proyek.nota_number || `INV-${Date.now()}`,
    }
  },

  getTglLong(tanggalOrder) {
    const d = tanggalOrder ? new Date(tanggalOrder) : new Date()
    const months = [
      'JANUARI','FEBRUARI','MARET','APRIL','MEI','JUNI',
      'JULI','AGUSTUS','SEPTEMBER','OKTOBER','NOVEMBER','DESEMBER',
    ]
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
  },

  getTglDDMMYYYY(tanggalOrder) {
    const d  = tanggalOrder ? new Date(tanggalOrder) : new Date()
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    return `${dd} / ${mm} / ${d.getFullYear()}`
  },

  formatRupiah(angka) {
    return `Rp ${Math.round(angka || 0).toLocaleString('id-ID')}`
  },

  // Tetap dipakai untuk preview HTML di modal (tidak untuk download)
  escapeHtml(str) {
    if (!str) return ''
    return String(str).replace(/[&<>]/g, m =>
      m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;'
    )
  },

  // ----------------------------------------------------------
  //  HTML TEMPLATE  –  dipakai hanya untuk PREVIEW di modal
  // ----------------------------------------------------------

  buildProdukRows(produkList) {
    let rows = ''
    for (const p of (produkList || [])) {
      const subtotal = p.jumlah_pcs * p.harga_satuan
      rows += `
        <tr>
          <td style="padding:7px 6px;text-align:left;">${this.escapeHtml(p.nama_produk)}</td>
          <td style="padding:7px 6px;text-align:center;">${p.jumlah_pcs.toLocaleString('id-ID')}</td>
          <td style="padding:7px 6px;text-align:right;">${this.formatRupiah(p.harga_satuan)}</td>
          <td style="padding:7px 6px;text-align:right;">${this.formatRupiah(subtotal)}</td>
        </tr>`
    }
    return rows
  },

  generateEmptyRows(count) {
    let rows = ''
    for (let i = 0; i < count; i++) {
      rows += `<tr>
        <td style="padding:7px 6px;">&nbsp;</td>
        <td style="padding:7px 6px;"></td>
        <td style="padding:7px 6px;"></td>
        <td style="padding:7px 6px;"></td>
      </tr>`
    }
    return rows
  },

  getHtmlTemplate(proyek, notaData) {
    const {
      brand, backgroundImage, lunasImage,
      totalHarga, dpDibayar, sisaTagihan, notaNumber,
    } = notaData

    const client      = this.escapeHtml(proyek.nama_client  || '-')
    const noWa        = this.escapeHtml(proyek.no_wa        || '-')
    const proyekName  = this.escapeHtml(proyek.nama_proyek  || 'INVOICE')
    const organisasi  = this.escapeHtml(proyek.organisasi   || '-')
    const instansi    = this.escapeHtml(proyek.instansi     || '-')
    const jabatan     = this.escapeHtml(proyek.jabatan      || '-')
    const sumberInfo  = this.escapeHtml(proyek.sumber_info  || '-')
    const produkList  = proyek.produk_list || []
    const filledRows  = produkList.length || 1
    const emptyNeeded = Math.max(0, 5 - filledRows)
    const produkRows  = this.buildProdukRows(produkList) + this.generateEmptyRows(emptyNeeded)

    if (brand === 'SERAGAMAN') {
      const tableTop = 248
      const totalTop = tableTop + 44 + (filledRows + emptyNeeded) * 30 + 8
      return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:Arial,sans-serif;background:#e0e0e0;display:flex;flex-direction:column;align-items:center;gap:14px;padding:20px;}
        .nota-container{position:relative;width:600px;}
        .nota-container img.bg{width:100%;display:block;}
        .nota-content{position:absolute;top:0;left:0;width:100%;height:100%;}
        .client-name{position:absolute;top:192px;left:42px;font-size:15px;font-weight:700;}
        .client-wa{position:absolute;top:212px;left:42px;font-size:13px;color:#555;}
        .order-right{position:absolute;top:186px;right:42px;text-align:right;}
        .order-right .judul{color:#cc0000;font-weight:900;font-size:15px;}
        .order-right .tgl{font-weight:600;font-size:13px;margin-top:4px;}
        .nota-number{position:absolute;top:235px;right:42px;font-size:11px;color:#666;font-family:monospace;}
        .table-wrap{position:absolute;top:${tableTop}px;left:42px;right:42px;}
        .table-wrap table{width:100%;font-size:13px;border-collapse:collapse;}
        .table-wrap th{background:#1a1a1a;color:#f59e0b;border:1px solid #555;padding:8px 6px;}
        .table-wrap td{border:1px solid #ccc;padding:7px 6px;}
        .total-wrap{position:absolute;top:${totalTop}px;right:42px;}
        .total-table{min-width:270px;font-size:13px;border-collapse:collapse;}
        .total-table td{padding:7px 12px;border:1px solid #555;}
        .total-table td:last-child{text-align:right;}
        .row-subtotal td{background:#1a1a1a;color:#f59e0b;font-weight:700;}
        .row-dp td{background:#1a1a1a;color:#fff;}
        .row-pelunasan td{background:#1a1a1a;color:#fff;}
        .row-kekurangan td{background:#f59e0b;color:#000;font-weight:700;}
        .data-pemesan{position:absolute;top:646px;left:42px;font-size:11px;line-height:2;color:#333;}
        .label-lunas{position:absolute;bottom:6%;right:10%;width:226px;opacity:0.92;}
        @media print{body{padding:0;background:#fff;gap:0;}}
      </style></head><body>
        <div class="nota-container">
          <img class="bg" src="${backgroundImage}"/>
          <div class="nota-content">
            <div class="client-name">${client}</div>
            <div class="client-wa">WA : ${noWa}</div>
            <div class="nota-number">No. Nota: ${notaNumber}</div>
            <div class="order-right">
              <div class="judul">${proyekName}</div>
              <div class="tgl">TANGGAL : ${this.getTglLong(proyek.tanggal_order)}</div>
            </div>
            <div class="table-wrap">
              <table><thead><tr><th>ITEM</th><th>JUMLAH</th><th>HARGA</th><th>TOTAL</th></tr></thead>
              <tbody>${produkRows}</tbody></table>
            </div>
            <div class="total-wrap">
              <table class="total-table">
                <tr class="row-subtotal"><td>SUB TOTAL</td><td>${this.formatRupiah(totalHarga)}</td></tr>
                <tr class="row-dp"><td>DP 1</td><td>${this.formatRupiah(dpDibayar)}</td></tr>
                <tr class="row-pelunasan"><td>PELUNASAN</td><td>-</td></tr>
                <tr class="row-kekurangan"><td>KEKURANGAN</td><td>${sisaTagihan <= 0 ? 'LUNAS' : this.formatRupiah(sisaTagihan)}</td></tr>
              </table>
            </div>
            <div class="data-pemesan">
              <div>ORGANISASI : ${organisasi}</div>
              <div>PERUSAHAAN/KAMPUS : ${instansi}</div>
              <div>JABATAN DI ORGANISASI : ${jabatan}</div>
              <div>TAU SERAGAMAN DARI : ${sumberInfo}</div>
            </div>
            ${sisaTagihan <= 0 ? `<img class="label-lunas" src="${lunasImage}" alt="LUNAS"/>` : ''}
          </div>
        </div>
      </body></html>`
    }

    if (brand === 'CLOTHINGWELL') {
      const tableTop = 300
      const totalTop = tableTop + 44 + (filledRows + emptyNeeded) * 30 + 8
      return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:Arial,sans-serif;background:#e0e0e0;display:flex;flex-direction:column;align-items:center;gap:14px;padding:20px;}
        .nota-container{position:relative;width:600px;}
        .nota-container img.bg{width:100%;display:block;}
        .nota-content{position:absolute;top:0;left:0;width:100%;height:100%;}
        .order-title{position:absolute;top:196px;left:42px;color:#cc0000;font-weight:900;font-size:16px;}
        .client-name{position:absolute;top:220px;left:42px;font-weight:700;font-size:15px;}
        .client-wa{position:absolute;top:241px;left:42px;font-size:13px;}
        .nota-number{position:absolute;top:196px;right:42px;font-size:11px;color:#666;font-family:monospace;}
        .tgl-right{position:absolute;top:220px;right:42px;text-align:right;font-size:13px;line-height:1.9;}
        .table-wrap{position:absolute;top:${tableTop}px;left:42px;right:42px;}
        .table-wrap table{width:100%;font-size:13px;border-collapse:collapse;}
        .table-wrap th{background:#f5e800;color:#111;border:1px solid #aaa;padding:8px 6px;}
        .table-wrap td{border:1px solid #ccc;padding:7px 6px;}
        .total-wrap{position:absolute;top:${totalTop}px;right:42px;}
        .total-table{min-width:280px;font-size:13px;border-collapse:collapse;}
        .total-table td{padding:7px 12px;border:1px solid #bbb;}
        .total-table td:last-child{text-align:right;}
        .row-total td{background:#f5f5f5;}
        .row-dp td{background:#f5e800;font-weight:600;}
        .row-kekurangan td{background:#f5e800;font-weight:700;font-style:italic;}
        .data-pemesan{position:absolute;top:645px;left:62px;font-size:11px;line-height:1.3;}
        .dp-underline{font-weight:700;text-decoration:underline;margin-bottom:2px;font-size:12px;}
        .label-lunas{position:absolute;bottom:19%;right:49%;width:126px;opacity:0.92;}
        @media print{body{padding:0;background:#fff;gap:0;}}
      </style></head><body>
        <div class="nota-container">
          <img class="bg" src="${backgroundImage}"/>
          <div class="nota-content">
            <div class="order-title">${proyekName}</div>
            <div class="nota-number">No. Nota: ${notaNumber}</div>
            <div class="client-name">${client}</div>
            <div class="client-wa">WA : ${noWa}</div>
            <div class="tgl-right">
              <div>Tanggal : ${this.getTglDDMMYYYY(proyek.tanggal_order)}</div>
              <div>Jenis Order : ${proyekName}</div>
            </div>
            <div class="table-wrap">
              <table><thead><tr><th>JENIS PESANAN</th><th>JUMLAH</th><th>HARGA</th><th>TOTAL</th></tr></thead>
              <tbody>${produkRows}</tbody></table>
            </div>
            <div class="total-wrap">
              <table class="total-table">
                <tr class="row-total"><td>TOTAL</td><td>${this.formatRupiah(totalHarga)}</td></tr>
                <tr class="row-dp"><td>DP CASH/TF</td><td>${this.formatRupiah(dpDibayar)}</td></tr>
                <tr class="row-kekurangan"><td>KEKURANGAN</td><td>${sisaTagihan <= 0 ? 'LUNAS' : this.formatRupiah(sisaTagihan)}</td></tr>
              </table>
            </div>
            <div class="data-pemesan">
              <div class="dp-underline">DATA PEMESAN</div>
              <div>ORGANISASI : ${organisasi}</div>
              <div>INSTANSI : ${instansi}</div>
              <div>JABATAN : ${jabatan}</div>
              <div>SUMBER INFO : ${sumberInfo}</div>
            </div>
            ${sisaTagihan <= 0 ? `<img class="label-lunas" src="${lunasImage}" alt="LUNAS"/>` : ''}
          </div>
        </div>
      </body></html>`
    }

    // KAMPUS APPAREL
    const tableTop = 325
    const totalTop = tableTop + 44 + (filledRows + emptyNeeded) * 30 + 8
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
      *{margin:0;padding:0;box-sizing:border-box;}
      body{font-family:Arial,sans-serif;background:#e0e0e0;display:flex;flex-direction:column;align-items:center;gap:14px;padding:20px;}
      .nota-container{position:relative;width:600px;}
      .nota-container img.bg{width:100%;display:block;}
      .nota-content{position:absolute;top:0;left:0;width:100%;height:100%;}
      .info-klien{position:absolute;top:123px;left:30px;width:46%;}
      .info-klien table{width:100%;font-size:13px;border-collapse:collapse;}
      .info-klien td{border:1px solid #aaa;padding:6px 8px;}
      .info-klien .lbl{font-weight:700;background:#cff4fc;width:100px;}
      .nota-number{position:absolute;top:145px;right:129px;font-size:11px;color:#666;font-family:monospace;}
      .order-right{position:absolute;top:153px;left:54%;right:30px;}
      .order-right .judul{color:#cc0000;font-weight:900;font-size:17px;margin-bottom:6px;}
      .order-right .tgl{color:#0077b6;font-weight:700;font-size:14px;}
      .table-wrap{position:absolute;top:${tableTop}px;left:30px;right:28px;}
      .table-wrap table{width:100%;font-size:13px;border-collapse:collapse;}
      .table-wrap th{background:#00b4d8;color:#fff;border:1px solid #aaa;padding:8px 6px;}
      .table-wrap td{border:1px solid #ccc;padding:7px 6px;}
      .total-wrap{position:absolute;top:${totalTop}px;right:30px;}
      .total-table{min-width:280px;font-size:13px;border-collapse:collapse;}
      .total-table td{padding:7px 12px;border:1px solid #bbb;}
      .total-table td:last-child{text-align:right;}
      .row-subtotal td{background:#cff4fc;font-weight:600;}
      .row-dp td{background:#cff4fc;}
      .row-kekurangan td{background:#cff4fc;font-weight:700;font-size:14px;}
      .label-lunas{position:absolute;bottom:22%;right:48%;width:113px;opacity:0.92;}
      @media print{body{padding:0;background:#fff;gap:0;}}
    </style></head><body>
      <div class="nota-container">
        <img class="bg" src="${backgroundImage}"/>
        <div class="nota-content">
          <div class="info-klien">
            <table>
              <tr><td class="lbl">NAMA KLIEN</td><td>${client}</td></tr>
              <tr><td class="lbl">WHATSAPP</td><td>${noWa}</td></tr>
              <tr><td class="lbl">ORGANISASI</td><td>${organisasi}</td></tr>
              <tr><td class="lbl">INSTANSI</td><td>${instansi}</td></tr>
              <tr><td class="lbl">JABATAN</td><td>${jabatan}</td></tr>
              <tr><td class="lbl">SUMBER INFO</td><td>${sumberInfo}</td></tr>
              <tr><td class="lbl">JENIS PRODUK</td><td>${proyekName}</td></tr>
            </table>
          </div>
          <div class="nota-number">No. Nota: ${notaNumber}</div>
          <div class="order-right">
            <div class="judul">${proyekName}</div>
            <div class="tgl">TANGGAL : ${this.getTglDDMMYYYY(proyek.tanggal_order)}</div>
          </div>
          <div class="table-wrap">
            <table><thead><tr><th>BARANG</th><th>JUMLAH</th><th>HARGA</th><th>TOTAL</th></tr></thead>
            <tbody>${produkRows}</tbody></table>
          </div>
          <div class="total-wrap">
            <table class="total-table">
              <tr class="row-subtotal"><td>SUB TOTAL</td><td>${this.formatRupiah(totalHarga)}</td></tr>
              <tr class="row-dp"><td>DP CASH/TF</td><td>${this.formatRupiah(dpDibayar)}</td></tr>
              <tr class="row-kekurangan"><td>KEKURANGAN</td><td>${sisaTagihan <= 0 ? '-' : this.formatRupiah(sisaTagihan)}</td></tr>
            </table>
          </div>
          ${sisaTagihan <= 0 ? `<img class="label-lunas" src="${lunasImage}" alt="LUNAS"/>` : ''}
        </div>
      </div>
    </body></html>`
  },

  // ----------------------------------------------------------
  //  CANVAS GENERATOR  –  dipakai untuk DOWNLOAD & COPY
  //  Tidak bergantung pada DOM / browser zoom sama sekali
  // ----------------------------------------------------------

  /**
   * Load image dari URL, return HTMLImageElement yang sudah load
   */
  _loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload  = () => resolve(img)
      img.onerror = () => reject(new Error(`Gagal load gambar: ${src}`))
      // Tambahkan cache-buster agar browser tidak pakai cache yang corrupt
      img.src = src + (src.includes('?') ? '&' : '?') + '_cb=' + Date.now()
    })
  },

  /**
   * Gambar rect dengan fill + stroke di canvas
   */
  _rect(ctx, x, y, w, h, fillColor, strokeColor = null) {
    ctx.fillStyle = fillColor
    ctx.fillRect(x, y, w, h)
    if (strokeColor) {
      ctx.strokeStyle = strokeColor
      ctx.lineWidth   = 1
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1)
    }
  },

  /**
   * Tulis teks dengan align: 'left' | 'center' | 'right'
   * x adalah titik referensi sesuai align
   */
  _text(ctx, str, x, y, { size = 13, bold = false, color = '#000000', align = 'left', font = 'Arial' } = {}) {
    ctx.font      = `${bold ? '700' : '400'} ${size}px ${font}`
    ctx.fillStyle = color
    ctx.textAlign = align
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(String(str ?? ''), x, y)
  },

  /**
   * Gambar baris tabel produk
   * cols: array of { text, x, w, align }
   */
  _tableRow(ctx, cols, y, rowH, bgColor, borderColor = '#cccccc') {
    // Background baris
    cols.forEach(col => {
      this._rect(ctx, col.x, y, col.w, rowH, bgColor, borderColor)
    })
    // Teks tiap kolom
    cols.forEach(col => {
      const tx = col.align === 'right'  ? col.x + col.w - 7
               : col.align === 'center' ? col.x + col.w / 2
               : col.x + 7
      this._text(ctx, col.text, tx, y + rowH * 0.68, {
        size: 12, color: col.color || '#000000',
        bold: col.bold || false, align: col.align || 'left',
      })
    })
  },

  // ----------------------------------------------------------
  //  SERAGAMAN
  // ----------------------------------------------------------
  async _canvasSeragaman(proyek, notaData) {
    const { backgroundImage, lunasImage, totalHarga, dpDibayar, sisaTagihan, notaNumber } = notaData

    const bg = await this._loadImage(backgroundImage)

    // Canvas ukuran fixed 600px lebar, tinggi proporsional dari gambar asli
    const W     = 600
    const SCALE = 3
    const H     = Math.round(bg.naturalHeight * (W / bg.naturalWidth))

    const canvas  = document.createElement('canvas')
    canvas.width  = W * SCALE
    canvas.height = H * SCALE

    const ctx = canvas.getContext('2d')
    ctx.scale(SCALE, SCALE)

    // Background
    ctx.drawImage(bg, 0, 0, W, H)

    const client     = proyek.nama_client  || '-'
    const noWa       = proyek.no_wa        || '-'
    const proyekName = proyek.nama_proyek  || 'INVOICE'
    const organisasi = proyek.organisasi   || '-'
    const instansi   = proyek.instansi     || '-'
    const jabatan    = proyek.jabatan      || '-'
    const sumberInfo = proyek.sumber_info  || '-'
    const produkList = proyek.produk_list  || []

    // ── Header kiri ──
    this._text(ctx, client, 42, 205, { size: 15, bold: true })
    this._text(ctx, `WA : ${noWa}`, 42, 222, { size: 13, color: '#555555' })

    // ── Header kanan ──
    this._text(ctx, proyekName, W - 42, 200, { size: 15, bold: true, color: '#cc0000', align: 'right' })
    this._text(ctx, `TANGGAL : ${this.getTglLong(proyek.tanggal_order)}`, W - 42, 218, { size: 13, bold: true, align: 'right' })
    this._text(ctx, `No. Nota: ${notaNumber}`, W - 42, 240, { size: 10, color: '#666666', align: 'right', font: 'monospace' })

    // ── Tabel produk ──
    const TABLE_LEFT  = 42
    const TABLE_RIGHT = W - 42
    const TABLE_W     = TABLE_RIGHT - TABLE_LEFT
    const TABLE_TOP   = 252
    const HEADER_H    = 32
    const ROW_H       = 30

    // Definisi kolom: x relatif, w
    const cols = [
      { key: 'item',    label: 'ITEM',    x: TABLE_LEFT,           w: 196, align: 'left'   },
      { key: 'jumlah',  label: 'JUMLAH',  x: TABLE_LEFT + 196,     w: 114, align: 'center' },
      { key: 'harga',   label: 'HARGA',   x: TABLE_LEFT + 310,     w: 118, align: 'right'  },
      { key: 'total',   label: 'TOTAL',   x: TABLE_LEFT + 428,     w: TABLE_W - 428, align: 'right' },
    ]

    // Header tabel
    cols.forEach(col => {
      this._rect(ctx, col.x, TABLE_TOP, col.w, HEADER_H, '#1a1a1a', '#555555')
    })
    cols.forEach(col => {
      const tx = col.align === 'right'  ? col.x + col.w - 7
               : col.align === 'center' ? col.x + col.w / 2
               : col.x + 7
      this._text(ctx, col.label, tx, TABLE_TOP + HEADER_H * 0.68, {
        size: 12, bold: true, color: '#f59e0b', align: col.align,
      })
    })

    // Baris produk
    const filledRows  = produkList.length || 0
    const emptyNeeded = Math.max(0, 5 - filledRows)
    const allRows     = [
      ...produkList.map(p => ({
        item:   p.nama_produk,
        jumlah: p.jumlah_pcs.toLocaleString('id-ID'),
        harga:  this.formatRupiah(p.harga_satuan),
        total:  this.formatRupiah(p.jumlah_pcs * p.harga_satuan),
      })),
      ...Array(emptyNeeded).fill({ item: '', jumlah: '', harga: '', total: '' }),
    ]

    allRows.forEach((row, ri) => {
      const y  = TABLE_TOP + HEADER_H + ri * ROW_H
      const bg = ri % 2 === 0 ? '#ffffff' : '#f9f9f9'
      cols.forEach(col => {
        this._rect(ctx, col.x, y, col.w, ROW_H, bg, '#cccccc')
        const tx = col.align === 'right'  ? col.x + col.w - 7
                 : col.align === 'center' ? col.x + col.w / 2
                 : col.x + 7
        this._text(ctx, row[col.key] || '', tx, y + ROW_H * 0.68, { size: 12, align: col.align })
      })
    })

    // ── Tabel total ──
    const TOTAL_TOP   = TABLE_TOP + HEADER_H + allRows.length * ROW_H + 14
    const TOTAL_W     = 280
    const TOTAL_LEFT  = W - 42 - TOTAL_W
    const TOTAL_ROW_H = 32

    const totalRows = [
      { label: 'SUB TOTAL',  value: this.formatRupiah(totalHarga),   bg: '#1a1a1a', fg: '#f59e0b', bold: true  },
      { label: 'DP 1',       value: this.formatRupiah(dpDibayar),    bg: '#1a1a1a', fg: '#ffffff', bold: false },
      { label: 'PELUNASAN',  value: '-',                              bg: '#1a1a1a', fg: '#ffffff', bold: false },
      {
        label: 'KEKURANGAN',
        value: sisaTagihan <= 0 ? 'LUNAS' : this.formatRupiah(sisaTagihan),
        bg: '#f59e0b', fg: '#000000', bold: true,
      },
    ]

    totalRows.forEach((row, i) => {
      const y = TOTAL_TOP + i * TOTAL_ROW_H
      this._rect(ctx, TOTAL_LEFT, y, TOTAL_W, TOTAL_ROW_H, row.bg, '#555555')
      this._text(ctx, row.label, TOTAL_LEFT + 10,        y + TOTAL_ROW_H * 0.68, { size: 12, bold: row.bold, color: row.fg })
      this._text(ctx, row.value, TOTAL_LEFT + TOTAL_W - 10, y + TOTAL_ROW_H * 0.68, { size: 12, bold: row.bold, color: row.fg, align: 'right' })
    })

    // ── Data pemesan ──
    const DATA_TOP = TOTAL_TOP + totalRows.length * TOTAL_ROW_H + 24
    const dataPemesan = [
      `ORGANISASI : ${organisasi}`,
      `PERUSAHAAN/KAMPUS : ${instansi}`,
      `JABATAN DI ORGANISASI : ${jabatan}`,
      `TAU SERAGAMAN DARI : ${sumberInfo}`,
    ]
    dataPemesan.forEach((line, i) => {
      this._text(ctx, line, 42, DATA_TOP + i * 22, { size: 11, color: '#333333' })
    })

    // ── Label LUNAS ──
    if (sisaTagihan <= 0) {
      try {
        const lunas = await this._loadImage(lunasImage)
        const lw    = 226
        const lh    = Math.round(lunas.naturalHeight * (lw / lunas.naturalWidth))
        ctx.globalAlpha = 0.92
        ctx.drawImage(lunas, W - 42 - lw, H - lh - Math.round(H * 0.06), lw, lh)
        ctx.globalAlpha = 1
      } catch (e) {
        console.warn('Label lunas gagal load', e)
      }
    }

    return canvas
  },

  // ----------------------------------------------------------
  //  CLOTHINGWELL
  // ----------------------------------------------------------
  async _canvasClothingwell(proyek, notaData) {
    const { backgroundImage, lunasImage, totalHarga, dpDibayar, sisaTagihan, notaNumber } = notaData

    const bg = await this._loadImage(backgroundImage)

    const W     = 600
    const SCALE = 3
    const H     = Math.round(bg.naturalHeight * (W / bg.naturalWidth))

    const canvas  = document.createElement('canvas')
    canvas.width  = W * SCALE
    canvas.height = H * SCALE

    const ctx = canvas.getContext('2d')
    ctx.scale(SCALE, SCALE)
    ctx.drawImage(bg, 0, 0, W, H)

    const client     = proyek.nama_client  || '-'
    const noWa       = proyek.no_wa        || '-'
    const proyekName = proyek.nama_proyek  || 'INVOICE'
    const organisasi = proyek.organisasi   || '-'
    const instansi   = proyek.instansi     || '-'
    const jabatan    = proyek.jabatan      || '-'
    const sumberInfo = proyek.sumber_info  || '-'
    const produkList = proyek.produk_list  || []

    // ── Header ──
    this._text(ctx, proyekName,                                   42, 210, { size: 16, bold: true, color: '#cc0000' })
    this._text(ctx, client,                                        42, 232, { size: 15, bold: true })
    this._text(ctx, `WA : ${noWa}`,                               42, 252, { size: 13 })
    this._text(ctx, `No. Nota: ${notaNumber}`,                   W - 42, 210, { size: 10, color: '#666666', align: 'right', font: 'monospace' })
    this._text(ctx, `Tanggal : ${this.getTglDDMMYYYY(proyek.tanggal_order)}`, W - 42, 232, { size: 13, align: 'right' })
    this._text(ctx, `Jenis Order : ${proyekName}`,               W - 42, 250, { size: 13, align: 'right' })

    // ── Tabel produk ──
    const TABLE_LEFT  = 42
    const TABLE_RIGHT = W - 42
    const TABLE_W     = TABLE_RIGHT - TABLE_LEFT
    const TABLE_TOP   = 300
    const HEADER_H    = 32
    const ROW_H       = 30

    const cols = [
      { key: 'item',   label: 'JENIS PESANAN', x: TABLE_LEFT,       w: 196, align: 'left'   },
      { key: 'jumlah', label: 'JUMLAH',         x: TABLE_LEFT + 196, w: 114, align: 'center' },
      { key: 'harga',  label: 'HARGA',          x: TABLE_LEFT + 310, w: 118, align: 'right'  },
      { key: 'total',  label: 'TOTAL',          x: TABLE_LEFT + 428, w: TABLE_W - 428, align: 'right' },
    ]

    cols.forEach(col => this._rect(ctx, col.x, TABLE_TOP, col.w, HEADER_H, '#f5e800', '#aaaaaa'))
    cols.forEach(col => {
      const tx = col.align === 'right'  ? col.x + col.w - 7
               : col.align === 'center' ? col.x + col.w / 2
               : col.x + 7
      this._text(ctx, col.label, tx, TABLE_TOP + HEADER_H * 0.68, { size: 12, bold: true, color: '#111111', align: col.align })
    })

    const filledRows  = produkList.length || 0
    const emptyNeeded = Math.max(0, 5 - filledRows)
    const allRows     = [
      ...produkList.map(p => ({
        item:   p.nama_produk,
        jumlah: p.jumlah_pcs.toLocaleString('id-ID'),
        harga:  this.formatRupiah(p.harga_satuan),
        total:  this.formatRupiah(p.jumlah_pcs * p.harga_satuan),
      })),
      ...Array(emptyNeeded).fill({ item: '', jumlah: '', harga: '', total: '' }),
    ]

    allRows.forEach((row, ri) => {
      const y  = TABLE_TOP + HEADER_H + ri * ROW_H
      const bg = ri % 2 === 0 ? '#ffffff' : '#f9f9f9'
      cols.forEach(col => {
        this._rect(ctx, col.x, y, col.w, ROW_H, bg, '#cccccc')
        const tx = col.align === 'right'  ? col.x + col.w - 7
                 : col.align === 'center' ? col.x + col.w / 2
                 : col.x + 7
        this._text(ctx, row[col.key] || '', tx, y + ROW_H * 0.68, { size: 12, align: col.align })
      })
    })

    // ── Tabel total ──
    const TOTAL_TOP   = TABLE_TOP + HEADER_H + allRows.length * ROW_H + 14
    const TOTAL_W     = 280
    const TOTAL_LEFT  = W - 42 - TOTAL_W
    const TOTAL_ROW_H = 32

    const totalRows = [
      { label: 'TOTAL',      value: this.formatRupiah(totalHarga),  bg: '#f5f5f5', fg: '#000000', bold: false },
      { label: 'DP CASH/TF', value: this.formatRupiah(dpDibayar),   bg: '#f5e800', fg: '#000000', bold: true  },
      {
        label: 'KEKURANGAN',
        value: sisaTagihan <= 0 ? 'LUNAS' : this.formatRupiah(sisaTagihan),
        bg: '#f5e800', fg: '#000000', bold: true,
      },
    ]

    totalRows.forEach((row, i) => {
      const y = TOTAL_TOP + i * TOTAL_ROW_H
      this._rect(ctx, TOTAL_LEFT, y, TOTAL_W, TOTAL_ROW_H, row.bg, '#bbbbbb')
      this._text(ctx, row.label, TOTAL_LEFT + 10,             y + TOTAL_ROW_H * 0.68, { size: 12, bold: row.bold, color: row.fg })
      this._text(ctx, row.value, TOTAL_LEFT + TOTAL_W - 10,  y + TOTAL_ROW_H * 0.68, { size: 12, bold: row.bold, color: row.fg, align: 'right' })
    })

    // ── Data pemesan ──
    const DATA_TOP = TOTAL_TOP + totalRows.length * TOTAL_ROW_H + 24
    this._text(ctx, 'DATA PEMESAN', 62, DATA_TOP,        { size: 12, bold: true, color: '#000000' })
    this._text(ctx, `ORGANISASI : ${organisasi}`, 62, DATA_TOP + 20,  { size: 11 })
    this._text(ctx, `INSTANSI : ${instansi}`,     62, DATA_TOP + 36,  { size: 11 })
    this._text(ctx, `JABATAN : ${jabatan}`,       62, DATA_TOP + 52,  { size: 11 })
    this._text(ctx, `SUMBER INFO : ${sumberInfo}`,62, DATA_TOP + 68,  { size: 11 })

    // ── Label LUNAS ──
    if (sisaTagihan <= 0) {
      try {
        const lunas = await this._loadImage(lunasImage)
        const lw    = 126
        const lh    = Math.round(lunas.naturalHeight * (lw / lunas.naturalWidth))
        ctx.globalAlpha = 0.92
        // posisi: bottom 19%, right 49% dari lebar
        ctx.drawImage(lunas, W * 0.51 - lw / 2, H - H * 0.19 - lh, lw, lh)
        ctx.globalAlpha = 1
      } catch (e) {
        console.warn('Label lunas gagal load', e)
      }
    }

    return canvas
  },

  // ----------------------------------------------------------
  //  KAMPUS APPAREL
  // ----------------------------------------------------------
  async _canvasKampusApparel(proyek, notaData) {
    const { backgroundImage, lunasImage, totalHarga, dpDibayar, sisaTagihan, notaNumber } = notaData

    const bg = await this._loadImage(backgroundImage)

    const W     = 600
    const SCALE = 3
    const H     = Math.round(bg.naturalHeight * (W / bg.naturalWidth))

    const canvas  = document.createElement('canvas')
    canvas.width  = W * SCALE
    canvas.height = H * SCALE

    const ctx = canvas.getContext('2d')
    ctx.scale(SCALE, SCALE)
    ctx.drawImage(bg, 0, 0, W, H)

    const client     = proyek.nama_client  || '-'
    const noWa       = proyek.no_wa        || '-'
    const proyekName = proyek.nama_proyek  || 'INVOICE'
    const organisasi = proyek.organisasi   || '-'
    const instansi   = proyek.instansi     || '-'
    const jabatan    = proyek.jabatan      || '-'
    const sumberInfo = proyek.sumber_info  || '-'
    const produkList = proyek.produk_list  || []

    // ── Info klien (tabel kiri atas) ──
    const INFO_LEFT = 30
    const INFO_TOP  = 123
    const INFO_W    = W * 0.46
    const LBL_W     = 110
    const VAL_W     = INFO_W - LBL_W
    const INFO_ROW_H = 28

    const infoRows = [
      ['NAMA KLIEN',  client],
      ['WHATSAPP',    noWa],
      ['ORGANISASI',  organisasi],
      ['INSTANSI',    instansi],
      ['JABATAN',     jabatan],
      ['SUMBER INFO', sumberInfo],
      ['JENIS PRODUK',proyekName],
    ]

    infoRows.forEach(([lbl, val], i) => {
      const y = INFO_TOP + i * INFO_ROW_H
      this._rect(ctx, INFO_LEFT,         y, LBL_W, INFO_ROW_H, '#cff4fc', '#aaaaaa')
      this._rect(ctx, INFO_LEFT + LBL_W, y, VAL_W, INFO_ROW_H, '#ffffff', '#aaaaaa')
      this._text(ctx, lbl, INFO_LEFT + 6,               y + INFO_ROW_H * 0.68, { size: 11, bold: true,  color: '#000000' })
      this._text(ctx, val, INFO_LEFT + LBL_W + 6,       y + INFO_ROW_H * 0.68, { size: 11, bold: false, color: '#000000' })
    })

    // ── Header kanan ──
    const RIGHT_START = W * 0.54
    this._text(ctx, `No. Nota: ${notaNumber}`,                    W - 129, 148, { size: 10, color: '#666666', font: 'monospace' })
    this._text(ctx, proyekName,                                    RIGHT_START, 168, { size: 17, bold: true, color: '#cc0000' })
    this._text(ctx, `TANGGAL : ${this.getTglDDMMYYYY(proyek.tanggal_order)}`, RIGHT_START, 188, { size: 14, bold: true, color: '#0077b6' })

    // ── Tabel produk ──
    const TABLE_LEFT  = 30
    const TABLE_RIGHT = W - 28
    const TABLE_W     = TABLE_RIGHT - TABLE_LEFT
    const TABLE_TOP   = 325
    const HEADER_H    = 32
    const ROW_H       = 30

    const cols = [
      { key: 'item',   label: 'BARANG',  x: TABLE_LEFT,       w: 196, align: 'left'   },
      { key: 'jumlah', label: 'JUMLAH',  x: TABLE_LEFT + 196, w: 114, align: 'center' },
      { key: 'harga',  label: 'HARGA',   x: TABLE_LEFT + 310, w: 118, align: 'right'  },
      { key: 'total',  label: 'TOTAL',   x: TABLE_LEFT + 428, w: TABLE_W - 428, align: 'right' },
    ]

    cols.forEach(col => this._rect(ctx, col.x, TABLE_TOP, col.w, HEADER_H, '#00b4d8', '#aaaaaa'))
    cols.forEach(col => {
      const tx = col.align === 'right'  ? col.x + col.w - 7
               : col.align === 'center' ? col.x + col.w / 2
               : col.x + 7
      this._text(ctx, col.label, tx, TABLE_TOP + HEADER_H * 0.68, { size: 12, bold: true, color: '#ffffff', align: col.align })
    })

    const filledRows  = produkList.length || 0
    const emptyNeeded = Math.max(0, 5 - filledRows)
    const allRows     = [
      ...produkList.map(p => ({
        item:   p.nama_produk,
        jumlah: p.jumlah_pcs.toLocaleString('id-ID'),
        harga:  this.formatRupiah(p.harga_satuan),
        total:  this.formatRupiah(p.jumlah_pcs * p.harga_satuan),
      })),
      ...Array(emptyNeeded).fill({ item: '', jumlah: '', harga: '', total: '' }),
    ]

    allRows.forEach((row, ri) => {
      const y  = TABLE_TOP + HEADER_H + ri * ROW_H
      const bg = ri % 2 === 0 ? '#ffffff' : '#f9f9f9'
      cols.forEach(col => {
        this._rect(ctx, col.x, y, col.w, ROW_H, bg, '#cccccc')
        const tx = col.align === 'right'  ? col.x + col.w - 7
                 : col.align === 'center' ? col.x + col.w / 2
                 : col.x + 7
        this._text(ctx, row[col.key] || '', tx, y + ROW_H * 0.68, { size: 12, align: col.align })
      })
    })

    // ── Tabel total ──
    const TOTAL_TOP   = TABLE_TOP + HEADER_H + allRows.length * ROW_H + 14
    const TOTAL_W     = 280
    const TOTAL_LEFT  = W - 28 - TOTAL_W
    const TOTAL_ROW_H = 32

    const totalRows = [
      { label: 'SUB TOTAL',  value: this.formatRupiah(totalHarga),  bg: '#cff4fc', fg: '#000000', bold: true  },
      { label: 'DP CASH/TF', value: this.formatRupiah(dpDibayar),   bg: '#cff4fc', fg: '#000000', bold: false },
      {
        label: 'KEKURANGAN',
        value: sisaTagihan <= 0 ? '-' : this.formatRupiah(sisaTagihan),
        bg: '#cff4fc', fg: '#000000', bold: true,
      },
    ]

    totalRows.forEach((row, i) => {
      const y = TOTAL_TOP + i * TOTAL_ROW_H
      this._rect(ctx, TOTAL_LEFT, y, TOTAL_W, TOTAL_ROW_H, row.bg, '#bbbbbb')
      this._text(ctx, row.label, TOTAL_LEFT + 10,            y + TOTAL_ROW_H * 0.68, { size: 12, bold: row.bold, color: row.fg })
      this._text(ctx, row.value, TOTAL_LEFT + TOTAL_W - 10, y + TOTAL_ROW_H * 0.68, { size: 12, bold: row.bold, color: row.fg, align: 'right' })
    })

    // ── Label LUNAS ──
    if (sisaTagihan <= 0) {
      try {
        const lunas = await this._loadImage(lunasImage)
        const lw    = 113
        const lh    = Math.round(lunas.naturalHeight * (lw / lunas.naturalWidth))
        ctx.globalAlpha = 0.92
        ctx.drawImage(lunas, W * 0.52 - lw / 2, H - H * 0.22 - lh, lw, lh)
        ctx.globalAlpha = 1
      } catch (e) {
        console.warn('Label lunas gagal load', e)
      }
    }

    return canvas
  },

  // ----------------------------------------------------------
  //  ENTRY POINT  –  dipanggil dari NotaModal
  // ----------------------------------------------------------

  /**
   * generateCanvas(proyek) → Promise<HTMLCanvasElement>
   *
   * Cara pakai di NotaModal:
   *
   *   const canvas = await notaService.generateCanvas(proyek)
   *
   *   // Download
   *   const link = document.createElement('a')
   *   link.download = `nota_${proyek.nama_client}.png`
   *   link.href = canvas.toDataURL('image/png')
   *   link.click()
   *
   *   // Copy ke clipboard
   *   canvas.toBlob(async blob => {
   *     await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
   *   })
   */
  async generateCanvas(proyek) {
    const notaData = this.generateNotaData(proyek)
    const { brand } = notaData

    if (brand === 'CLOTHINGWELL') {
      return this._canvasClothingwell(proyek, notaData)
    }
    if (brand === 'KAMPUS APPAREL') {
      return this._canvasKampusApparel(proyek, notaData)
    }
    // Default: SERAGAMAN
    return this._canvasSeragaman(proyek, notaData)
  },
}