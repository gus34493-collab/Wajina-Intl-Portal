"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createInstitutionalRequest(data: {
  title: string;
  details: string;
  amount?: number;
  senderId: string;
  senderRole: string;
  campus: string;
}) {
  try {
     const request = await prisma.request.create({
       data: {
         title: data.title,
         description: data.details,
         level: 'K1', // Defaulting to K1 for general institutional requests
         status: 'PENDING',
         senderId: data.senderId,
         // We might need a receiverId if we route to specific roles, 
         // but usually, it goes to the queue for DIRECTOR/BURSAR.
       }
     });

     revalidatePath("/expense-approval");
     return { success: true, request };
  } catch (err: any) {
    console.error("Request creation failed:", err);
    return { success: false, error: err.message };
  }
}
