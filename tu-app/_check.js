const {PrismaClient} = require('./node_modules/.prisma/client');
const p = new PrismaClient();
p.printTemplate.findMany({select:{id:true,nama:true,isActive:true}})
  .then(t => console.log(JSON.stringify(t, null, 2)))
  .catch(e => console.error(e))
  .finally(() => p.$disconnect());
