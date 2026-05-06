import { drizzle } from 'drizzle-orm/neon-http';
import 'dotenv/config'
import { users } from './db/schema';

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  
  const db = drizzle(connectionString);



  async function main() {
    const newUser: typeof users.$inferInsert = {
      name: "John",
      email: "john@example.com",
    };
  
    // ✅ insert into TABLE, not object
    await db.insert(users).values(newUser);
  
    console.log("New user created!");
  
    // ✅ select from TABLE
    const allUsers = await db.select().from(users);
  
    console.log(allUsers);
  }
  
  main();