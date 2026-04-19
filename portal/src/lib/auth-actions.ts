"use server";

import { signIn, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { loginSchema, registerSchema } from "@/lib/validators";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

export interface ActionResult {
  success: boolean;
  error?: string;
}

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const rawData = {
    username: formData.get("username") as string,
    password: formData.get("password") as string,
  };

  const parsed = loginSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Data tidak valid",
    };
  }

  try {
    await signIn("credentials", {
      username: parsed.data.username,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, error: "Username atau password salah" };
        default:
          return { success: false, error: "Terjadi kesalahan saat login" };
      }
    }
    throw error; // re-throw redirect errors from next-auth
  }
}

export async function registerAction(
  formData: FormData
): Promise<ActionResult> {
  const rawData = {
    name: formData.get("name") as string,
    username: formData.get("username") as string,
    nip: (formData.get("nip") as string) || undefined,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
    role: formData.get("role") as string,
  };

  const parsed = registerSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Data tidak valid",
    };
  }

  const existingUser = await db.user.findUnique({
    where: { username: parsed.data.username },
  });

  if (existingUser) {
    return { success: false, error: "Username sudah terdaftar" };
  }

  // Check NIP uniqueness if provided
  if (parsed.data.nip) {
    const existingNip = await db.user.findUnique({
      where: { nip: parsed.data.nip },
    });
    if (existingNip) {
      return { success: false, error: "NIP sudah terdaftar oleh akun lain" };
    }
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 12);

  await db.user.create({
    data: {
      username: parsed.data.username,
      name: parsed.data.name,
      hashedPassword,
      role: parsed.data.role,
      nip: parsed.data.nip || null,
    },
  });

  return { success: true };
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
