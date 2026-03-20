"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";
import { internal } from "./_generated/api";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendRepairStatusEmail = internalAction({
  args: {
    repairOrderId: v.id("repair_orders"),
    status: v.union(v.literal("created"), v.literal("completed")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const order: any = await ctx.runQuery(internal.repairs_internal.getOrderDetails, { 
      repairOrderId: args.repairOrderId 
    });
    
    if (!order || !order.customer_email) {
      console.log("No customer email found for order", args.repairOrderId);
      return null;
    }

    const settings: any = await ctx.runQuery(internal.settings_internal.getSettings, {});
    const shopName = settings.shop_name || "Tech-N-Gamer";
    const shopPhone = settings.shop_phone || "";
    const siteUrl = process.env.SITE_URL || "https://app.cto.new";
    const portalUrl = `${siteUrl}/status`;

    let subject = "";
    let html = "";

    if (args.status === "created") {
      subject = `Repair Order Received: ${order.ticket_number} - ${shopName}`;
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #F97316;">Repair Intake Confirmation</h2>
          <p>Hi ${order.customer_name},</p>
          <p>We've successfully checked in your device for repair at <strong>${shopName}</strong>.</p>
          <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Ticket Number:</strong> ${order.ticket_number}</p>
            <p style="margin: 5px 0;"><strong>Device:</strong> ${order.device_brand} ${order.device_model}</p>
            <p style="margin: 5px 0;"><strong>Reported Issue:</strong> ${order.device_issue}</p>
          </div>
          <p>You can track the status of your repair in real-time on our portal:</p>
          <p><a href="${portalUrl}" style="background: #F97316; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Track My Repair</a></p>
          <p>We will notify you once the diagnosis is complete or if we need more information.</p>
          <p>If you have any questions, please call us at <strong>${shopPhone}</strong>.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #666;">Thank you for choosing ${shopName}!</p>
        </div>
      `;
    } else if (args.status === "completed") {
      subject = `Repair Completed! ${order.ticket_number} - ${shopName}`;
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #22C55E;">Great news! Your repair is complete.</h2>
          <p>Hi ${order.customer_name},</p>
          <p>Your <strong>${order.device_brand} ${order.device_model}</strong> is ready for pickup at <strong>${shopName}</strong>.</p>
          <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Ticket Number:</strong> ${order.ticket_number}</p>
            <p style="margin: 5px 0;"><strong>Work Performed:</strong> ${order.work_performed}</p>
            <p style="margin: 5px 0;"><strong>Total Balance:</strong> ${(order.total_cost / 100).toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>Deposit Paid:</strong> -${(order.deposit_amount / 100).toFixed(2)}</p>
            <p style="margin: 10px 0; font-size: 18px; color: #F97316;"><strong>Amount Due:</strong> ${((order.total_cost - order.deposit_amount) / 100).toFixed(2)}</p>
          </div>
          <p>View full details on the portal:</p>
          <p><a href="${portalUrl}" style="background: #22C55E; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Repair Order</a></p>
          <p>You can pick up your device during our normal business hours.</p>
          <p>Questions? Give us a call at <strong>${shopPhone}</strong>.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #666;">We appreciate your business!</p>
        </div>
      `;
    }

    try {
      await resend.emails.send({
        from: `${shopName} <repairs@app.cto.new>`,
        to: [order.customer_email],
        subject: subject,
        html: html,
      });
      console.log("Email sent successfully to", order.customer_email);
    } catch (error) {
      console.error("Failed to send email", error);
    }

    return null;
  },
});
