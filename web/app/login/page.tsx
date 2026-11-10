import { LoginForm } from "@/components/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = params.next ?? "/";

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <LoginForm nextPath={nextPath} />
    </div>
  );
}
