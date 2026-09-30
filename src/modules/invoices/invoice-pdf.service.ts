import PDFDocument from 'pdfkit';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { HTTP_STATUS } from '../../config/constants';

export class InvoicePdfService {
  /**
   * Generates a luxury, branded PDF receipt buffer for an invoice
   */
  async generateInvoicePdf(invoiceId: string): Promise<{ buffer: Buffer; filename: string }> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        client: {
          include: { loyalty: true },
        },
        items: {
          include: {
            service: true,
            technician: {
              include: {
                staffProfile: true,
              },
            },
            retailProduct: true,
          },
        },
        payments: {
          orderBy: { paidAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!invoice) {
      throw new AppError('Invoice not found', HTTP_STATUS.NOT_FOUND);
    }

    const clientName = invoice.client?.name || 'Valued Guest';
    const clientPhone = invoice.client?.phone || invoice.client?.whatsapp || '—';
    const invNumber = invoice.invoiceNumber || invoice.id.slice(0, 8);
    const filename = `OMEGA_SPA_Receipt_${invNumber}.pdf`;

    const lastPayment = invoice.payments[0];
    const paymentMethod = lastPayment?.paymentMethod || 'CASH';

    const paidDate = lastPayment?.paidAt || invoice.createdAt;
    const dateStr = new Date(paidDate).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timeStr = new Date(paidDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const subtotal = Number(invoice.subtotal);
    const discount = Number(invoice.discount);
    const total = Number(invoice.total);
    const pointsEarned = invoice.pointsEarned || Math.round(total / 1000);
    const loyaltyBalance = invoice.client?.loyalty?.balance || pointsEarned;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `OMEGA SPA Receipt - ${invNumber}`,
          Author: 'OMEGA SPA Douala',
          Subject: 'Official Payment Receipt',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve({ buffer: Buffer.concat(chunks), filename }));
      doc.on('error', (err) => reject(err));

      // ── COLOR PALETTE ──
      const primaryCharcoal = '#2E2F31';
      const accentSage = '#4A8C5C';
      const textGray = '#6B7280';
      const borderGray = '#E5E7EB';
      const bgSand = '#F9F6F0';

      // ── 1. HEADER BANNER ──
      doc.rect(40, 40, 515, 65).fill(primaryCharcoal);

      doc.fillColor('#FFFFFF')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('OMEGA SPA', 55, 52);

      doc.fontSize(8)
        .font('Helvetica')
        .fillColor('#D1D5DB')
        .text('DOUALA, CAMEROON · BEAUTY & WELLNESS', 55, 76);

      doc.fillColor('#FFFFFF')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('OFFICIAL RECEIPT / REÇU', 360, 52, { width: 180, align: 'right' });

      doc.fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#9CA3AF')
        .text(invNumber, 360, 70, { width: 180, align: 'right' });

      // ── 2. TRANSACTION & CLIENT INFO METADATA ──
      let y = 120;
      doc.rect(40, y, 515, 60).fill(bgSand);
      doc.rect(40, y, 515, 60).stroke(borderGray);

      // Left Column
      doc.fillColor(textGray).fontSize(8).font('Helvetica').text('DATE & TIME', 55, y + 10);
      doc.fillColor(primaryCharcoal).fontSize(10).font('Helvetica-Bold').text(`${dateStr} · ${timeStr}`, 55, y + 22);

      doc.fillColor(textGray).fontSize(8).font('Helvetica').text('PAYMENT METHOD', 55, y + 36);
      doc.fillColor(primaryCharcoal).fontSize(9).font('Helvetica-Bold').text(paymentMethod.replace('_', ' '), 55, y + 46);

      // Right Column
      doc.fillColor(textGray).fontSize(8).font('Helvetica').text('CLIENT', 320, y + 10);
      doc.fillColor(primaryCharcoal).fontSize(10).font('Helvetica-Bold').text(clientName, 320, y + 22);

      doc.fillColor(textGray).fontSize(8).font('Helvetica').text('PHONE / WHATSAPP', 320, y + 36);
      doc.fillColor(primaryCharcoal).fontSize(9).font('Helvetica').text(clientPhone, 320, y + 46);

      // ── 3. SERVICES & ITEMS TABLE ──
      y = 195;
      doc.fillColor(primaryCharcoal).fontSize(10).font('Helvetica-Bold').text('ITEMS & SERVICES RENDERED / PRESTATIONS', 40, y);
      y += 18;

      // Table Header Row
      doc.rect(40, y, 515, 20).fill('#F3F4F6');
      doc.fillColor(primaryCharcoal).fontSize(8).font('Helvetica-Bold');
      doc.text('DESCRIPTION', 50, y + 6);
      doc.text('TECHNICIAN', 270, y + 6);
      doc.text('QTY', 380, y + 6, { width: 30, align: 'center' });
      doc.text('AMOUNT (FCFA)', 420, y + 6, { width: 125, align: 'right' });
      y += 20;

      // Table Rows
      doc.font('Helvetica').fontSize(9);
      if (invoice.items && invoice.items.length > 0) {
        invoice.items.forEach((item, idx) => {
          const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA';
          doc.rect(40, y, 515, 24).fill(rowBg);
          doc.rect(40, y, 515, 24).stroke(borderGray);

          const itemName = item.name || item.service?.name || item.productName || 'Spa Treatment';
          const techName = item.technician?.staffProfile?.name || 'Staff';
          const itemPrice = Number(item.price);

          doc.fillColor(primaryCharcoal).text(itemName, 50, y + 7, { width: 215, height: 14, ellipsis: true });
          doc.fillColor(textGray).text(techName, 270, y + 7, { width: 100, height: 14, ellipsis: true });
          doc.fillColor(primaryCharcoal).text(String(item.quantity || 1), 380, y + 7, { width: 30, align: 'center' });
          doc.font('Helvetica-Bold').fillColor(primaryCharcoal).text(`${itemPrice.toLocaleString('en-US')} FCFA`, 420, y + 7, { width: 125, align: 'right' });

          doc.font('Helvetica');
          y += 24;
        });
      } else {
        doc.rect(40, y, 515, 24).fill('#FFFFFF');
        doc.fillColor(primaryCharcoal).text('Spa Services & Treatments', 50, y + 7);
        doc.text(`${total.toLocaleString('en-US')} FCFA`, 420, y + 7, { width: 125, align: 'right' });
        y += 24;
      }

      // ── 4. FINANCIAL TOTALS SUMMARY ──
      y += 15;
      const totalsX = 330;
      const totalsWidth = 225;

      doc.rect(totalsX, y, totalsWidth, 80).fill('#FFFFFF');
      doc.rect(totalsX, y, totalsWidth, 80).stroke(borderGray);

      doc.fillColor(textGray).fontSize(9).font('Helvetica');
      doc.text('Subtotal:', totalsX + 15, y + 12);
      doc.text(`${subtotal.toLocaleString('en-US')} FCFA`, totalsX + 100, y + 12, { width: 110, align: 'right' });

      if (discount > 0) {
        doc.text('Discount / Remise:', totalsX + 15, y + 28);
        doc.fillColor('#DC2626').text(`-${discount.toLocaleString('en-US')} FCFA`, totalsX + 100, y + 28, { width: 110, align: 'right' });
        doc.fillColor(textGray);
      }

      // Grand Total Highlight Bar
      doc.rect(totalsX, y + 46, totalsWidth, 34).fill(primaryCharcoal);
      doc.fillColor('#FFFFFF').fontSize(11).font('Helvetica-Bold');
      doc.text('TOTAL PAID:', totalsX + 15, y + 57);
      doc.text(`${total.toLocaleString('en-US')} FCFA`, totalsX + 90, y + 57, { width: 120, align: 'right' });

      // ── 5. LOYALTY SUMMARY CARD (Left side) ──
      doc.rect(40, y, 275, 80).fill(bgSand);
      doc.rect(40, y, 275, 80).stroke(borderGray);

      doc.fillColor(primaryCharcoal).fontSize(9).font('Helvetica-Bold').text('LOYALTY REWARDS / PROGRAMME FIDÉLITÉ', 55, y + 12);
      doc.fillColor(textGray).fontSize(8).font('Helvetica');
      doc.text('Points Earned This Visit:', 55, y + 30);
      doc.fillColor(accentSage).font('Helvetica-Bold').text(`+${pointsEarned} pts`, 220, y + 30, { width: 80, align: 'right' });

      doc.fillColor(textGray).font('Helvetica').text('Current Total Balance:', 55, y + 48);
      doc.fillColor(primaryCharcoal).font('Helvetica-Bold').fontSize(10).text(`${loyaltyBalance} pts`, 220, y + 48, { width: 80, align: 'right' });

      // ── 6. FOOTER ──
      const footerY = 730;
      doc.moveTo(40, footerY).lineTo(555, footerY).stroke(borderGray);

      doc.fillColor(primaryCharcoal)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Merci pour votre visite chez OMEGA SPA ! · Thank you for visiting !', 40, footerY + 12, { align: 'center', width: 515 });

      doc.fillColor(textGray)
        .fontSize(8)
        .font('Helvetica')
        .text('Douala, Cameroun · Tél: +237 6 87 67 32 62 · info@omegaspa.cm', 40, footerY + 28, { align: 'center', width: 515 });

      doc.fontSize(7)
        .fillColor('#9CA3AF')
        .text('Ce reçu a été généré électroniquement et est valable sans signature.', 40, footerY + 42, { align: 'center', width: 515 });

      doc.end();
    });
  }
}

export const invoicePdfService = new InvoicePdfService();
