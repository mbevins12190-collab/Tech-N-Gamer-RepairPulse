# Tech-N-Gamer Management System

A full-stack electronics repair shop management system built with TanStack Start, Convex, and Tailwind CSS.

## Features
- **Intake Flow**: 4-step stepper for customer, device, issue, and review.
- **Real-time Dashboard**: Live status tracking and shop statistics.
- **Repair Cycle**: Intake -> Diagnosis -> Work Performed -> Parts & Labor -> Completion -> Receipt.
- **PDF Generation**: Automatic work order generation with barcodes.
- **Barcode Scanner Support**: Plug-and-play support for rapid barcode input.
- **Admin Control**: User management and shop configuration.
- **ZPL Label Support**: Raw ZPL output for Zebra printers via `/api/tickets/zpl?id=TICKET_ID`.

## Technology Stack
- **Frontend**: TanStack Start (React, File-based Routing, SSR)
- **Backend**: Convex (Real-time DB, Server Functions, Auth)
- **Styling**: Tailwind CSS v4
- **PDF/Barcode**: pdfkit, bwip-js
- **Icons**: Lucide React
- **Animations**: Framer Motion

## LAN Access Instructions
To access the system from another device on your Local Area Network (LAN):
1. Find your server's IP address (e.g., `192.168.1.50`).
2. Ensure your firewall allows traffic on port `3000`.
3. Open `http://192.168.1.50:3000` on any device connected to the same network.

## First-Run Setup
The system automatically detects if no users exist. 
1. The first user to sign up will be granted **Administrator** privileges.
2. Go to **Admin Panel > Shop Settings** to configure your shop's name, phone, and address for receipts and work orders.

## Running in Development
- `npm run dev`: Starts the Vite dev server and Convex backend concurrently.
- `npx tsc --noEmit`: Runs type checking.
