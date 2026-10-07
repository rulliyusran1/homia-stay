import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// 1. Get All Rooms Endpoint
app.get('/api/rooms', async (req: Request, res: Response) => {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        tenants: {
          where: { checkOutDate: null },
          select: { fullName: true, phone: true }
        }
      }
    });
    res.json({ success: true, data: rooms });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch rooms' });
  }
});

// 2. Automated Monthly Billing Generator Handler
app.post('/api/bills/generate', async (req: Request, res: Response) => {
  try {
    const activeRooms = await prisma.room.findMany({
      where: { status: 'OCCUPIED' },
      include: { tenants: { where: { checkOutDate: null } } },
    });

    const generatedBills = [];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    for (const room of activeRooms) {
      if (room.tenants.length === 0) continue;
      const tenant = room.tenants[0];
      const invoiceNumber = `INV-${room.roomNumber}-${Date.now().toString().slice(-6)}`;
      
      const newBill = await prisma.bill.create({
        data: {
          roomId: room.id,
          tenantId: tenant.id,
          amount: room.priceMonthly,
          utilityCost: 150000.00,
          dueDate,
          invoiceNumber,
          status: 'PENDING',
        },
      });
      generatedBills.push(newBill);
    }

    res.status(201).json({
      success: true,
      message: `Successfully generated ${generatedBills.length} monthly invoices.`,
      data: generatedBills,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// 3. WhatsApp Payment Reminder Generator
app.get('/api/bills/:billId/whatsapp-reminder', async (req: Request, res: Response) => {
  try {
    const { billId } = req.params;
    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: { tenant: true, room: true },
    });

    if (!bill) {
      res.status(404).json({ success: false, error: 'Bill not found' });
      return;
    }

    const totalAmount = Number(bill.amount) + Number(bill.utilityCost);
    const formattedDate = new Date(bill.dueDate).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const message = `Halo Kak *${bill.tenant.fullName}*, salam hangat dari Manajemen *Homia Stay*. 🏠\n\nPengingat tagihan untuk Kamar *${bill.room.roomNumber}* periode bulan ini:\n\n*No. Invoice:* ${bill.invoiceNumber}\n*Sewa Kamar:* Rp ${Number(bill.amount).toLocaleString('id-ID')}\n*Token Listrik/Air:* Rp ${Number(bill.utilityCost).toLocaleString('id-ID')}\n*Total Tagihan:* *Rp ${totalAmount.toLocaleString('id-ID')}*\n*Jatuh Tempo:* ${formattedDate}\n\nMohon lakukan transfer ke rekening BCA 1234567890 a.n. Homia Stay dan kirimkan bukti transfer melalui balasan chat ini ya Kak. Terima kasih! 🙏`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${bill.tenant.phone}?text=${encodedMessage}`;

    res.status(200).json({ success: true, whatsappUrl, rawMessage: message });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate reminder' });
  }
});

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

app.listen(Number(PORT), HOST, () => {
  console.log(`🚀 Homia Stay Backend running at http://${HOST}:${PORT}`);
});