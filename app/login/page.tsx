import { EMAIL_PROVIDER_ID, signIn } from "@/lib/auth";
import { getCampaignTemplate } from "@/lib/templates/campaign-templates";
import { DemoNotice } from "@/components/demo-notice";

export const metadata = {
  title: "Entrar - OpenReply",
  description: "Entra para gestionar campañas de comentarios a DM en Instagram.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    checkEmail?: string;
    callbackUrl?: string;
    template?: string;
  }>;
}) {
  const params = await searchParams;
  const checkEmail = params.checkEmail === "1";
  const selectedTemplate = getCampaignTemplate(params.template);
  const templateCallbackUrl = selectedTemplate
    ? `/campaigns/new?template=${selectedTemplate.slug}`
    : null;
  const callbackUrl = params.callbackUrl ?? templateCallbackUrl ?? "/dashboard";

  async function sendMagicLink(formData: FormData) {
    "use server";
    await signIn(EMAIL_PROVIDER_ID, {
      email: String(formData.get("email") ?? ""),
      redirectTo: callbackUrl,
    });
  }

  return (
    <div className="dia-ui ui-wallpaper min-h-dvh flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="ui-brand mb-5" aria-hidden="true">OR</span>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            OpenReply
          </h1>
          <p className="text-muted text-sm leading-relaxed mt-2">
            {selectedTemplate
              ? `Entra para usar la plantilla ${selectedTemplate.title}.`
              : "Entra con tu correo y conecta tu cuenta profesional de Instagram."}
          </p>
        </div>

        <DemoNotice variant="panel" />

        <div className="ui-glass rounded-2xl p-6 sm:p-8">
          {selectedTemplate && !checkEmail && (
            <div className="mb-5 rounded-lg border border-accent/20 bg-accent/10 p-4">
              <p className="text-xs font-medium text-accent">
                Plantilla seleccionada
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {selectedTemplate.title}
              </p>
            </div>
          )}

          {checkEmail ? (
            <div className="text-center py-4">
              <h2 className="text-lg font-semibold mb-2">Revisa tu correo</h2>
              <p className="text-sm text-muted">
                Te hemos enviado un enlace de acceso seguro. Ábrelo en este dispositivo para
                continuar.
              </p>
            </div>
          ) : (
            <form action={sendMagicLink} className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="ui-label block"
                >
                  Correo de trabajo
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="tu@empresa.com"
                  className="ui-field"
                />
              </div>

              <button
                type="submit"
                className="ui-button ui-button-primary w-full"
              >
                Enviar enlace de acceso
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
