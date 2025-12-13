import { LoginForm } from "@/components/auth/login-form";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-background">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col gap-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">UPAY MoM</h1>
          <p className="text-muted-foreground">
            Minutes of Meeting & Task Management
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
