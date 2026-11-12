import { useEffect, useMemo, useState } from "react";
import BaseTelas from "../componentes/baseTelas";
import EditPerfil from "../componentes/editPerfil";
import { useTema } from "../hooks/temaContext";
import { useSolicitanteLogado } from "../hooks/solicitanteLogado";
import { useMotorista } from "../hooks/useMotorista";
import { useSolicitante } from "../hooks/useSolicitantes";
import {
  GET_VOUCHERS_EXPORTACAO,
  GET_VOUCHERS_EXPORTACAO_IDS,
  useVouchersFiltrados,
  useVouchersIds,
} from "../hooks/useVouchers";
import styled from "styled-components";
import CircularProgress from "@mui/material/CircularProgress";
import { useLazyQuery } from "@apollo/client";
import { exportarPlanilhaFunc } from "../hooks/exportarPlanilha";
import ModalPreviewVoucher from "../componentes/modalPreviewVoucher";
import { exportarVouchersPDF } from "../hooks/exportarVouchersPDF";

function Relatorios() {
  return BaseTelas({
    conteudo: (
      <>
        <EditPerfil />
        <RelatorioConteudo />
      </>
    ),
  });
}

interface  VoucherExportacao {
  id: string;
  origem: string;
  destino: string;
  dataHoraProgramado: string;
  dataHoraCriacao: string;
  dataHoraConclusao: string;
  valorViagem: number;
  valorViagemRepasse: number;
  valorDeslocamento: number;
  valorDeslocamentoRepasse: number;
  valorHoraParada: number;
  valorHoraParadaRepasse: number;
  valorPedagio: number;
  valorEstacionamento: number;
  qntTempoParado: number;
  natureza: string;
  tipoCorrida: string;
  status: string;
  observacao: string;
  observacaoMotorista: string;
  carro: {
    id: string;
    placa: string;
    marca: string;
    modelo: string;
    cor: string;
    ano: string;
  };
  modeloFixo: {
    id: string;
    nomeModelo: string;
    ativo: boolean;
  };
  modeloTurno: {
    id: string;
    nomeModelo: string;
    ativo: boolean;
  };
  adminUsuario: {
    id: string;
    nome: string;
  };
  empresaCliente: {
    id: string;
    nome: string;
    statusCliente: string;
  };
  motorista: {
    id: string;
    nome: string;
    tipoMotorista: string;
    statusCnh: string;
  };
  unidadeCliente: {
    id: string;
    nome: string;
    endRua: string;
    endNumero: string;
    endBairro: string;
    endCep: string;
    endCidade: string;
    endComplemento: string;
    endUf: string;
  };
  operadoraId: {
    id: string;
    nome: string;
  }
  passageiros?: Array<{
    id: string;
    horarioEmbarqueReal: string;
    passageiroId: {
      id: string;
      nome: string;
      matricula: string;
      endBairro: string;
      endCidade: string;
      centroCustoClienteId: {
        codigo: string;
        id: string;
        nome: string;
      };
    };
    rateio: number;
    statusPresenca: string;
  }>;
  rota: {
    id: string;
    origem: string;
    destino: string;
    tributacao: string;
  };
  solicitante: {
    id: string;
    nome: string;
    funcao: string;
  };
}

export default Relatorios;

function RelatorioConteudo() {
  const { Cor } = useTema();

  const operadoraId = useSolicitanteLogado()?.operadoraId.id;

  const empresaClienteId = useSolicitanteLogado()?.empresaClienteId.id;

  const [visivel, setVisivel] = useState<boolean>(false);

  const [exportando, setExportando] = useState(false);

  const [modalPreveiw, setModalPreview] = useState(false);
  const [voucherPreview, setVoucherPreview] = useState<any>(null);

  const formatarParaYMD = (data: Date) => {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  };

  const hoje = new Date();
  const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

  const [filtro, setFiltro] = useState<any>({
    operadoraId: String(operadoraId),
    adminUsuarioId: "",
    dataFim: formatarParaYMD(ultimoDia),
    dataInicio: formatarParaYMD(primeiroDia),
    empresaClienteId: empresaClienteId,
    motoristaId: "",
    natureza: "",
    solicitanteId: "",
    status: "Concluido",
    tipoCorrida: "",
    unidadeClienteId: "",
  });

  const [idsParaBusca, setIdsParaBusca] = useState<string[]>([]);

  const {
    listaRelatorio: listaPrincipal,
    loading,
    refetch,
  } = useVouchersFiltrados(filtro);

  const { listaVouchersIds, loading: loadingBuscaIds } = useVouchersIds(
    idsParaBusca,
    String(operadoraId),
  );

  // Identifica se existe uma pesquisa por ID
  const temBuscaPorId = useMemo(() => {
    return idsParaBusca.some((id) => String(id).trim() !== "");
  }, [idsParaBusca]);

  // IDs atualmente pesquisados
  const idsPesquisados = useMemo(() => {
    return new Set(idsParaBusca.map((id) => String(id).trim()));
  }, [idsParaBusca]);

  // Define quais vouchers serão exibidos
  const listaRelatorio = useMemo(() => {
    if (temBuscaPorId) {
      return (listaVouchersIds ?? []).filter((voucher: any) =>
        idsPesquisados.has(String(voucher.id)),
      );
    }

    return listaPrincipal ?? [];
  }, [temBuscaPorId, listaVouchersIds, idsPesquisados, listaPrincipal]);

  const [buscarDadosExportacao, { loading: CarregandoExportacao }] =
    useLazyQuery(GET_VOUCHERS_EXPORTACAO, {
      fetchPolicy: "network-only",
    });

  const [buscarDadosExportacaoIds] = useLazyQuery(GET_VOUCHERS_EXPORTACAO_IDS, {
    fetchPolicy: "network-only",
  });

  const extrairData = (dataString: string | null | undefined) => {
    if (!dataString) return "-";
    const data = new Date(dataString);
    if (isNaN(data.getTime())) return dataString;
    return data.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  };

  const extrairHora = (dataString: string | null | undefined) => {
    if (!dataString) return "-";
    const data = new Date(dataString);
    if (isNaN(data.getTime())) return dataString;
    return data.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "UTC",
    });
  };

  const obterVouchersParaExportacao = async (): Promise<
    VoucherExportacao[]
  > => {
    // =========================================
    // 1. PESQUISA POR ID TEM PRIORIDADE
    // =========================================

    if (temBuscaPorId) {
      // Evita exportar antes de concluir a pesquisa
      if (loadingBuscaIds) {
        throw new Error("Aguarde a conclusão da pesquisa por ID.");
      }

      // Utiliza somente os IDs dos vouchers
      // que realmente aparecem no relatório
      const ids = [
        ...new Set(listaRelatorio.map((voucher: any) => String(voucher.id))),
      ];

      if (ids.length === 0) {
        return [];
      }

      if (!operadoraId) {
        throw new Error("Operadora não identificada.");
      }

      // Busca todos os campos necessários
      // para Excel e PDF, somente desses IDs
      const { data } = await buscarDadosExportacaoIds({
        variables: {
          ids,
          operadoraId: String(operadoraId),
        },
      });

      const vouchers = (data?.vouchersIds ?? []) as VoucherExportacao[];

      // Mantém exatamente os IDs exibidos e
      // a ordem da lista do relatório
      const vouchersPorId = new Map(
        vouchers.map((voucher) => [String(voucher.id), voucher]),
      );

      return ids
        .map((id) => vouchersPorId.get(id as string))
        .filter(
          (voucher): voucher is VoucherExportacao => voucher !== undefined,
        );
    }

    // =========================================
    // 2. EXPORTAÇÃO PELOS FILTROS GERAIS
    // =========================================

    const { data } = await buscarDadosExportacao({
      variables: { filtro },
    });

    console.log("Dados exportação:", data?.vouchersFiltrados);

    return (data?.vouchersFiltrados ?? []) as VoucherExportacao[];
  };

  const prepararDadosParaExcel = (vouchers: VoucherExportacao[]) => {
    return vouchers.map((voucher) => {
      // 1. Montamos um objeto base com os dados que vêm antes dos passageiros

      const totalCobranca =
        (voucher.valorViagem || 0) +
        (voucher.valorDeslocamento || 0) +
        (voucher.valorPedagio || 0) +
        (voucher.qntTempoParado || 0) * (voucher.valorHoraParada || 0);

      const totalRepasse =
        (voucher.valorViagemRepasse || 0) +
        (voucher.valorDeslocamentoRepasse || 0) +
        (voucher.valorPedagio || 0) +
        (voucher.qntTempoParado || 0) * (voucher.valorHoraParadaRepasse || 0);

      const linhaExcel: any = {
        ID: voucher.id,
        Observação: voucher.observacao,
        Status: voucher.status,
        "Data Programada": extrairData(voucher.dataHoraProgramado),
        "Hora Programada": extrairHora(voucher.dataHoraProgramado),
        "Data Conclusão": extrairData(voucher.dataHoraConclusao),
        "Hora Conclusão": extrairHora(voucher.dataHoraConclusao),
        "Empresa Cliente": voucher.empresaCliente?.nome || "-",
        "Unidade Cliente": voucher.unidadeCliente?.nome || "-",
        Motorista: voucher.motorista?.nome || "Sem motorista",
        "Observação Motorista": voucher.observacaoMotorista || "-",
        "Veículo (Placa)": voucher.carro?.placa || "-",
        Origem: voucher.rota?.origem || voucher.origem || "-",
        Destino: voucher.rota?.destino || voucher.destino || "-",
        Tributação: voucher.rota?.tributacao || "-",
        "Cod. Fixo":
          voucher.natureza === "Fixo"
            ? voucher.modeloFixo?.nomeModelo || "-"
            : "-",
        "Cod.Turno":
          voucher.natureza === "Turno"
            ? voucher.modeloTurno?.nomeModelo || "_"
            : "-",
        Rota:
          voucher.natureza === "Extra"
            ? voucher.rota
              ? `Rota ID: ${voucher.rota.id} - ${voucher.rota.origem} X ${voucher.rota.destino}`
              : `Rota não vinculada - ${voucher.origem || "-"} X ${voucher.destino || "-"}`
            : "-",
        Solicitante:
          voucher.natureza === "Extra" ? voucher.solicitante?.nome || "-" : "-",
        Natureza: voucher.natureza,
        "Tipo de Corrida": voucher.tipoCorrida,
        "Valor Viagem": voucher.valorViagem || 0,
        "Valor Deslocamento": voucher.valorDeslocamento || 0,
        "Valor Hora Parada":
          voucher.valorHoraParada * voucher.qntTempoParado || 0,
        "Tempo Parado": voucher.qntTempoParado || 0,
        "Valor Viagem Repasse": voucher.valorViagemRepasse || 0,
        "Valor Deslocamento Repasse": voucher.valorDeslocamentoRepasse || 0,
        "Valor Hora Parada Repasse":
          voucher.valorHoraParadaRepasse * voucher.qntTempoParado || 0,
        "Valor Pedágio": voucher.valorPedagio || 0,
        "Total Cobrança": totalCobranca,
        "Total Repasse": totalRepasse,
      };

      if (voucher.passageiros && voucher.passageiros.length > 0) {
        // Identifica a quantidade de passageiros válidos para o rateio
        const totalConsideradosNoRateio = voucher.passageiros.filter(
          (p: any) =>
            p.statusPresenca === "Presente" || p.statusPresenca === "Agendado",
        ).length;

        voucher.passageiros.forEach((p, index) => {
          const nome = p.passageiroId?.nome || "Sem nome";
          const status = p.statusPresenca || "Sem status";
          const centroCusto =
            p.passageiroId?.centroCustoClienteId?.nome || "Sem Centro de Custo";
          const centroCustoCod =
            p.passageiroId?.centroCustoClienteId?.codigo || "--";

          let custoPassageiro: any = 0;
          const participaDaDivisao =
            status === "Presente" || status === "Agendado";

          if (participaDaDivisao && totalConsideradosNoRateio > 0) {
            custoPassageiro = {
              f: `${totalCobranca}/${totalConsideradosNoRateio}`,
              t: "n",
            };
          }

          // Mantendo as 4 colunas em sequência na mesma linha Excel
          linhaExcel[`Passageiro ${index + 1}`] = `${nome}`;
          linhaExcel[`Passageiro ${index + 1} Status`] = `${status}`;
          linhaExcel[`Passageiro ${index + 1} CC`] =
            `${centroCusto} - ${centroCustoCod}`;
          linhaExcel[`Passageiro ${index + 1} Custo (Rateio)`] =
            custoPassageiro;
        });
      } else {
        linhaExcel["Passageiro 1"] = "Sem passageiros";
      }

      return linhaExcel;
    });
  };


  // ------------------------------------ FUNÇÃO NOVA PARA EXTRAÇÃO DE RELATÓRIOS -----------------------------------//


  const prepararDadosParaExcelCentroCusto = (vouchers: VoucherExportacao[]) => {
    return vouchers.flatMap((voucher: any) => {
      // 1. Calculamos o custo total atualizado da cobrança
      const totalCobranca =
        (voucher.valorViagem || 0) +
        (voucher.valorDeslocamento || 0) +
        (voucher.valorPedagio || 0) +
        (voucher.qntTempoParado || 0) * (voucher.valorHoraParada || 0);

      // 2. Montamos os dados base da viagem
      const dadosBaseViagem = {
        "ID do Voucher": voucher.id,
        "Data Programada": extrairData(voucher.dataHoraProgramado),
        "Hora Programada": extrairHora(voucher.dataHoraProgramado),
        "Empresa Cliente": voucher.empresaCliente?.nome || "-",
        "Unidade Cliente": voucher.unidadeCliente?.nome || "-",
        Solicitante: voucher.solicitante?.nome || "-",
        Origem: voucher.rota?.origem || voucher.origem || "-",
        Destino: voucher.rota?.destino || voucher.destino || "-",
        tributação: voucher.rota?.tributacao || "-",
        Natureza: voucher.natureza,
        "Tipo de Corrida": voucher.tipoCorrida,
        Motorista: voucher.motorista?.nome || "Sem motorista",
        "Custo Total da Corrida": parseFloat(totalCobranca.toFixed(2)),
      };

      // 3. Se não houver passageiros
      if (!voucher.passageiros || voucher.passageiros.length === 0) {
        return [
          {
            ...dadosBaseViagem,
            Passageiro: "Sem passageiros",
            "Status Presença": "-",
            "Centro de Custo": "-",
            "Código CC": "-",
            "Rateio (%)": 0,
            "Custo do Passageiro": parseFloat(totalCobranca.toFixed(2)),
          },
        ];
      }

      // NOVO PASSO: Identificar a quantidade exata de passageiros PRESENTES neste voucher
      const totalConsideradosNoRateio = voucher.passageiros.filter(
        (p: any) =>
          p.statusPresenca === "Presente" || p.statusPresenca === "Agendado",
      ).length;

      // 4. Mapeamos os passageiros
      return voucher.passageiros.map((p: any) => {
        const nome = p.passageiroId?.nome || "Sem nome";
        const status = p.statusPresenca || "Sem status";
        const centroCusto =
          p.passageiroId?.centroCustoClienteId?.nome || "Sem Centro de Custo";
        const centroCustoCod =
          p.passageiroId?.centroCustoClienteId?.codigo || "--";

        // Variáveis zeradas por padrão (garante que "Ausente" ou outros fiquem zerados)
        let custoPassageiro: any = 0;
        let porcentagemRateio = 0;

        // Cria a regra: Só participa da divisão de custos quem estiver Presente ou Agendado
        const participaDaDivisao =
          status === "Presente" || status === "Agendado";

        // Aplica o rateio APENAS se o passageiro passar na regra de divisão
        if (participaDaDivisao && totalConsideradosNoRateio > 0) {
          // Insere a fórmula do Excel dinamicamente
          custoPassageiro = {
            f: `${totalCobranca}/${totalConsideradosNoRateio}`,
            t: "n",
          };
          // Calcula a porcentagem igualitária
          porcentagemRateio = parseFloat(
            (100 / totalConsideradosNoRateio).toFixed(2),
          );
        }
        return {
          ...dadosBaseViagem,
          "Rateio (%)": porcentagemRateio,
          "Custo do Passageiro": custoPassageiro,
          Passageiro: nome,
          "Status Presença": status,
          "Centro de Custo": centroCusto,
          "Código CC": centroCustoCod,

          Observação: voucher.observacao || "-",
        };
      });
    });
  };

  const executarExportacao = async (
    gerarArquivo: (vouchers: VoucherExportacao[]) => void | Promise<void>,
  ) => {
    if (exportando) return;

    setExportando(true);

    try {
      const vouchers = await obterVouchersParaExportacao();

      if (vouchers.length === 0) {
        alert("Nenhum voucher encontrado para exportação.");
        return;
      }

      await gerarArquivo(vouchers);
    } catch (error) {
      console.error("Erro na exportação:", error);

      alert(
        error instanceof Error ? error.message : "Ocorreu um erro ao exportar.",
      );
    } finally {
      setExportando(false);
    }
  };

  // RELATÓRIO GERAL
  const ExportarRelatorioGeral = async () => {
    await executarExportacao((vouchers) => {
      const dados = prepararDadosParaExcel(vouchers);

      const operadora = vouchers[0]?.operadoraId?.nome || "Empresa";

      exportarPlanilhaFunc(
        dados,
        `Relatorio_${operadora}_Geral_${formatarParaYMD(hoje)}`,
        "xlsx",
      );
    });
  };

  // RELATÓRIO POR CENTRO DE CUSTO
  const ExportarRelatorioCentroCusto = async () => {
    await executarExportacao((vouchers) => {
      const dados = prepararDadosParaExcelCentroCusto(vouchers);

      const operadora = vouchers[0]?.operadoraId?.nome || "Empresa";

      exportarPlanilhaFunc(
        dados,
        `Relatorio_${operadora}_CentroCusto_${formatarParaYMD(hoje)}`,
        "xlsx",
      );
    });
  };

  // IMPRESSÃO DE VOUCHERS EM PDF
  const ExportarPDF = async () => {
    await executarExportacao((vouchers) => {

      const operadora = vouchers[0]?.operadoraId?.nome || "Empresa";

      exportarVouchersPDF(vouchers, {
        nome: operadora || "NEOFROTA GESTÃO DE TRANSPORTES",
      });
    });
  };

  return (
    <>
      <div
        style={{
          width: "100%",
          display: "flex",
          padding: "25px 15px 15px 15px",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "center",
          gap: 5,
        }}
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-start",
            alignItems: "center",
            gap: 10,
          }}
        >
          <h3 style={{ color: Cor.secundaria, fontSize: "20px" }}>
            Relatórios
          </h3>
          <div
            style={{
              width: "75%",
              height: 1,
              backgroundColor: Cor.primaria,
            }}
          />
        </div>
        <ModalPreviewVoucher
          setVisivel={setModalPreview}
          visivel={modalPreveiw}
          v={voucherPreview}
        />
        {/* <ResumoValores listaRelatorio={listaRelatorio} filtro={filtro} /> */}
        <BaseFiltros
          filtroAtivo={filtro}
          setFiltroAtivo={setFiltro}
          setIdsParaBusca={setIdsParaBusca}
          exportarRelatorioGeral={ExportarRelatorioGeral}
          exportarRelatorioCentroCusto={ExportarRelatorioCentroCusto}
          exportarPDF={ExportarPDF}
          carregandoExportacao={CarregandoExportacao}
        />
        <TabelaVouchersFiltrados
          listaFiltro={listaRelatorio}
          loading={loading}
          setVisivel={setVisivel}
          visivel={visivel}
          refetch={refetch}
          setV={setVoucherPreview}
          setM={setModalPreview}
        />
      </div>
    </>
  );
}

interface BtnNatuzeraProps {
  $cor: string;
  $corTexto: string;
}

const BtnNatuzera = styled.div<BtnNatuzeraProps>`
  width: 80%;
  padding: 1px;
  border-radius: 14px;
  background-color: ${({ $cor }) => $cor + 50};
  border: 1px solid ${({ $cor }) => $cor + 90};
  font-size: 12px;
  color: ${({ $corTexto }) => $corTexto};
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 5px;
  user-select: none;
  transition: ease-in-out all 0.1s;

  &:hover {
    scale: 1.04;
    background-color: ${({ $cor }) => $cor + 70};
  }
`;

interface BtnStatusProps {
  $cor: string;
}

const BtnStatus = styled.div<BtnStatusProps>`
  width: 100%;
  padding: 1px;
  border-radius: 14px;
  background-color: ${({ $cor }) => $cor + 50};
  border: 1px solid ${({ $cor }) => $cor + 90};
  font-size: 12px;
  color: ${({ $cor }) => $cor};
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 5px;
  user-select: none;
  transition: ease-in-out all 0.1s;

  &:hover {
    scale: 1.04;
    background-color: ${({ $cor }) => $cor + 70};
  }
`;

interface LinhaTabelaProps {
  $base: string;
  $linha: string;
  $texto: string;
}

const LinhaTabela = styled.div<LinhaTabelaProps>`
  display: flex;
  flex-direction: row;
  padding-left: 5px;
  padding-right: 5px;
  width: 100%;
  height: 35px;
  justify-content: space-between;
  align-items: center;
  background-color: ${({ $base }) => $base};
  border-bottom: 1px solid ${({ $linha }) => $linha};
  color: ${({ $texto }) => $texto};
  font-size: 14px;
  cursor: pointer;
  transition: ease-in-out all 0.1s;

  &:hover {
    background-color: ${({ $texto }) => $texto + 20};
  }
`;

function TabelaVouchersFiltrados({
  listaFiltro,
  loading,
  setV,
  setM,
}: {
  listaFiltro: any;
  loading: any;
  setVisivel: any;
  visivel: any;
  refetch: any;
  setV: any;
  setM: any;
}) {
  const { Cor } = useTema();

  const [voucherHoverId, setHoveredVoucherId] = useState<string | null>(null);

  const [obsMotorista, setObsMotorista] = useState<string | null>(null);

  const [selecionados, setSelecionados] = useState<any[]>([]);

  useEffect(() => {
    setSelecionados([]);
  }, [listaFiltro]);

  const selecionarLinhaVoucher = (id: any) => {
    setSelecionados((prev) => {
      const isSelecionado = prev.includes(id);

      const novaLista = isSelecionado
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id];

      return novaLista;
    });
  };

  const selecionarTodosVouchers = () => {
    if (selecionados.length === listaFiltro.length) {
      setSelecionados([]);
    } else {
      const todosIds = listaFiltro.map((v: any) => v.id);
      setSelecionados(todosIds);
    }
  };

  const Cabecalho = (
    <div
      style={{
        backgroundColor: Cor.texto2 + 90,
        width: "100%",
        height: "6%",
        borderRadius: "16px 16px 0 0",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 5,
        fontSize: 12,
        fontWeight: "bold",
        color: Cor.texto1,
      }}
    >
      <p
        style={{
          width: "2%",
          textAlign: "center",
          fontFamily: "Icone",
          fontSize: 16,
          fontWeight: 400,
          cursor: "pointer",
        }}
        onClick={selecionarTodosVouchers}
      >
        {selecionados.length > 0 && selecionados.length === listaFiltro.length
          ? "indeterminate_check_box"
          : "square"}
      </p>
      <p style={{ width: "5%", textAlign: "center" }}>Id</p>
      <p style={{ width: "17%" }}>Cliente / Unidade</p>
      <p style={{ width: "8%" }}>Solici/Cod</p>
      <p style={{ width: "15%" }}>Motorista</p>
      <p style={{ width: "10%" }}>Data / Hora</p>
      <p style={{ width: "15%" }}>Origem - Destino</p>
      <p style={{ width: "10%" }}>Natureza</p>
      <p style={{ width: "10%" }}>Status</p>
      <p style={{ width: "8%" }}>Valor</p>
    </div>
  );

  return (
    <div
      style={{
        backgroundColor: Cor.base2,
        width: "100%",
        height: "90vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        borderRadius: 20,
        padding: 5,
        boxShadow: Cor.sombra,
      }}
    >
      {Cabecalho}
      <div
        style={{
          backgroundColor: Cor.base,
          width: "100%",
          height: "88%",
          display: "flex",
          flexDirection: "column",
          overflow: "scroll",
          scrollbarWidth: "none",
        }}
      >
        {loading ? (
          <div
            style={{
              width: "100%",
              height: 60,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CircularProgress
              size={24}
              thickness={5}
              sx={{
                color: Cor.primaria,
                "& .MuiCircularProgress-linear": {
                  strokeLinecap: "round",
                },
              }}
            />
          </div>
        ) : (
          listaFiltro.map((v: any) => {
            const valorTotal =
              v.valorViagem +
              v.valorDeslocamento +
              v.valorHoraParada * v.qntTempoParado;

            return (
              <LinhaTabela
                $base={Cor.base2}
                $linha={Cor.texto2 + 40}
                $texto={Cor.texto1}
                key={v.id}
                onClick={() => {
                  (setV(v), setM(true));
                }}
              >
                <p
                  style={{
                    width: "2%",
                    textAlign: "center",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontFamily: "Icone",
                    height: "100%",
                    borderRight: `1px solid ${Cor.texto2 + 40}`,
                    padding: 5,
                    fontSize: 18,
                    cursor: "pointer",
                  }}
                  onClick={(e) => {
                    (e.stopPropagation(), selecionarLinhaVoucher(v.id));
                  }}
                >
                  {selecionados.includes(v.id) ? "check_box" : "square"}
                </p>
                <p
                  style={{
                    width: "5%",
                    textAlign: "center",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    height: "100%",
                    borderRight: `1px solid ${Cor.texto2 + 40}`,
                    padding: 5,
                  }}
                >
                  {v.id}
                </p>
                <div
                  style={{
                    width: "17%",
                    display: "flex",
                    flexDirection: "row",
                    gap: 3,
                    alignItems: "center",
                    justifyContent: "flex-start",
                    height: "100%",
                    borderRight: `1px solid ${Cor.texto2 + 40}`,
                    padding: 5,
                  }}
                >
                  <img
                    src={v.empresaCliente.fotoLogoCliente}
                    style={{
                      width: 25,
                      height: 25,
                      minWidth: 25,
                      borderRadius: 5,
                    }}
                  />
                  <p
                    style={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {v.empresaCliente.nome} / {v.unidadeCliente.nome}
                  </p>
                </div>

                <p
                  style={{
                    width: "8%",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    height: "100%",
                    borderRight: `1px solid ${Cor.texto2 + 40}`,
                    padding: 5,
                  }}
                >
                  {v.natureza === "Extra"
                    ? v.solicitante?.nome || ""
                    : v.natureza === "Fixo"
                      ? v.modeloFixo?.nomeModelo || ""
                      : v.modeloTurno?.nomeModelo || ""}
                </p>
                <div
                  style={{
                    width: "15%",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    display: "flex",
                    flexDirection: "row",
                    gap: 5,
                    justifyContent: "flex-start",
                    alignItems: "center",
                    height: "100%",
                    borderRight: `1px solid ${Cor.texto2 + 40}`,
                    padding: 5,
                  }}
                >
                  <div
                    style={{
                      display: v.observacaoMotorista ? "flex" : "none",
                      justifyContent: "center",
                      alignItems: "center",
                      cursor: "pointer",
                      position: "relative",
                      width: "10%",
                    }}
                    onMouseEnter={() => setObsMotorista(v.id)}
                    onMouseLeave={() => setObsMotorista(null)}
                  >
                    <p
                      style={{
                        fontFamily: "Icone",
                        fontWeight: "bold",
                        fontSize: 20,
                        color: Cor.atencao,
                      }}
                    >
                      circle_notifications
                    </p>
                    {obsMotorista === v.id && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "120%",
                          left: "50%",
                          transform: "translateX(-50%)",
                          backgroundColor: Cor.base2,
                          color: Cor.texto1,
                          border: `1px solid ${Cor.texto2}`,
                          padding: "8px 12px",
                          borderRadius: "6px",
                          whiteSpace: "nowrap",
                          fontSize: "12px",
                          boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
                          zIndex: 10,
                        }}
                      >
                        {v.observacaoMotorista}
                        <div
                          style={{
                            position: "absolute",
                            bottom: "-8px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            width: "10px",
                            height: "10px",
                            backgroundColor: Cor.base2,
                            borderBottom: `1px solid ${Cor.texto2}`,
                            borderRight: `1px solid ${Cor.texto2}`,
                            rotate: "45deg",
                          }}
                        ></div>
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      width: v.observacaoMotorista ? "90%" : "100%",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                      display: "flex",
                      flexDirection: "row",
                    }}
                  >
                    <p>{v.motorista.nome}</p>
                  </div>
                </div>

                <p
                  style={{
                    width: "10%",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    height: "100%",
                    borderRight: `1px solid ${Cor.texto2 + 40}`,
                    padding: 5,
                  }}
                >
                  {new Date(v.dataHoraProgramado).toLocaleString("pt-BR", {
                    timeZone: "UTC",
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                  })}
                </p>
                <p
                  style={{
                    width: "15%",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    height: "100%",
                    borderRight: `1px solid ${Cor.texto2 + 40}`,
                    padding: 5,
                  }}
                >
                  {v.origem} - {v.destino}
                </p>
                <div
                  style={{
                    width: "10%",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                    borderRight: `1px solid ${Cor.texto2 + 40}`,
                    padding: 5,
                  }}
                >
                  <BtnNatuzera
                    $cor={
                      v.natureza === "Fixo"
                        ? Cor.fixo
                        : v.natureza === "Extra"
                          ? Cor.extra
                          : Cor.turno
                    }
                    $corTexto={
                      v.natureza === "Fixo"
                        ? Cor.textoFixo
                        : v.natureza === "Extra"
                          ? Cor.textoExtra
                          : Cor.textoTurno
                    }
                  >
                    {v.natureza} -
                    <p
                      style={{
                        // fontFamily: "Icone",
                        fontWeight: "bolder",
                        fontSize: 14,
                      }}
                    >
                      {v.tipoCorrida === "Entrada" ? "En" : "Sa"}
                    </p>
                  </BtnNatuzera>
                </div>
                <div
                  style={{
                    width: "10%",
                    whiteSpace: "nowrap",
                    // overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                    borderRight: `1px solid ${Cor.texto2 + 40}`,
                    padding: 5,
                  }}
                >
                  <BtnStatus
                    $cor={
                      v.status === "Aberto"
                        ? Cor.texto2
                        : v.status === "Concluido"
                          ? Cor.ativo
                          : Cor.inativo
                    }
                    style={{ position: "relative" }}
                    onMouseEnter={() => setHoveredVoucherId(v.id)}
                    onMouseLeave={() => setHoveredVoucherId(null)}
                  >
                    {v.status}
                    {v.status === "Concluido" && voucherHoverId === v.id && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "120%",
                          left: "50%",
                          transform: "translateX(-50%)",
                          backgroundColor: Cor.base2,
                          color: Cor.texto1,
                          border: `1px solid ${Cor.texto2}`,
                          padding: "8px 12px",
                          borderRadius: "6px",
                          whiteSpace: "nowrap",
                          fontSize: "12px",
                          boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
                          zIndex: 10,
                        }}
                      >
                        Assinado em:{" "}
                        {new Date(v.dataHoraConclusao).toLocaleString("pt-BR")}
                        <div
                          style={{
                            position: "absolute",
                            bottom: "-8px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            width: "10px",
                            height: "10px",
                            backgroundColor: Cor.base2,
                            borderBottom: `1px solid ${Cor.texto2}`,
                            borderRight: `1px solid ${Cor.texto2}`,
                            rotate: "45deg",
                          }}
                        ></div>
                      </div>
                    )}
                    {v.status === "Cancelado" && voucherHoverId === v.id && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "120%",
                          width: 150,
                          left: "50%",
                          transform: "translateX(-50%)",
                          backgroundColor: Cor.base2,
                          color: Cor.texto1,
                          border: `1px solid ${Cor.texto2}`,
                          padding: "8px 12px",
                          borderRadius: "6px",
                          whiteSpace: "pre-wrap",
                          textAlign: "center",
                          fontSize: "12px",
                          boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
                          zIndex: 10,
                        }}
                      >
                        {v.observacao}
                        <div
                          style={{
                            position: "absolute",
                            bottom: "-8px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            width: "10px",
                            height: "10px",
                            backgroundColor: Cor.base2,
                            borderBottom: `1px solid ${Cor.texto2}`,
                            borderRight: `1px solid ${Cor.texto2}`,
                            rotate: "45deg",
                          }}
                        ></div>
                      </div>
                    )}
                    <p
                      style={{
                        fontFamily: "Icone",
                        fontWeight: 100,
                        fontSize: 18,
                      }}
                    >
                      {v.status === "Cancelado"
                        ? "cancel"
                        : v.status === "Aberto"
                          ? "hourglass"
                          : "check_circle"}
                    </p>
                  </BtnStatus>
                </div>
                <p
                  style={{
                    width: "8%",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    height: "100%",
                    padding: 5,
                  }}
                >
                  {Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(Number(valorTotal))}
                </p>
              </LinhaTabela>
            );
          })
        )}
      </div>
      <div
        style={{
          backgroundColor: Cor.texto2 + 90,
          width: "100%",
          borderRadius: "0 0 16px 16px",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 10,
          fontSize: 12,
          fontWeight: "bold",
          color: Cor.texto1,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            width: "28%",
            gap: 10,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <p style={{ whiteSpace: "nowrap" }}>
            {selecionados.length} - Vouchers Selecionados
          </p>
        </div>
      </div>
    </div>
  );
}

function BaseFiltros({
  filtroAtivo,
  setFiltroAtivo,
  setIdsParaBusca,
  exportarRelatorioGeral,
  exportarRelatorioCentroCusto,
  exportarPDF,
  carregandoExportacao,
}: {
  filtroAtivo: any;
  setFiltroAtivo: any;
  setIdsParaBusca: any;
  exportarRelatorioGeral: any;
  exportarRelatorioCentroCusto: any;
  exportarPDF: any;
  carregandoExportacao: any;
}) {
  const [filtro, setFiltro] = useState(filtroAtivo);
  const [numerosVouchers, setNumerosVouchers] = useState("");

  const operId = useSolicitanteLogado()?.operadoraId.id;

  const { listaMotoristas } = useMotorista(operId);
  const { solicitantes } = useSolicitante(filtro.empresaClienteId || "0");

  const handleChange = (campo: string, valor: string) => {
    setFiltro((prevFiltro: any) => ({
      ...prevFiltro,
      [campo]: valor === "" ? null : valor,
    }));
  };

  const handleFiltrar = () => {
    setFiltroAtivo(filtro);
  };

  const buscarPorIds = () => {
    const idsProcessados = numerosVouchers
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id !== "");

    setIdsParaBusca(idsProcessados);
  };

  const [menuExportacaoAberto, setMenuExportacaoAberto] = useState(false);

  const { Cor } = useTema();
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: 15,
        marginTop: 10,
        backgroundColor: Cor.base2,
        borderRadius: 22,
        boxShadow: Cor.sombra,
      }}
    >
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <p style={{ fontSize: 12, color: Cor.texto1 }}>
          Filtro de <br></br>Pesquisa
        </p>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            width: "50%",
            gap: 5,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p
              style={{
                fontSize: 12,
                color: Cor.texto1,
                fontWeight: "bolder",
                whiteSpace: "nowrap",
              }}
            >
              Digite aqui 1 ou mais vouchers Ids:
            </p>
            <p
              style={{ fontWeight: "normal", fontSize: 11, color: Cor.texto1 }}
            >
              *separando com uma "," vírgula.
            </p>
          </div>

          <TextoEntrada
            placeholder="Ids dos Vouchers"
            value={numerosVouchers}
            largura="60%"
            type="text"
            onChange={(e: any) => setNumerosVouchers(e.target.value)}
          />
          <BtnFiltrar $cor={Cor.primaria} onClick={() => buscarPorIds()}>
            Buscar
          </BtnFiltrar>
        </div>
      </div>
      <div
        style={{
          width: "100%",
          height: 1,
          backgroundColor: Cor.secundaria,
        }}
      />
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "row",
          gap: 5,
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            width: "30%",
            display: "flex",
            flexDirection: "row",
            gap: 5,
          }}
        >
          <div
            style={{
              width: "50%",
              display: "flex",
              flexDirection: "row",
              gap: 5,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <p style={{ fontSize: 12, color: Cor.texto1 }}>De: </p>{" "}
            <TextoEntrada
              type="date"
              largura="80%"
              value={filtro.dataInicio || ""}
              onChange={(e) => handleChange("dataInicio", e.target.value)}
              placeholder="-"
            />
          </div>
          <div
            style={{
              width: "50%",
              display: "flex",
              flexDirection: "row",
              gap: 5,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <p style={{ fontSize: 12, color: Cor.texto1 }}>Até: </p>{" "}
            <TextoEntrada
              type="date"
              largura="80%"
              value={filtro.dataFim || ""}
              onChange={(e) => handleChange("dataFim", e.target.value)}
              placeholder="-"
            />
          </div>
        </div>
        <div
          style={{
            width: "32%",
            display: "flex",
            flexDirection: "row",
            gap: 5,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <p
            style={{
              fontSize: 12,
              color: Cor.texto1,
              margin: 5,
            }}
          >
            Motorista:
          </p>
          <div
            style={{
              width: "100%",
              border: `1px solid ${Cor.texto2 + 50}`,
              padding: 10,
              borderRadius: 14,
            }}
          >
            <select
              name=""
              id=""
              style={{
                outline: "none",
                border: "none",
                width: "100%",
                backgroundColor: "transparent",
                color: Cor.texto1,
              }}
              onChange={(e) => handleChange("motoristaId", e.target.value)}
              value={filtro.motoristaId}
            >
              <option
                value={""}
                style={{ backgroundColor: Cor.base2, color: Cor.texto2 + 70 }}
              >
                Todos
              </option>
              {listaMotoristas?.map((m: any) => {
                return (
                  <option
                    value={m.id}
                    key={m?.id}
                    style={{
                      backgroundColor: Cor.base2,
                      padding: 15,
                      margin: 10,
                    }}
                  >
                    {m?.nome}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
        <div
          style={{
            width: "32%",
            display: "flex",
            flexDirection: "row",
            gap: 5,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <p
            style={{
              fontSize: 12,
              color: Cor.texto1,
              margin: 5,
            }}
          >
            Solicitante:
          </p>
          <div
            style={{
              width: "100%",
              border: `1px solid ${Cor.texto2 + 50}`,
              padding: 10,
              borderRadius: 14,
            }}
          >
            <select
              name=""
              id=""
              style={{
                outline: "none",
                border: "none",
                width: "100%",
                backgroundColor: "transparent",
                color: Cor.texto1,
              }}
              onChange={(e) => handleChange("solicitanteId", e.target.value)}
              value={filtro.solicitanteId}
            >
              <option
                value={""}
                style={{ backgroundColor: Cor.base2, color: Cor.texto2 + 70 }}
              >
                Todos
              </option>
              {solicitantes?.map((m: any) => {
                return (
                  <option
                    value={m.id}
                    key={m?.id}
                    style={{
                      backgroundColor: Cor.base2,
                      padding: 15,
                      margin: 10,
                    }}
                  >
                    {m?.nome}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>
      <div
        style={{
          width: "100%",
          height: 1,
          backgroundColor: Cor.secundaria + 25,
        }}
      />
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "row",
          gap: 5,
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            width: "25%",
            display: "flex",
            flexDirection: "row",
            gap: 5,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <p
            style={{
              fontSize: 12,
              color: Cor.texto1,
              margin: 5,
            }}
          >
            Tipo da Corrida:
          </p>
          <div
            style={{
              width: "100%",
              border: `1px solid ${Cor.texto2 + 50}`,
              padding: 10,
              borderRadius: 14,
            }}
          >
            <select
              name=""
              id=""
              style={{
                outline: "none",
                border: "none",
                width: "100%",
                backgroundColor: "transparent",
                color: Cor.texto1,
              }}
              onChange={(e) => handleChange("tipoCorrida", e.target.value)}
              value={filtro.tipoCorrida}
            >
              <option
                value={""}
                style={{ backgroundColor: Cor.base2, color: Cor.texto1 }}
              >
                Todos
              </option>
              <option
                value="Entrada"
                style={{ backgroundColor: Cor.base2, color: Cor.texto1 }}
              >
                Entrada
              </option>
              <option
                value="Saida"
                style={{ backgroundColor: Cor.base2, color: Cor.texto1 }}
              >
                Saída
              </option>
            </select>
          </div>
        </div>
        <div
          style={{
            width: "25%",
            display: "flex",
            flexDirection: "row",
            gap: 5,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <p
            style={{
              fontSize: 12,
              color: Cor.texto1,
              margin: 5,
            }}
          >
            Natureza Voucher:
          </p>
          <div
            style={{
              width: "100%",
              border: `1px solid ${Cor.texto2 + 50}`,
              padding: 10,
              borderRadius: 14,
            }}
          >
            <select
              name=""
              id=""
              style={{
                outline: "none",
                border: "none",
                width: "100%",
                backgroundColor: "transparent",
                color: Cor.texto1,
              }}
              onChange={(e) => handleChange("natureza", e.target.value)}
              value={filtro.natureza}
            >
              <option
                value={""}
                style={{ backgroundColor: Cor.base2, color: Cor.texto1 }}
              >
                Todos
              </option>
              <option
                value="Extra"
                style={{ backgroundColor: Cor.base2, color: Cor.texto1 }}
              >
                Extra
              </option>
              <option
                value="Fixo"
                style={{ backgroundColor: Cor.base2, color: Cor.texto1 }}
              >
                Fixo
              </option>
              <option
                value="Turno"
                style={{ backgroundColor: Cor.base2, color: Cor.texto1 }}
              >
                Turno
              </option>
            </select>
          </div>
        </div>
        <div
          style={{
            width: "25%",
            display: "flex",
            flexDirection: "row",
            gap: 5,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <p
            style={{
              fontSize: 12,
              color: Cor.texto1,
              margin: 5,
            }}
          >
            Status Voucher:
          </p>
          <div
            style={{
              width: "100%",
              border: `1px solid ${Cor.texto2 + 50}`,
              padding: 10,
              borderRadius: 14,
            }}
          >
            <select
              name=""
              id=""
              style={{
                outline: "none",
                border: "none",
                width: "100%",
                backgroundColor: "transparent",
                color: Cor.texto1,
              }}
              onChange={(e) => handleChange("status", e.target.value)}
              value={filtro.status}
            >
              <option
                value="Aberto"
                style={{ backgroundColor: Cor.base2, color: Cor.texto1 }}
              >
                Aberto
              </option>
              <option
                value="Concluido"
                style={{ backgroundColor: Cor.base2, color: Cor.texto1 }}
              >
                Concluido
              </option>
            </select>
          </div>
        </div>
        <div
          style={{
            width: "25%",
            display: "flex",
            flexDirection: "row",
            gap: 5,
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <BtnFiltrar $cor={Cor.primaria} onClick={() => handleFiltrar()}>
            Filtrar
          </BtnFiltrar>
          <ExportarContainer>
            <BotaoExportar
              type="button"
              $cor={Cor.texto2}
              $textoCor={"#222"}
              aria-expanded={menuExportacaoAberto}
              aria-haspopup="menu"
              onClick={() => setMenuExportacaoAberto(!menuExportacaoAberto)}
            >
              {carregandoExportacao ? "Exportando..." : "Exportar"}
              <span
                style={{
                  display: "inline-block",
                  transition: "transform 0.3s ease",
                  transform: menuExportacaoAberto
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                }}
              >
                ▾
              </span>
            </BotaoExportar>

            <MenuExportacao
              $aberto={menuExportacaoAberto}
              $bg={Cor.base2}
              role="menu"
            >
              <ItemExportacao
                type="button"
                $textoCor={Cor.texto1}
                role="menuitem"
                onClick={() => {
                  exportarRelatorioGeral();
                  setMenuExportacaoAberto(false);
                }}
              >
                Relatório Geral
              </ItemExportacao>
              <ItemExportacao
                type="button"
                $textoCor={Cor.texto1}
                role="menuitem"
                onClick={() => {
                  exportarRelatorioCentroCusto();
                  setMenuExportacaoAberto(false);
                }}
              >
                Relatório Centro de Custo
              </ItemExportacao>
              <ItemExportacao
                type="button"
                $textoCor={Cor.texto1}
                role="menuitem"
                onClick={() => {
                  exportarPDF();
                  setMenuExportacaoAberto(false);
                }}
              >
                Imprimir Vouchers
              </ItemExportacao>
            </MenuExportacao>
          </ExportarContainer>
        </div>
      </div>
    </div>
  );
}

const ExportarContainer = styled.div`
  position: relative;
  width: 45%;
  flex-shrink: 0;
  z-index: 1;
`;

const BotaoExportar = styled.button<{ $cor: string; $textoCor: string }>`
  width: 100%;
  background-color: ${({ $cor }) => $cor};
  padding: 12px;
  border-radius: 14px;
  border: none;
  color: ${({ $textoCor }) => $textoCor};

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  font: inherit;
  cursor: pointer;
  user-select: none;

  transition:
    transform 0.2s ease,
    opacity 0.2s ease;

  &:hover {
    transform: scale(1.02);
  }

  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    cursor: wait;
    opacity: 0.7;
  }
`;

// Dropdown animado
const MenuExportacao = styled.div<{ $aberto: boolean; $bg: string }>`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 100%;
  box-sizing: border-box;
  z-index: 30;

  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 8px;

  background-color: ${({ $bg }) => $bg};
  border-radius: 12px;
  border: 1px solid rgba(128, 128, 128, 0.2);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
  backdrop-filter: blur(8px);

  transform-origin: top center;

  opacity: ${({ $aberto }) => ($aberto ? 1 : 0)};
  transform: ${({ $aberto }) =>
    $aberto ? "translateY(0) scaleY(1)" : "translateY(-12px) scaleY(0.95)"};

  visibility: ${({ $aberto }) => ($aberto ? "visible" : "hidden")};

  pointer-events: ${({ $aberto }) => ($aberto ? "auto" : "none")};

  transition:
    opacity 0.25s ease,
    transform 0.3s cubic-bezier(0.22, 1, 0.36, 1),
    visibility 0.25s ease;
`;

// Itens do menu
const ItemExportacao = styled.button<{ $textoCor: string }>`
  width: 100%;
  padding: 11px 10px;

  background: transparent;
  border: none;
  border-radius: 8px;

  color: ${({ $textoCor }) => $textoCor};
  font: inherit;
  font-size: 14px;
  text-align: left;

  cursor: pointer;
  transition:
    background-color 0.2s ease,
    transform 0.2s ease;

  &:hover {
    background-color: rgba(128, 128, 128, 0.12);
    transform: translateX(3px);
  }

  &:active {
    transform: scale(0.98);
  }
`;

interface BtnFiltrarProps {
  $cor: string;
}

const BtnFiltrar = styled.div<BtnFiltrarProps>`
  width: 48%;
  background-color: ${({ $cor }) => $cor};
  padding: 12px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: ease-in-out all 0.1s;
  user-select: none;
  cursor: pointer;

  &:hover {
    scale: 1.02;
  }

  &:active {
    scale: 0.98;
  }
`;

function TextoEntrada({
  placeholder,
  onChange,
  value,
  type,
  largura,
}: {
  placeholder: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value: string;
  type: string;
  largura: string;
}) {
  const Cor = useTema().Cor;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        width: largura,
        height: 40,
        backgroundColor: Cor.texto2 + 20,
        padding: 10,
        borderRadius: 22,
      }}
    >
      <input
        type={type}
        placeholder={placeholder}
        onChange={onChange}
        value={value}
        style={{
          backgroundColor: "transparent",
          color: Cor.texto1,
          border: "none",
          outline: "none",
          width: "100%",
        }}
      />
    </div>
  );
}
