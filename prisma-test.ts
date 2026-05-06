import { prisma } from "./lib/db";
async function test() {
  try {
    const user = await prisma.user.findFirst();
    // @ts-ignore
    console.log("githubAccessToken in user:", user ? 'githubAccessToken' in user : "No user found");
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
