import { z } from "zod";
export const SignUpSchema = z.object({
  firstname: z
    .string()
    .min(4, "The Firstname Should have atleast 4 Characters")
    .nonempty(),
  lastname: z
    .string()
    .min(4, "The Lastname Should have atleast 4 Characters")
    .optional(),
  email: z
    .string()
    .email("Invaild Email Formate")
    .nonempty("Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters").max(32),
  photo: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z
    .string()
    .email("Invaild Email Formate")
    .nonempty("Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters").max(32),
});

export const RoomSchema = z.object({
  name: z.string().min(4).max(20),
});
