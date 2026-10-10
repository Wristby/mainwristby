import { users, type User, type UpsertUser } from "@shared/models/auth";
import { db } from "../../db";
import { eq } from "drizzle-orm";

// Interface for auth storage operations
// (IMPORTANT) These user operations are mandatory for Replit Auth.
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // The active schema requires username/password registration. This unused
    // legacy adapter may update an existing profile, but must not invent
    // credentials or create passwordless accounts if enabled accidentally.
    const { id, email, firstName, lastName, profileImageUrl } = userData;
    const [user] = await db
      .update(users)
      .set({
        email,
        firstName,
        lastName,
        profileImageUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    if (!user) throw new Error("Register a username/password account before updating this profile.");
    return user;
  }
}

export const authStorage = new AuthStorage();
