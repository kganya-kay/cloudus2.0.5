import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // 1) a user
  const user = await prisma.user.upsert({
    where: { email: "founder@cloudus.digital" },
    update: {},
    create: { email: "founder@cloudus.digital", name: "Cloudus Founder" },
  });

  // 2) a project
  await prisma.project.create({
    data: {
      name: "Cloudus Laundry",
      type: "Service",
      price: 0,
      description: "Online booking + fulfilment, powered by Cloudus.",
      link: "https://cloudus.digital/laundry",
      links: [],
      api: "",
      createdById: user.id,
    },
  });

  // 3) a shop item (e.g., Laundry 5kg bag)
  const item = await prisma.shopItem.create({
    data: {
      name: "Laundry 5kg Bag",
      type: "Service",
      price: 25000, // cents = R250.00
      description: "Wash, dry & fold (48h).",
      link: "/shop/laundry-5kg",
      links: [],
      api: "",
      createdById: user.id,
    },
  });

  // 4) a supplier
  const supplier = await prisma.supplier.create({
    data: {
      name: "QuickWash JHB",
      phone: "27640000000",
      email: "ops@quickwash.example",
      city: "Johannesburg",
      suburb: "Rosebank",
      isActive: true,
    },
  });

  // 5) a job post
  await prisma.job.create({
    data: {
      slug: "local-business-caretaker",
      title: "Local Business Caretaker",
      summary:
        "Own day-to-day ops: open/close, record sales, run laundry workflow, serve clients end-to-end.",
      description:
        "Open/close shop, POS & cash-up, intake/tagging, washing/drying/pressing, pickups/deliveries, weekly reports.",
      employmentType: "FULL_TIME",
      onsiteType: "ONSITE",
      locationCity: "Johannesburg",
      remoteAllowed: false,
      tags: ["Operations", "Laundry", "Customer Service"],
      status: "OPEN",
      applyEmail: "careers@cloudusdigital.com",
      applyWhatsapp: "27640204765",
      createdById: user.id,
    },
  });

  // 6) an example order
  await prisma.order.create({
    data: {
      name: "Laundry Order",
      createdById: user.id,
      price: 30000,
      description: "5kg bag + delivery",
      link: "",
      api: "",
      links: [],
      createdForId: item.id,
      customerName: "First Test",
      customerPhone: "27640000001",
      addressLine1: "123 Test St",
      suburb: "Rosebank",
      city: "Johannesburg",
      deliveryCents: 5000,
      currency: "ZAR",
      status: "SOURCING_SUPPLIER",
      supplierId: supplier.id,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

