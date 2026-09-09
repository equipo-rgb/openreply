import { describe, expect, it } from "vitest";
import { construirAviso } from "@/lib/vigilancia/aviso";

describe("construirAviso", () => {
  it("no avisa cuando no hay nada que contar", () => {
    expect(construirAviso({ fallos: [], tokensPorCaducar: [] })).toBeNull();
  });

  it("agrupa los fallos por motivo, en vez de una línea por persona", () => {
    const aviso = construirAviso({
      fallos: [
        { campana: "Skills", cuenta: "soymartintoledo", motivo: "no acepta mensajes" },
        { campana: "Skills", cuenta: "soymartintoledo", motivo: "no acepta mensajes" },
        { campana: "Skills", cuenta: "soymartintoledo", motivo: "token caducado" },
      ],
      tokensPorCaducar: [],
    });
    expect(aviso).toContain("3 DMs fallidos");
    expect(aviso).toMatch(/2.*no acepta mensajes/);
    expect(aviso).toMatch(/1.*token caducado/);
  });

  it("avisa de un token a punto de caducar aunque no haya fallos", () => {
    const aviso = construirAviso({
      fallos: [],
      tokensPorCaducar: [{ cuenta: "paurodriguez.ia", dias: 3 }],
    });
    expect(aviso).toContain("paurodriguez.ia");
    expect(aviso).toContain("3 días");
  });

  it("un motivo vacío no se cuela como línea en blanco", () => {
    const aviso = construirAviso({
      fallos: [{ campana: "X", cuenta: "y", motivo: "" }],
      tokensPorCaducar: [],
    });
    expect(aviso).toContain("sin motivo registrado");
  });
});
