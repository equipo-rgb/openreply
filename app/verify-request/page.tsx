import Link from "next/link";

export const metadata = {
  title: "Revisa tu correo - OpenReply",
  description: "Te hemos enviado un enlace de acceso por correo.",
};

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-foreground">
            OpenReply
          </h1>
        </div>

        <div className="panel rounded p-8 text-center">
          <h2 className="text-lg font-semibold mb-2">Revisa tu correo</h2>
          <p className="text-sm text-muted">
            Te hemos enviado un enlace de acceso seguro. Ábrelo en este dispositivo para
            continuar.
          </p>
          <p className="mt-6 text-sm">
            <Link href="/login" className="text-accent hover:underline">
              Volver a entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
