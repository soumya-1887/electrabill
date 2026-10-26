import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatINR } from './formatters';

/**
 * Generate and download a formatted PDF invoice for a bill record
 * @param {Object} bill - Complete bill record with customer info & slab breakdown
 */
export function generateBillPDF(bill) {
  if (!bill) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Primary palette
  const darkNavy = [16, 42, 67];
  const electricBlue = [2, 132, 199];
  const tealAccent = [13, 148, 136];
  const slateText = [71, 85, 105];
  const lightBg = [248, 250, 252];

  // Header Background Banner
  doc.setFillColor(...darkNavy);
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Decorative Accent Strip
  doc.setFillColor(...electricBlue);
  doc.rect(0, 42, pageWidth, 2.5, 'F');

  // Brand Name & Tagline
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('ELECTRABILL', 15, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('Smart Electricity Billing & Utility Management System', 15, 26);
  doc.text('Govt. Recognized Electricity Tariff Standards', 15, 31);

  // Invoice Label (Right Aligned)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(34, 211, 238); // Cyan
  doc.text('ELECTRICITY INVOICE', pageWidth - 15, 18, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`Bill No: ${bill.bill_number}`, pageWidth - 15, 26, { align: 'right' });
  doc.text(`Status: ${bill.status || 'Unpaid'}`, pageWidth - 15, 32, { align: 'right' });

  // Two Column Metadata Section (Customer Info & Bill Details)
  let yPos = 54;

  // Box 1: Customer Details
  doc.setFillColor(...lightBg);
  doc.roundedRect(14, yPos, (pageWidth - 36) / 2, 40, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, yPos, (pageWidth - 36) / 2, 40, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...darkNavy);
  doc.text('CUSTOMER INFORMATION', 19, yPos + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...slateText);
  doc.text('Consumer Name:', 19, yPos + 15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkNavy);
  doc.text(bill.customer_name || '—', 52, yPos + 15);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slateText);
  doc.text('Meter Number:', 19, yPos + 22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...electricBlue);
  doc.text(bill.meter_number || '—', 52, yPos + 22);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slateText);
  doc.text('Address:', 19, yPos + 29);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkNavy);
  const addressText = doc.splitTextToSize(bill.customer_address || 'Registered Residential Connection', (pageWidth - 36) / 2 - 38);
  doc.text(addressText, 52, yPos + 29);

  // Box 2: Billing Summary Details
  const rightBoxX = 14 + (pageWidth - 36) / 2 + 8;
  doc.setFillColor(...lightBg);
  doc.roundedRect(rightBoxX, yPos, (pageWidth - 36) / 2, 40, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightBoxX, yPos, (pageWidth - 36) / 2, 40, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...darkNavy);
  doc.text('BILLING METRICS', rightBoxX + 5, yPos + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...slateText);
  doc.text('Billing Period:', rightBoxX + 5, yPos + 15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkNavy);
  doc.text(bill.billing_period || 'Current Cycle', rightBoxX + 38, yPos + 15);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slateText);
  doc.text('Bill Date:', rightBoxX + 5, yPos + 22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkNavy);
  const billDate = bill.generated_at ? new Date(bill.generated_at).toLocaleDateString('en-IN') : 'Today';
  doc.text(billDate, rightBoxX + 38, yPos + 22);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slateText);
  doc.text('Payment Due:', rightBoxX + 5, yPos + 29);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38); // Red
  doc.text(bill.due_date || 'Within 15 Days', rightBoxX + 38, yPos + 29);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slateText);
  doc.text('Total Units:', rightBoxX + 5, yPos + 36);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...electricBlue);
  doc.text(`${bill.units_consumed} kWh`, rightBoxX + 38, yPos + 36);

  // Consumption Highlights Box
  yPos += 48;
  doc.setFillColor(238, 242, 255);
  doc.roundedRect(14, yPos, pageWidth - 28, 12, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...darkNavy);
  doc.text(`Total Energy Consumed: `, 19, yPos + 8);
  doc.setFont('helvetica', 'bold');
  doc.text(`${bill.units_consumed} Units (kWh)`, 60, yPos + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Pricing Model: Progressive Slab Tariff (Each slab calculated independently)`, 105, yPos + 8);

  // Slabs Table using autoTable
  yPos += 18;

  const tableData = [
    [
      'Slab 1: First 100 units (1–100)',
      Math.min(Math.max(bill.units_consumed, 0), 100),
      `Rs. ${bill.rate_slab_1 || 2}/unit`,
      formatINR(bill.slab_1_amount)
    ],
    [
      'Slab 2: Next 100 units (101–200)',
      bill.units_consumed > 100 ? Math.min(bill.units_consumed - 100, 100) : 0,
      `Rs. ${bill.rate_slab_2 || 3}/unit`,
      formatINR(bill.slab_2_amount)
    ],
    [
      'Slab 3: Above 200 units (>200)',
      bill.units_consumed > 200 ? bill.units_consumed - 200 : 0,
      `Rs. ${bill.rate_slab_3 || 5}/unit`,
      formatINR(bill.slab_3_amount)
    ]
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Tariff Slab Description', 'Units Consumed', 'Unit Rate', 'Amount']],
    body: tableData,
    foot: [['Total Consumption & Charges', `${bill.units_consumed} kWh`, '—', formatINR(bill.total_amount)]],
    margin: { left: 14, right: 14 },
    theme: 'grid',
    headStyles: {
      fillColor: darkNavy,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9.5,
      halign: 'left',
      cellPadding: 4
    },
    bodyStyles: {
      fontSize: 9,
      textColor: darkNavy,
      cellPadding: 4
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: darkNavy,
      fontStyle: 'bold',
      fontSize: 10,
      cellPadding: 4
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { halign: 'right', cellWidth: 32 },
      2: { halign: 'right', cellWidth: 32 },
      3: { halign: 'right', cellWidth: 38 }
    }
  });

  const finalTableY = doc.lastAutoTable.finalY + 12;

  // Payable Summary Card
  const summaryBoxWidth = 85;
  const summaryBoxX = pageWidth - 14 - summaryBoxWidth;
  doc.setFillColor(...darkNavy);
  doc.roundedRect(summaryBoxX, finalTableY, summaryBoxWidth, 26, 2, 2, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text('TOTAL AMOUNT PAYABLE', summaryBoxX + 8, finalTableY + 9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(34, 211, 238); // Cyan
  doc.text(formatINR(bill.total_amount), summaryBoxX + 8, finalTableY + 19);

  // Left Note Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...darkNavy);
  doc.text('Important Notice & Instructions:', 14, finalTableY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...slateText);
  const notesText = [
    '• Please make payment on or before the due date to avoid service disconnection.',
    '• Progressive slab charges ensure equitable tariffs based on actual consumption.',
    '• For billing inquiries or meter recalibration, contact support@electrabill.gov.in.'
  ];
  notesText.forEach((line, idx) => {
    doc.text(line, 14, finalTableY + 13 + idx * 5.5);
  });

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 12;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, footerY - 4, pageWidth - 14, footerY - 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('ElectraBill — Smart Utility Billing Platform | System Generated Official Invoice', 14, footerY);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, pageWidth - 14, footerY, { align: 'right' });

  // Save the document
  doc.save(`ElectraBill_${bill.bill_number}.pdf`);
}
