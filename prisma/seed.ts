import { PrismaClient, CreatorTier, FeedPostType } from "@prisma/client";

const prisma = new PrismaClient();

async function ensureCreator(userId: string, handle: string, displayName: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { isCreator: true },
  });

  const normalizedHandle = handle.toLowerCase().replace(/[^a-z0-9_-]/g, "");
  const profile = await prisma.creatorProfile.upsert({
    where: { userId },
    update: {
      handle: normalizedHandle,
      displayName,
    },
    create: {
      userId,
      handle: normalizedHandle,
      displayName,
      bio: "Cloudus-powered creator building marketplace experiences.",
      tagline: "Cloudus Creator",
      avatarUrl: "https://utfs.io/f/zFJP5UraSTwK07wECkD6zpt79ehTVJxMrYIoKdqLl2gOj1Zf",
      coverUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
      skills: ["Product", "Operations", "Design"],
      focusAreas: ["Laundry", "Commerce"],
      tier: CreatorTier.PARTNER,
    },
  });

  await prisma.creatorEarning.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      totalCents: 1500000,
      availableCents: 450000,
      lockedCents: 200000,
    },
  });

  return profile;
}

async function main() {
  const founder = await prisma.user.upsert({
    where: { email: "founder@cloudus.digital" },
    update: { name: "Cloudus Founder", isCreator: true },
    create: { email: "founder@cloudus.digital", name: "Cloudus Founder", isCreator: true },
  });
  const founderProfile = await ensureCreator(founder.id, "cloudus", "Cloudus Digital");

  const contributor = await prisma.user.upsert({
    where: { email: "creator@cloudus.digital" },
    update: { name: "Cloudus Creator", isCreator: true },
    create: { email: "creator@cloudus.digital", name: "Cloudus Creator", isCreator: true },
  });
  const contributorProfile = await ensureCreator(contributor.id, "creatorx", "Creator X");

  await prisma.creatorFollow.upsert({
    where: {
      followerId_followingId: { followerId: contributorProfile.id, followingId: founderProfile.id },
    },
    update: {},
    create: {
      followerId: contributorProfile.id,
      followingId: founderProfile.id,
    },
  });

  const project = await prisma.project.create({
    data: {
      name: "Cloudus Laundry Launch",
      type: "Service",
      category: "Laundry",
      tags: ["laundry", "logistics", "creator"],
      visibility: "PUBLIC",
      heroVideo: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      price: 450000,
      description: "Customer bookings, supplier fulfilment, creator collaborations.",
      link: "https://cloudus.digital/laundry",
      links: ["https://www.instagram.com/cloudusdigital"],
      api: "project-seed",
      createdById: founder.id,
      followers: {
        create: [{ userId: founder.id }, { userId: contributor.id }],
      },
    },
  });

  const shopItem = await prisma.shopItem.create({
    data: {
      name: "Laundry 5kg Bag",
      type: "Service",
      price: 25000,
      description: "Wash, dry & fold (48h).",
      link: "/shop/laundry-5kg",
      links: [],
      api: "",
      createdById: founder.id,
    },
  });

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

  const pickupTask = await prisma.projectTask.create({
    data: {
      projectId: project.id,
      title: "Pickup & intake",
      description: "Collect garments, tag & prep for washing.",
      budgetCents: 120000,
      skills: ["Logistics", "Customer Service"],
    },
  });
  const washTask = await prisma.projectTask.create({
    data: {
      projectId: project.id,
      title: "Wash & dry cycle",
      description: "Operate machines, ensure QA, prep for delivery.",
      budgetCents: 180000,
      skills: ["Laundry", "QA"],
    },
  });
  const contentTask = await prisma.projectTask.create({
    data: {
      projectId: project.id,
      title: "Creator content drop",
      description: "Film a short behind-the-scenes reel promoting Cloudus.",
      budgetCents: 90000,
      skills: ["Content", "Video"],
    },
  });

  await prisma.collaborationInvite.create({
    data: {
      projectId: project.id,
      taskId: contentTask.id,
      inviterId: founder.id,
      inviteeId: contributor.id,
      message: "Cover the content drop for the laundry launch.",
    },
  });

  await prisma.projectBid.create({
    data: {
      projectId: project.id,
      userId: contributor.id,
      amount: pickupTask.budgetCents + washTask.budgetCents,
      message: "My crew can handle pickups and washing for the week.",
      tasks: {
        create: [{ taskId: pickupTask.id }, { taskId: washTask.id }],
      },
    },
  });

  const itemOrder = await prisma.order.create({
    data: {
      name: "Laundry Order",
      createdById: founder.id,
      price: 30000,
      description: "5kg bag + delivery",
      link: "",
      api: "",
      links: [],
      createdForId: shopItem.id,
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

  await prisma.delivery.create({
    data: {
      orderId: itemOrder.id,
      status: "SCHEDULED",
      pickupWindowStart: new Date(),
      pickupWindowEnd: new Date(Date.now() + 60 * 60 * 1000),
      dropoffWindowStart: new Date(Date.now() + 2 * 60 * 60 * 1000),
      dropoffWindowEnd: new Date(Date.now() + 4 * 60 * 60 * 1000),
      notes: "Seed delivery for demo data",
    },
  });

  const feedPost = await prisma.feedPost.create({
    data: {
      creatorId: founderProfile.id,
      projectId: project.id,
      type: FeedPostType.PROJECT_UPDATE,
      title: "Laundry launch going live",
      caption: "Bookings open + creator collabs. Tap to join the project or claim a task.",
      tags: ["laundry", "launch"],
      coverImage: "https://images.unsplash.com/photo-1514996937319-344454492b37",
      media: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
            type: "IMAGE",
          },
        ],
      },
    },
  });

  await prisma.feedReaction.create({
    data: {
      postId: feedPost.id,
      userId: contributor.id,
      type: "LIKE",
    },
  });

  await prisma.adminAnnouncement.create({
    data: {
      title: "Welcome to Cloudus Creators",
      body:
        "Explore the new creator feed, claim tasks on marketplace projects, and share your launches with the community.",
      audience: "CREATORS",
      link: "/feed",
      createdById: founder.id,
    },
  });

  await prisma.adminReviewQueue.create({
    data: {
      feedPostId: feedPost.id,
      status: "APPROVED",
      reviewerId: founder.id,
      reason: "Seed content auto-approved",
      reviewedAt: new Date(),
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
