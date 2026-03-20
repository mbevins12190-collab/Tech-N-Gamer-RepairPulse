import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

auth.addHttpRoutes(http);

// ZPL Label Endpoint
http.route({
  path: "/api/tickets/zpl",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    
    if (!id) return new Response("Missing ticket ID", { status: 400 });

    const order: any = await ctx.runQuery(internal.repairs_internal.getOrderDetails, { repairOrderId: id as any });
    
    if (!order) return new Response("Ticket not found", { status: 404 });

    const date = new Date(order._creationTime).toLocaleDateString();
    
    // Simple ZPL for 2x1" label
    // ^XA - Start
    // ^FO50,50^A0N,36,36^FD${order.ticket_number}^FS
    // ^FO50,100^A0N,24,24^FD${order.customer_name}^FS
    // ^FO50,130^A0N,24,24^FD${order.device_brand} ${order.device_model}^FS
    // ^FO50,160^A0N,20,20^FD${date}^FS
    // ^FO300,50^BY2^BCN,60,Y,N,N^FD${order.ticket_number}^FS
    // ^XZ - End
    const zpl = `^XA
^CI28
^FO50,30^A0N,40,40^FD${order.ticket_number}^FS
^FO50,80^A0N,24,24^FD${order.customer_name}^FS
^FO50,110^A0N,24,24^FD${order.device_brand} ${order.device_model}^FS
^FO50,140^A0N,20,20^FD${date}^FS
^FO50,170^BY2^BCN,60,Y,N,N^FD${order.ticket_number}^FS
^XZ`;

    return new Response(zpl, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }),
});

export default http;
