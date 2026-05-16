export const notaService = {
  generateNotaData(proyek) {
    const totalHarga = proyek.total_harga || 0
    const dpDibayar = proyek.dp_dibayar || 0
    const sisaTagihan = totalHarga - dpDibayar

    let brand = 'SERAGAMAN'
    let backgroundImage = ''
    let lunasImage = ''

    if (proyek.brand === 'CLOTHINGWELL') {
      brand = 'CLOTHINGWELL'
      backgroundImage = '/src/assets/nota_clothingwell.jpg'
      lunasImage = '/src/assets/label_lunas_clothingwell.png'
    } else if (proyek.brand === 'KAMPUS APPAREL') {
      brand = 'KAMPUS APPAREL'
      backgroundImage = '/src/assets/nota_kampusapparel.jpg'
      lunasImage = '/src/assets/label_lunas_kampusapparel.png'
    } else {
      backgroundImage = '/src/assets/nota_seragaman.jpg'
      lunasImage = '/src/assets/label_lunas_seragaman.png'
    }

    return {
      brand,
      backgroundImage,
      lunasImage,
      totalHarga,
      dpDibayar,
      sisaTagihan,
      notaNumber: proyek.nota_number || `INV-${Date.now()}`
    }
  },

  getTglLong(tanggalOrder) {
    const d = tanggalOrder ? new Date(tanggalOrder) : new Date()
    const months = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER']
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
  },

  getTglDDMMYYYY(tanggalOrder) {
    const d = tanggalOrder ? new Date(tanggalOrder) : new Date()
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    return `${dd} / ${mm} / ${d.getFullYear()}`
  },

  buildProdukRows(produkList) {
    let rows = ''
    for (const p of (produkList || [])) {
      const subtotal = p.jumlah_pcs * p.harga_satuan
      rows += `
        <tr>
          <td style="padding: 7px 6px; text-align: left;">${this.escapeHtml(p.nama_produk)}</td>
          <td style="padding: 7px 6px; text-align: center;">${p.jumlah_pcs.toLocaleString('id-ID')}</td>
          <td style="padding: 7px 6px; text-align: right;">${this.formatRupiah(p.harga_satuan)}</td>
          <td style="padding: 7px 6px; text-align: right;">${this.formatRupiah(subtotal)}</td>
        </tr>
      `
    }
    return rows
  },

  generateEmptyRows(count) {
    let rows = ''
    for (let i = 0; i < count; i++) {
      rows += `<tr><td style="padding: 7px 6px;">&nbsp;</td><td style="padding: 7px 6px;"></td><td style="padding: 7px 6px;"></td><td style="padding: 7px 6px;"></td></tr>`
    }
    return rows
  },

  formatRupiah(angka) {
    return `Rp ${Math.round(angka || 0).toLocaleString('id-ID')}`
  },

  escapeHtml(str) {
    if (!str) return ''
    return String(str).replace(/[&<>]/g, function(m) {
      if (m === '&') return '&amp;'
      if (m === '<') return '&lt;'
      if (m === '>') return '&gt;'
      return m
    })
  },

  getHtmlTemplate(proyek, notaData) {
    const { brand, backgroundImage, lunasImage, totalHarga, dpDibayar, sisaTagihan, notaNumber } = notaData
    const client = this.escapeHtml(proyek.nama_client || '-')
    const noWa = this.escapeHtml(proyek.no_wa || '-')
    const proyekName = this.escapeHtml(proyek.nama_proyek || 'INVOICE')
    const organisasi = this.escapeHtml(proyek.organisasi || '-')
    const instansi = this.escapeHtml(proyek.instansi || '-')
    const jabatan = this.escapeHtml(proyek.jabatan || '-')
    const sumberInfo = this.escapeHtml(proyek.sumber_info || '-')
    const produkList = proyek.produk_list || []
    const filledRows = produkList.length || 1
    const emptyNeeded = Math.max(0, 5 - filledRows)

    const produkRows = this.buildProdukRows(produkList) + this.generateEmptyRows(emptyNeeded)

    // Posisi berbeda per brand
    if (brand === 'SERAGAMAN') {
      const tableTop = 248
      const totalTop = tableTop + 44 + (filledRows + emptyNeeded) * 30 + 8
      return `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; background: #e0e0e0; display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 20px; }
          .nota-container { position: relative; width: 600px; }
          .nota-container img.bg { width: 100%; display: block; }
          .nota-content { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
          .client-name { position: absolute; top: 192px; left: 42px; font-size: 15px; font-weight: 700; }
          .client-wa { position: absolute; top: 212px; left: 42px; font-size: 13px; color: #555; }
          .order-right { position: absolute; top: 186px; right: 42px; text-align: right; }
          .order-right .judul { color: #cc0000; font-weight: 900; font-size: 15px; }
          .order-right .tgl { font-weight: 600; font-size: 13px; margin-top: 4px; }
          .nota-number { position: absolute; top: 235px; right: 42px; font-size: 11px; color: #666; font-family: monospace; }
          .table-wrap { position: absolute; top: ${tableTop}px; left: 42px; right: 42px; }
          .table-wrap table { width: 100%; font-size: 13px; border-collapse: collapse; }
          .table-wrap th { background: #1a1a1a; color: #f59e0b; border: 1px solid #555; padding: 8px 6px; }
          .table-wrap td { border: 1px solid #ccc; padding: 7px 6px; }
          .total-wrap { position: absolute; top: ${totalTop}px; right: 42px; }
          .total-table { min-width: 270px; font-size: 13px; border-collapse: collapse; }
          .total-table td { padding: 7px 12px; border: 1px solid #555; }
          .total-table td:last-child { text-align: right; }
          .row-subtotal td { background: #1a1a1a; color: #f59e0b; font-weight: 700; }
          .row-dp td { background: #1a1a1a; color: #fff; }
          .row-pelunasan td { background: #1a1a1a; color: #fff; }
          .row-kekurangan td { background: #f59e0b; color: #000; font-weight: 700; }
          .data-pemesan { position: absolute; top: 646px; left: 42px; font-size: 11px; line-height: 2; color: #333; }
          .label-lunas { position: absolute; bottom: 6%; right: 10%; width: 226px; opacity: 0.92; }
          @media print { body { padding: 0; background: #fff; gap: 0; } }
        </style></head>
        <body>
          <div class="nota-container">
            <img class="bg" src="${backgroundImage}" />
            <div class="nota-content">
              <div class="client-name">${client}</div>
              <div class="client-wa">WA : ${noWa}</div>
              <div class="nota-number">No. Nota: ${notaNumber}</div>
              <div class="order-right"><div class="judul">${proyekName}</div><div class="tgl">TANGGAL : ${this.getTglLong(proyek.tanggal_order)}</div></div>
              <div class="table-wrap"><table><thead><tr><th>ITEM</th><th>JUMLAH</th><th>HARGA</th><th>TOTAL</th></tr></thead><tbody>${produkRows}</tbody></table></div>
              <div class="total-wrap"><table class="total-table"><tr class="row-subtotal"><td>SUB TOTAL</td><td>${this.formatRupiah(totalHarga)}</td></tr><tr class="row-dp"><td>DP 1</td><td>${this.formatRupiah(dpDibayar)}</td></tr><tr class="row-pelunasan"><td>PELUNASAN</td><td>-</td></tr><tr class="row-kekurangan"><td>KEKURANGAN</td><td>${sisaTagihan <= 0 ? 'LUNAS' : this.formatRupiah(sisaTagihan)}</td></tr></table></div>
              <div class="data-pemesan"><div>ORGANISASI : ${organisasi}</div><div>PERUSAHAAN/KAMPUS : ${instansi}</div><div>JABATAN DI ORGANISASI : ${jabatan}</div><div>TAU SERAGAMAN DARI : ${sumberInfo}</div></div>
              ${sisaTagihan <= 0 ? `<img class="label-lunas" src="${lunasImage}" alt="LUNAS"/>` : ''}
            </div>
          </div>
        </body>
        </html>
      `
    }

    if (brand === 'CLOTHINGWELL') {
      const tableTop = 300
      const totalTop = tableTop + 44 + (filledRows + emptyNeeded) * 30 + 8
      return `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; background: #e0e0e0; display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 20px; }
          .nota-container { position: relative; width: 600px; }
          .nota-container img.bg { width: 100%; display: block; }
          .nota-content { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
          .order-title { position: absolute; top: 196px; left: 42px; color: #cc0000; font-weight: 900; font-size: 16px; }
          .client-name { position: absolute; top: 220px; left: 42px; font-weight: 700; font-size: 15px; }
          .client-wa { position: absolute; top: 241px; left: 42px; font-size: 13px; }
          .nota-number { position: absolute; top: 196px; right: 42px; font-size: 11px; color: #666; font-family: monospace; }
          .tgl-right { position: absolute; top: 220px; right: 42px; text-align: right; font-size: 13px; line-height: 1.9; }
          .table-wrap { position: absolute; top: ${tableTop}px; left: 42px; right: 42px; }
          .table-wrap table { width: 100%; font-size: 13px; border-collapse: collapse; }
          .table-wrap th { background: #f5e800; color: #111; border: 1px solid #aaa; padding: 8px 6px; }
          .table-wrap td { border: 1px solid #ccc; padding: 7px 6px; }
          .total-wrap { position: absolute; top: ${totalTop}px; right: 42px; }
          .total-table { min-width: 280px; font-size: 13px; border-collapse: collapse; }
          .total-table td { padding: 7px 12px; border: 1px solid #bbb; }
          .total-table td:last-child { text-align: right; }
          .row-total td { background: #f5f5f5; }
          .row-dp td { background: #f5e800; font-weight: 600; }
          .row-kekurangan td { background: #f5e800; font-weight: 700; font-style: italic; }
          .data-pemesan { position: absolute; top: 645px; left: 62px; font-size: 11px; line-height: 1.3; }
          .dp-underline { font-weight: 700; text-decoration: underline; margin-bottom: 2px; font-size: 12px; }
          .label-lunas { position: absolute; bottom: 19%; right: 49%; width: 126px; opacity: 0.92; }
          @media print { body { padding: 0; background: #fff; gap: 0; } }
        </style></head>
        <body>
          <div class="nota-container">
            <img class="bg" src="${backgroundImage}" />
            <div class="nota-content">
              <div class="order-title">${proyekName}</div>
              <div class="nota-number">No. Nota: ${notaNumber}</div>
              <div class="client-name">${client}</div>
              <div class="client-wa">WA : ${noWa}</div>
              <div class="tgl-right"><div>Tanggal : ${this.getTglDDMMYYYY(proyek.tanggal_order)}</div><div>Jenis Order : ${proyekName}</div></div>
              <div class="table-wrap"><table><thead><tr><th>JENIS PESANAN</th><th>JUMLAH</th><th>HARGA</th><th>TOTAL</th></tr></thead><tbody>${produkRows}</tbody></table></div>
              <div class="total-wrap"><table class="total-table"><tr class="row-total"><td>TOTAL</td><td>${this.formatRupiah(totalHarga)}</td></tr><tr class="row-dp"><td>DP CASH/TF</td><td>${this.formatRupiah(dpDibayar)}</td></tr><tr class="row-kekurangan"><td>KEKURANGAN</td><td>${sisaTagihan <= 0 ? 'LUNAS' : this.formatRupiah(sisaTagihan)}</td></tr></table></div>
              <div class="data-pemesan"><div class="dp-underline">DATA PEMESAN</div><div>ORGANISASI : ${organisasi}</div><div>INSTANSI : ${instansi}</div><div>JABATAN : ${jabatan}</div><div>SUMBER INFO : ${sumberInfo}</div></div>
              ${sisaTagihan <= 0 ? `<img class="label-lunas" src="${lunasImage}" alt="LUNAS"/>` : ''}
            </div>
          </div>
        </body>
        </html>
      `
    }

    // KAMPUS APPAREL
    const tableTop = 325
    const totalTop = tableTop + 44 + (filledRows + emptyNeeded) * 30 + 8
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #e0e0e0; display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 20px; }
        .nota-container { position: relative; width: 600px; }
        .nota-container img.bg { width: 100%; display: block; }
        .nota-content { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
        .info-klien { position: absolute; top: 123px; left: 30px; width: 46%; }
        .info-klien table { width: 100%; font-size: 13px; border-collapse: collapse; }
        .info-klien td { border: 1px solid #aaa; padding: 6px 8px; }
        .info-klien .lbl { font-weight: 700; background: #cff4fc; width: 100px; }
        .nota-number { position: absolute; top: 145px; right: 129px; font-size: 11px; color: #666; font-family: monospace; }
        .order-right { position: absolute; top: 153px; left: 54%; right: 30px; }
        .order-right .judul { color: #cc0000; font-weight: 900; font-size: 17px; margin-bottom: 6px; }
        .order-right .tgl { color: #0077b6; font-weight: 700; font-size: 14px; }
        .table-wrap { position: absolute; top: ${tableTop}px; left: 30px; right: 28px; }
        .table-wrap table { width: 100%; font-size: 13px; border-collapse: collapse; }
        .table-wrap th { background: #00b4d8; color: #fff; border: 1px solid #aaa; padding: 8px 6px; }
        .table-wrap td { border: 1px solid #ccc; padding: 7px 6px; }
        .total-wrap { position: absolute; top: ${totalTop}px; right: 30px; }
        .total-table { min-width: 280px; font-size: 13px; border-collapse: collapse; }
        .total-table td { padding: 7px 12px; border: 1px solid #bbb; }
        .total-table td:last-child { text-align: right; }
        .row-subtotal td { background: #cff4fc; font-weight: 600; }
        .row-dp td { background: #cff4fc; }
        .row-kekurangan td { background: #cff4fc; font-weight: 700; font-size: 14px; }
        .label-lunas { position: absolute; bottom: 22%; right: 48%; width: 113px; opacity: 0.92; }
        @media print { body { padding: 0; background: #fff; gap: 0; } }
      </style></head>
      <body>
        <div class="nota-container">
          <img class="bg" src="${backgroundImage}" />
          <div class="nota-content">
            <div class="info-klien"><table><tr><td class="lbl">NAMA KLIEN</td><td>${client}</td></tr><tr><td class="lbl">WHATSAPP</td><td>${noWa}</td></tr><tr><td class="lbl">ORGANISASI</td><td>${organisasi}</td></tr><tr><td class="lbl">INSTANSI</td><td>${instansi}</td></tr><tr><td class="lbl">JABATAN</td><td>${jabatan}</td></tr><tr><td class="lbl">SUMBER INFO</td><td>${sumberInfo}</td></tr><tr><td class="lbl">JENIS PRODUK</td><td>${proyekName}</td></tr></table></div>
            <div class="nota-number">No. Nota: ${notaNumber}</div>
            <div class="order-right"><div class="judul">${proyekName}</div><div class="tgl">TANGGAL : ${this.getTglDDMMYYYY(proyek.tanggal_order)}</div></div>
            <div class="table-wrap"><table><thead><tr><th>BARANG</th><th>JUMLAH</th><th>HARGA</th><th>TOTAL</th></tr></thead><tbody>${produkRows}</tbody></table></div>
            <div class="total-wrap"><table class="total-table"><tr class="row-subtotal"><td>SUB TOTAL</td><td>${this.formatRupiah(totalHarga)}</td></tr><tr class="row-dp"><td>DP CASH/TF</td><td>${this.formatRupiah(dpDibayar)}</td></tr><tr class="row-kekurangan"><td>KEKURANGAN</td><td>${sisaTagihan <= 0 ? '-' : this.formatRupiah(sisaTagihan)}</td></tr></table></div>
            ${sisaTagihan <= 0 ? `<img class="label-lunas" src="${lunasImage}" alt="LUNAS"/>` : ''}
          </div>
        </div>
      </body>
      </html>
    `
  }
}