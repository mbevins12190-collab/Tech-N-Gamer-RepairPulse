"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import PDFDocument from "pdfkit";
import bwipjs from "bwip-js";
import { internal } from "./_generated/api";

export const generateWorkOrder = action({
  args: { repairOrderId: v.id("repair_orders") },
  returns: v.string(), // Returns a Storage ID or URL
  handler: async (ctx, args) => {
    // 1. Fetch data
    const order: any = await ctx.runQuery(internal.repairs_internal.getOrderDetails, { repairOrderId: args.repairOrderId });
    const settings: any = await ctx.runQuery(internal.settings_internal.getSettings, {});
    
    const shopName = settings.shop_name || "Tech-N-Gamer";
    const shopPhone = settings.shop_phone || "";
    const shopAddress = settings.shop_address || "";

    // 2. Create PDF
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const buffers: any[] = [];
    doc.on('data', buffers.push.bind(buffers));
    
    const finish = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
    });

    // Helper for barcode
    const getBarcode = async (text: string) => {
      return await bwipjs.toBuffer({
        bcid: 'code128',
        text: text,
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: 'center',
      });
    };

    const barcodeBuffer = await getBarcode(order.ticket_number);

    // Render Work Order (Two copies)
    const renderCopy = (yOffset: number) => {
      doc.fontSize(20).fillColor('#F97316').text(shopName, 40, yOffset + 40);
      doc.fontSize(10).fillColor('#333').text(`Electronics Repair & Gaming | Phone: ${shopPhone}`, 40, yOffset + 65);
      doc.fontSize(8).fillColor('#666').text(shopAddress, 40, yOffset + 80);
      
      doc.image(barcodeBuffer, 400, yOffset + 40, { width: 150 });
      
      doc.moveTo(40, yOffset + 95).lineTo(550, yOffset + 95).stroke();
      
      doc.fontSize(12).fillColor('#000').text(`Ticket: ${order.ticket_number}`, 40, yOffset + 110, { underline: true });
      doc.text(`Date: ${new Date(order._creationTime).toLocaleDateString()}`, 40, yOffset + 125);
      
      doc.fontSize(11).text('CUSTOMER INFO', 40, yOffset + 150, { underline: true });
      doc.text(`Name: ${order.customer_name}`, 40, yOffset + 165);
      doc.text(`Phone: ${order.customer_phone}`, 40, yOffset + 180);
      
      doc.text('DEVICE INFO', 200, yOffset + 150, { underline: true });
      doc.text(`Device: ${order.device_brand} ${order.device_model}`, 200, yOffset + 165);
      doc.text(`Serial: ${order.device_serial || 'N/A'}`, 200, yOffset + 180);
      
      doc.text('REPORTED ISSUE', 40, yOffset + 210, { underline: true });
      doc.fontSize(10).text(order.device_issue, 40, yOffset + 225, { width: 500 });
      
      doc.fontSize(11).text(`Est. Cost: $${(order.total_cost / 100).toFixed(2)}`, 40, yOffset + 270);
      doc.text(`Deposit Paid: $${(order.deposit_amount / 100).toFixed(2)}`, 200, yOffset + 270);
      
      doc.fontSize(8).text('TERMS: Shop not responsible for data loss. Unclaimed devices after 90 days will be recycled.', 40, yOffset + 310);
      doc.text('Signature: ___________________________', 40, yOffset + 330);
    };

    renderCopy(0);
    doc.dash(5, { space: 5 }).moveTo(40, 400).lineTo(550, 400).stroke().undash();
    renderCopy(420);

    doc.end();
    const pdfBuffer = await finish;
    
    return pdfBuffer.toString('base64');
  },
});
