import { describe, expect, it } from "vitest";
import { construirAviso, firmaDelAviso } from "@/lib/vigilancia/aviso";

describe("construirAviso", () => {
  it("no avisa cuando no hay nada que contar", () => {
    expect(construirAviso({ fallos: [], tokensPorCaducar: [] })).toBeNull();
  });

  it("agrupa los fallos por motivo, en vez de una línea por persona", () => {
    const aviso = construirAviso({
      fallos: [
        { campana: "Skills", cuenta: "soymartintoledo", motivo: "límite por hora alcanzado" },
        { campana: "Skills", cuenta: "soymartintoledo", motivo: "límite por hora alcanzado" },
        { campana: "Skills", cuenta: "soymartintoledo", motivo: "token caducado" },
      ],
      tokensPorCaducar: [],
    });
    expect(aviso).toContain("3 DMs fallidos");
    expect(aviso).toMatch(/2.*límite por hora/);
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

describe("firmaDelAviso", () => {
  it("no cambia porque haya más fallos del mismo tipo", () => {
    const uno = firmaDelAviso({
      fallos: [{ campana: "A", cuenta: "m", motivo: "no acepta mensajes" }],
      tokensPorCaducar: [],
    });
    const varios = firmaDelAviso({
      fallos: [
        { campana: "A", cuenta: "m", motivo: "no acepta mensajes" },
        { campana: "B", cuenta: "p", motivo: "no acepta mensajes" },
      ],
      tokensPorCaducar: [],
    });
    expect(uno).toBe(varios);
  });

  it("cambia cuando aparece un problema distinto", () => {
    const antes = firmaDelAviso({
      fallos: [{ campana: "A", cuenta: "m", motivo: "no acepta mensajes" }],
      tokensPorCaducar: [],
    });
    const despues = firmaDelAviso({
      fallos: [
        { campana: "A", cuenta: "m", motivo: "no acepta mensajes" },
        { campana: "A", cuenta: "m", motivo: "token caducado" },
      ],
      tokensPorCaducar: [],
    });
    expect(antes).not.toBe(despues);
  });
});

describe("ruido del destinatario", () => {
  it("no avisa cuando todos los fallos son cosa del destinatario", () => {
    const aviso = construirAviso({
      fallos: [
        { campana: "A", cuenta: "m", motivo: "Meta API Error 551: This person isn't available right now" },
        { campana: "A", cuenta: "m", motivo: "Message is outside of allowed window" },
      ],
      tokensPorCaducar: [],
    });
    expect(aviso).toBeNull();
  });

  it("avisa del fallo real y resume los ignorados en una línea", () => {
    const aviso = construirAviso({
      fallos: [
        { campana: "A", cuenta: "m", motivo: "Meta API Error 190: token caducado" },
        { campana: "A", cuenta: "m", motivo: "Message is outside of allowed window" },
        { campana: "A", cuenta: "m", motivo: "Requested user cannot be found" },
      ],
      tokensPorCaducar: [],
    });
    expect(aviso).toContain("190");
    expect(aviso).toContain("2 más por ajustes del destinatario");
    expect(aviso).not.toContain("allowed window");
  });

  it("un error desconocido sí avisa: callarse lo que no entendemos es peor", () => {
    const aviso = construirAviso({
      fallos: [{ campana: "A", cuenta: "m", motivo: "Algo raro que nadie ha visto antes" }],
      tokensPorCaducar: [],
    });
    expect(aviso).toContain("Algo raro");
  });
});
