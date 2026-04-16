"use server";
import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export const completeOnboarding = async (data) => {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const { role, title, company, yearsExp, bio, categories } = data;

  if (!role || !["INTERVIEWEE", "INTERVIEWER"].includes(role)) {
    throw new Error("Invalid role");
  }

  if (role === "INTERVIEWER") {
    if (!title || !company || !yearsExp || !bio || !categories?.length) {
      throw new Error("Please fill in all required fields");
    }
  }

  try {
    await db.user.update({
      where: { clerkUserId: user.id },
      data: {
        role,
        ...(role === "INTERVIEWER" && { title, company, yearsExp, bio, categories }),
      },
    });

    // ✅ Tell Clerk the user has completed onboarding
    const client = await clerkClient();
    await client.users.updateUserMetadata(user.id, {
      publicMetadata: { onboardingComplete: true },
    });

    return { success: true };
  } catch (error) {
    console.error("Onboarding error:", error);
    throw new Error("Something went wrong. Please try again.");
  }
};
