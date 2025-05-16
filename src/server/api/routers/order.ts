import { z } from "zod";
import sgMail from '@sendgrid/mail';
if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable is not set");
}
sgMail.setApiKey(process.env.SENDGRID_API_KEY );


import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const orderRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  create: publicProcedure
    .input(z.object({ name: z.string(), description : z.string(), type: z.string(), itemId: z.number(), contactNumber: z.number(),price: z.number()}))
    .mutation(async ({ ctx, input }) => {

      if (input.name) {

        const msg = {
          to: 'kganyakekana@gmail.com', // Change to your recipient
          from: 'kganyakekana@gmail.com', // Change to your verified sender
          subject: 'order received',
          text: '',
          html: '<strong>Order Received from</strong>' + input?.name + '<br> <strong>Contact Number</strong>' + input?.contactNumber + '<br> <strong>Item Type</strong>' + input?.type + '<br> <strong>Item Description</strong>' + input?.description,
        }
        sgMail
          .send(msg)
          .then(() => {
            console.log('Email sent')
          })
          .catch((error) => {
            console.error(error)
          })
      }


      return ctx.db.order.create({
        data: {
          name: input.name,
          createdBy: { connect: { id: ctx.session? ctx.session.user.id : "cm55nwppt000013smfhzgcutj"} } ,
          price: input.price,
          description: input.description + "contact Number=" + input.contactNumber,      
          link: "Link to item not set",
          links: [input.contactNumber.toString()],
          api: ctx.session ? input.type : "Signed Out Order" ,
           
          createdFor:  {connect: {
            id : input.itemId
          }}        
        },
      });
    }),

  getLatest: publicProcedure.query(async ({ ctx }) => {
    const order = await ctx.db.order.findFirst({
      orderBy: { createdAt: "desc" },
    });

    return order ?? null;
  }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    const allOrders = await ctx.db.order.findMany({
      orderBy: { createdAt: "desc" },
      
    });

    return allOrders ?? null;
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});