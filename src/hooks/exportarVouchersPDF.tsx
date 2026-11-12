import type { TDocumentDefinitions, Content } from "pdfmake/interfaces";
import pdfMakeModule from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// Resolve a compatibilidade de importação entre Vite/Webpack/ESM
const pdfMake: any = (pdfMakeModule as any).default || pdfMakeModule;
const vfsFonts: any = (pdfFonts as any).pdfMake
  ? (pdfFonts as any).pdfMake.vfs
  : (pdfFonts as any).default?.pdfMake?.vfs || (pdfFonts as any).vfs;

if (pdfMake && vfsFonts) {
  pdfMake.vfs = vfsFonts;
}

export interface DadosOperadora {
  nome: string;
  cnpj: string;
  endereco: string;
  logoBase64?: string;
}

const formatarMoeda = (valor: number | null | undefined): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor || 0);
};

// Formato exigido: "08/10/26, 16:00"
const formatarDataHoraProg = (dataIso?: string | null): string => {
  if (!dataIso) return "---";
  const d = new Date(dataIso);
  const data = d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
  const hora = d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${data}, ${hora}`;
};

const getBase64ImageFromUrl = async (
  imageUrl: string,
): Promise<string | null> => {
  try {
    if (!imageUrl || imageUrl.startsWith("data:")) return imageUrl;
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn("Falha ao converter logo para base64:", err);
    return null;
  }
};

/**
 * Monta o bloco visual de um único voucher (Layout Antigo / Referência)
 */
function renderVoucherCard(v: any, operadoraPadrao: DadosOperadora): Content {
  // 1. Cálculos de cobrança
  const valorViagem = Number(v.valorViagem || 0);
  const valorDeslocamento = Number(v.valorDeslocamento || 0);
  const valorHoraParada =
    Number(v.valorHoraParada || 0) * Number(v.qntTempoParado || 0);
  const valorEstacionamento = Number(v.valorEstacionamento || 0);
  const valorPedagio = Number(v.valorPedagio || 0);
  const totalCobranca =
    valorViagem +
    valorDeslocamento +
    valorHoraParada +
    valorEstacionamento +
    valorPedagio;

  // 2. Dados da Operadora
  const op = v.operadora;
  const nomeOperadora = op?.rSocial || op?.nome || operadoraPadrao.nome;
  const cnpjOperadora = op?.cnpj || operadoraPadrao.cnpj;

  let enderecoOperadora = operadoraPadrao.endereco;
  if (op?.endRua || op?.endCidade) {
    const partes = [
      op.endRua
        ? `${op.endRua}${op.endNumero ? `, N° ${op.endNumero}` : ""}`
        : null,
      op.endBairro,
      op.endCidade ? `${op.endCidade} - ${op.endUf || "BA"}` : null,
      op.cep ? `/ Cep: ${op.cep}` : null,
    ].filter(Boolean);
    enderecoOperadora = partes.join(" - ");
  }

  const logoOperadoraFinal =
    v._logoBase64Resolved || operadoraPadrao.logoBase64;
  const subtituloNatureza = `${v.natureza || "Fixo"} - ${v.tipoCorrida || "Saida"}`;

  // 3. Montagem da Lista de Passageiros (Formato Texto)
  const passageirosList = v.passageiros || [];
  const passageirosStack: Content[] = [
    {
      text: `Passageiros (${passageirosList.length}):`,
      bold: true,
      fontSize: 7,
      margin: [0, 6, 0, 2],
      color: "#111827",
    },
  ];

  if (passageirosList.length === 0) {
    passageirosStack.push({
      text: "Nenhum passageiro listado",
      fontSize: 6,
      italics: true,
      color: "#4B5563",
    });
  } else {
    passageirosList.forEach((p: any) => {
      const nome = p.passageiroId
        ? p.passageiroId.nome
        : p.nome || "Não especificado";
      const cc = p.passageiroId?.centroCustoClienteId.nome || "---";
      const bairro = p.passageiroId?.endBairro || "---";
      const cidade =
        p.cidade ||
        p.passageiroId?.cidade ||
        p.passageiroId?.enderecoCidade ||
        "";
      const local = cidade ? `${bairro} - ${cidade}` : bairro;

      passageirosStack.push({
        text: `• ${nome} | CC: ${cc} | Bairro: ${local}`.toUpperCase(),
        fontSize: 6,
        margin: [0, 1.5, 0, 1.5],
        color: "#111827",
      });
    });
  }

  // Assinatura
  const assinaturaValida =
    v.assinatura &&
    typeof v.assinatura === "string" &&
    v.assinatura.trim().length > 50
      ? v.assinatura.startsWith("data:")
        ? v.assinatura
        : `data:image/png;base64,${v.assinatura}`
      : null;

  return {
    margin: [4, 4, 4, 4], // Espaçamento entre a linha pontilhada de corte e a borda preta
    table: {
      widths: ["*"],
      heights: [360], // Altura fixa para a caixa com borda preta
      body: [
        [
          {
            // Tabela interna (O conteúdo do voucher)
            layout: "noBorders",
            table: {
              widths: ["*"],
              heights: ["*", "auto"],
              body: [
                [
                  // ================= CORPO DO VOUCHER =================
                  {
                    stack: [
                      // 1. Cabeçalho (Logo, Operadora, Voucher ID)
                      {
                        columns: [
                          {
                            width: 45,
                            stack: [
                              logoOperadoraFinal
                                ? {
                                    image: logoOperadoraFinal,
                                    width: 40,
                                    height: 40,
                                    alignment: "left",
                                  }
                                : {
                                    text: "Logo",
                                    fontSize: 10,
                                    alignment: "left",
                                    margin: [0, 10, 0, 0],
                                  },
                            ],
                          },
                          {
                            width: "*",
                            stack: [
                              {
                                text: nomeOperadora,
                                bold: true,
                                fontSize: 8,
                                color: "#111827",
                                margin: [0, 2, 0, 1],
                              },
                              {
                                text: `CNPJ: ${cnpjOperadora} | ${enderecoOperadora}`,
                                fontSize: 5.5,
                                color: "#4B5563",
                              },
                            ],
                          },
                          {
                            width: 80,
                            stack: [
                              {
                                text: "VOUCHER",
                                bold: true,
                                fontSize: 10,
                                color: "#DC2626",
                                alignment: "right",
                              },
                              {
                                text: `#${v.id}`,
                                bold: true,
                                fontSize: 11,
                                color: "#DC2626",
                                alignment: "right",
                              },
                              {
                                text: subtituloNatureza,
                                bold: true,
                                fontSize: 8,
                                color: "#111827",
                                alignment: "right",
                                margin: [0, 2, 0, 0],
                              },
                            ],
                          },
                        ],
                      },

                      // 2. Linha Divisória Cinza
                      {
                        margin: [0, 6, 0, 6],
                        canvas: [
                          {
                            type: "line",
                            x1: 0,
                            y1: 0,
                            x2: 265,
                            y2: 0,
                            lineWidth: 0.5,
                            lineColor: "#D1D5DB",
                          },
                        ],
                      },

                      // 3. Grid: Cliente x Programação
                      {
                        columns: [
                          {
                            width: "55%",
                            stack: [
                              {
                                text: [
                                  { text: "Cliente: ", bold: true },
                                  v.empresaCliente?.nome || "---",
                                ],
                                fontSize: 7,
                                color: "#111827",
                                margin: [0, 0, 0, 2],
                              },
                              {
                                text: [
                                  { text: "Unidade: ", color: "#6B7280" },
                                  {
                                    text: v.unidadeCliente?.nome
                                      ? `${v.unidadeCliente.nome} | ${v.unidadeCliente.endRua ? `${v.unidadeCliente.endRua}` : ""}`
                                      : "Matriz",
                                    color: "#6B7280",
                                  },
                                ],
                                fontSize: 6,
                              },
                            ],
                          },
                          {
                            width: "45%",
                            stack: [
                              {
                                text: [
                                  { text: "Prog: ", bold: true },
                                  formatarDataHoraProg(v.dataHoraProgramado),
                                ],
                                fontSize: 7,
                                color: "#111827",
                                alignment: "right",
                                margin: [0, 0, 0, 2],
                              },
                              {
                                text: [
                                  { text: "Trajeto: ", color: "#6B7280" },
                                  {
                                    text: `${v.origem || "---"} X ${v.destino || "---"}`,
                                    color: "#6B7280",
                                  },
                                ],
                                fontSize: 6,
                                alignment: "right",
                              },
                            ],
                          },
                        ],
                        margin: [0, 0, 0, 6],
                      },

                      // 4. Grid: Motorista x Pedágio
                      {
                        columns: [
                          {
                            width: "65%",
                            text: [
                              { text: "Motorista: ", bold: true },
                              v.motorista?.nome || "---",
                              { text: " | Veículo: ", bold: true },
                              `${v.carro?.modelo || "---"} - ${v.carro?.placa ? `${v.carro.placa}` : ""}`,
                            ],
                            fontSize: 7,
                            color: "#111827",
                          },
                          {
                            width: "35%",
                            text: [
                              { text: "T. Parado: ", bold: true },
                              `${v.qntTempoParado || 0}h`,
                              { text: " | Pedágio: ", bold: true },
                              v.valorPedagio ? "Sim" : "Não",
                            ],
                            fontSize: 7,
                            alignment: "right",
                            color: "#111827",
                          },
                        ],
                      },

                      // 5. Lista de Passageiros
                      {
                        stack: passageirosStack,
                        margin: [0, 4, 0, 0],
                      },
                    ],
                  },
                ],

                // ================= RODAPÉ DO VOUCHER =================
                [
                  {
                    columns: [
                      {
                        width: "*",
                        stack: [
                          {
                            text: `Viagem: ${formatarMoeda(valorViagem)} | Desloc: ${formatarMoeda(valorDeslocamento)}`,
                            fontSize: 6,
                            color: "#111827",
                            margin: [0, 0, 0, 1],
                          },
                          {
                            text: `H. Parada: ${formatarMoeda(valorHoraParada)} | Pedágio: ${formatarMoeda(valorPedagio)}`,
                            fontSize: 6,
                            color: "#111827",
                            margin: [0, 0, 0, 4],
                          },
                          {
                            text: `TOTAL COBRANÇA: ${formatarMoeda(totalCobranca)}`,
                            fontSize: 9,
                            bold: true,
                            color: "#16A34A",
                          },
                        ],
                      },
                      {
                        width: 100,
                        stack: [
                          assinaturaValida
                            ? {
                                image: assinaturaValida,
                                width: 60,
                                height: 25,
                                alignment: "center",
                                margin: [0, 0, 0, 2],
                              }
                            : { text: "", height: 25, margin: [0, 0, 0, 2] },
                          {
                            canvas: [
                              {
                                type: "line",
                                x1: 5,
                                y1: 0,
                                x2: 95,
                                y2: 0,
                                lineWidth: 0.5,
                                lineColor: "#111827",
                              },
                            ],
                          },
                          {
                            text: "Assinatura do Passageiro",
                            fontSize: 5,
                            color: "#6B7280",
                            alignment: "center",
                            margin: [0, 2, 0, 0],
                          },
                        ],
                        alignment: "right",
                      },
                    ],
                  },
                ],
              ],
            },
          },
        ],
      ],
    },
    // A borda preta externa e o espaçamento (padding) são aplicados de forma limpa pelo layout da tabela
    layout: {
      hLineWidth: () => 0.3,
      vLineWidth: () => 0.3,
      hLineColor: () => "#000000",
      vLineColor: () => "#000000",
      paddingLeft: () => 4,
      paddingRight: () => 4,
      paddingTop: () => 4,
      paddingBottom: () => 4,
    },
  } as Content; // Type assertion opcional que garante o silêncio do TypeScript
}

export async function exportarVouchersPDF(
  dados: any | any[],
  dadosOperadora?: Partial<DadosOperadora>,
) {
  const listaVouchersRaw: any[] = Array.isArray(dados) ? dados : [dados];

  const cacheLogos: Record<string, string | null> = {};
  const listaVouchers = await Promise.all(
    listaVouchersRaw.map(async (v) => {
      const urlLogo = v.operadora?.logoOperadora;
      let logoBase64 = null;

      if (urlLogo) {
        if (!cacheLogos[urlLogo]) {
          cacheLogos[urlLogo] = await getBase64ImageFromUrl(urlLogo);
        }
        logoBase64 = cacheLogos[urlLogo];
      }

      return {
        ...v,
        _logoBase64Resolved: logoBase64,
      };
    }),
  );

  const operadoraPadrao: DadosOperadora = {
    nome: dadosOperadora?.nome || "NEOFROTA GESTÃO DE TRANSPORTES",
    cnpj: dadosOperadora?.cnpj || "00.000.000/0001-00",
    endereco: dadosOperadora?.endereco || "Salvador - BA",
    logoBase64: dadosOperadora?.logoBase64,
  };

  const celulaVazia: Content = { text: "", margin: [0, 0, 0, 0] };
  const paginas: Content[] = [];

  for (let i = 0; i < listaVouchers.length; i += 4) {
    const grupo = listaVouchers.slice(i, i + 4);

    const v1 = grupo[0]
      ? renderVoucherCard(grupo[0], operadoraPadrao)
      : celulaVazia;
    const v2 = grupo[1]
      ? renderVoucherCard(grupo[1], operadoraPadrao)
      : celulaVazia;
    const v3 = grupo[2]
      ? renderVoucherCard(grupo[2], operadoraPadrao)
      : celulaVazia;
    const v4 = grupo[3]
      ? renderVoucherCard(grupo[3], operadoraPadrao)
      : celulaVazia;

    paginas.push({
      table: {
        widths: ["50%", "50%"],
        heights: [360, 360],
        body: [
          [v1, v2],
          [v3, v4],
        ],
      },
      layout: {
        hLineWidth: () => 0.3,
        vLineWidth: () => 0.3,
        hLineColor: () => "#9CA3AF", // Linha tracejada cinza (fora do voucher preto)
        vLineColor: () => "#9CA3AF",
        hLineStyle: () => ({ dash: { length: 4, space: 1 } }),
        vLineStyle: () => ({ dash: { length: 4, space: 1 } }),
      },
      pageBreak: i + 4 < listaVouchers.length ? "after" : undefined,
    });
  }

  const docDefinition: TDocumentDefinitions = {
    pageSize: "A4",
    pageOrientation: "portrait",
    pageMargins: [5, 5, 5, 5],
    content: paginas,
    defaultStyle: {
      font: "Roboto",
    },
  };

  const nomeArquivo =
    listaVouchers.length === 1
      ? `voucher_${listaVouchers[0].id}.pdf`
      : `vouchers_lote_${Date.now()}.pdf`;

  try {
    const instanciaPdfMake = pdfMake.createPdf ? pdfMake : pdfMake.default;
    instanciaPdfMake.createPdf(docDefinition).download(nomeArquivo);
  } catch (erro) {
    console.error("Erro ao gerar o PDF:", erro);
    alert("Ocorreu um erro ao gerar o arquivo PDF.");
  }
}
