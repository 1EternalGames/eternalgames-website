// app/lib/authOptions.ts

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import TwitterProvider from "next-auth/providers/twitter";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        CredentialsProvider({
            id: 'credentials',
            name: "Credentials",
            credentials: {
                email: { label: "البريد", type: "email" },
                password: { label: "كلمة السر", type: "password" },
                returnTo: { label: "Return To", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) throw new Error("البياناتُ ناقصة.");
                const user = await prisma.user.findUnique({ where: { email: credentials.email } });
                if (!user) throw new Error("لا حساب بهذا البريد. تفضل بالتسجيل.");
                if (!user.password) throw new Error("هذا الحساب مربوط بمزود خارجي.");
                const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
                if (isPasswordValid) return user;
                else throw new Error("كلمة السر خاطئة.");
            }
        }),
        CredentialsProvider({
            id: 'signup',
            name: "SignUp",
            credentials: {
                email: { label: "البريد", type: "email" },
                password: { label: "كلمة السر", type: "password" },
                returnTo: { label: "Return To", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials) throw new Error("تفاصيل التسجيل ناقصة.");
                const { email, password } = credentials;
                if (!email || !password) throw new Error("الحقولُ كلُّها لازمة.");
                if (!/\S+@\S+\.\S+/.test(email)) throw new Error('البريد الإلكتروني غير صالح.');
                if (password.length < 8) throw new Error('كلمة السر لا تقل عن ثمانيةِ حروف.');
                
                const existingEmail = await prisma.user.findUnique({ where: { email } });
                if (existingEmail) throw new Error('بريدٌ مسجل.');

                const hashedPassword = await bcrypt.hash(credentials.password, 10);
                const newUser = await prisma.user.create({
                    data: {
                        email: credentials.email,
                        password: hashedPassword,
                    }
                });
                return newUser;
            }
        }),
        GithubProvider({ 
            clientId: process.env.AUTH_GITHUB_ID as string, 
            clientSecret: process.env.AUTH_GITHUB_SECRET as string, 
        }),
        GoogleProvider({ 
            clientId: process.env.GOOGLE_CLIENT_ID as string, 
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string, 
        }),
        TwitterProvider({ 
            clientId: process.env.TWITTER_CLIENT_ID as string, 
            clientSecret: process.env.TWITTER_CLIENT_SECRET as string, 
            version: "2.0", 
        }),
    ],
    events: {
        createUser: async ({ user }: any) => {
            const userRole = await prisma.role.findUnique({ where: { name: 'USER' } });
            if (userRole) {
                await prisma.user.update({ 
                    where: { id: user.id }, 
                    data: { roles: { connect: { id: userRole.id } } } 
                });
            }
        }
    },
    session: { strategy: "jwt" as const },
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        async signIn({ user }: any) {
            return true;
        },
        async jwt({ token, user, trigger }: any) {
            if (user || trigger === "update") {
                const dbUser = await prisma.user.findUnique({
                    where: { id: (token.id as string) || user?.id },
                    include: { roles: true }
                });

                if (dbUser) {
                    token.id = dbUser.id;
                    token.picture = dbUser.image;
                    token.name = dbUser.name;
                    token.roles = dbUser.roles.map(role => role.name);
                    token.username = dbUser.username;
                    token.needsOnboarding = !dbUser.name || !dbUser.username;
                }
            }
            return token;
        },
        async session({ session, token }: any) {
            if (token && session.user) {
                session.user.id = token.id;
                session.user.roles = token.roles;
                session.user.name = token.name;
                session.user.email = token.email;
                session.user.image = token.picture;
                session.user.username = token.username;
                session.needsOnboarding = token.needsOnboarding;
            }
            return session;
        },
    },
    pages: { signIn: '/', error: '/', },
};


