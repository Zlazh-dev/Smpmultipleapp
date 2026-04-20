const {PrismaClient} = require('./node_modules/.prisma/client');
const p = new PrismaClient();
p.printTemplate.findMany({where:{isActive:true},select:{id:true,nama:true}})
  .then(t => console.log(JSON.stringify(t)))
  .catch(e => console.error(e))
  .finally(() => p.$disconnect());
