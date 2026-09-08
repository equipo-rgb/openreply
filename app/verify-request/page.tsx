import Link from "next/link";

export const metadata = {
  title: "Revisa tu correo - OpenReply",
  description: "Te hemos enviado un enlace de acceso por correo.",
};

export default function VerifyRequestPage() {
  return (
    <div className="dia-ui ui-wallpaper min-h-dvh flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="ui-brand mb-5" aria-hidden="true">OR</span>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            OpenReply
          </h1>
        </div>

        <div className="ui-glass rounded-2xl p-8 text-center">
          <h2 className="text-lg font-semibold mb-2">Revisa tu correo</h2>
          <p className="text-sm text-muted">
            Te hemos enviado un enlace de acceso seguro. Ábrelo en este dispositivo para
            continuar.
          </p>
          <p className="mt-6 text-sm">
            <Link href="/login" className="ui-button w-full">
              Volver a entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
