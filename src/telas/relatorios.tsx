import { useEffect, useState } from "react";
import BaseTelas from "../componentes/baseTelas";
import EditPerfil from "../componentes/editPerfil";
import { useTema } from "../hooks/temaContext";
import { useSolicitanteLogado } from "../hooks/solicitanteLogado";
import { useMotorista } from "../hooks/useMotorista";
import { useSolicitante } from "../hooks/useSolicitantes";
import {
  GET_VOUCHERS_EXPORTACAO,
  useEditarVouchersEmMassa,
  useVouchersFiltrados,
  useVouchersIds,
} from "../hooks/useVouchers";
import styled from "styled-components";
import CircularProgress from "@mui/material/CircularProgress";
import { useLazyQuery } from "@apollo/client";
import { exportarPlanilhaFunc } from "../hooks/exportarPlanilha";
import ModalPreviewVoucher from "../componentes/modalPreviewVoucher";

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

interface VoucherExportacao {
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
  modeloTuro: {
     id: string;
    nomeModelo: string;
    ativo: boolean;
  }
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

  const empresaClienteId = useSolicitanteLogado()?.empresaClienteId.id

  const [visivel, setVisivel] = useState<boolean>(false);

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

  const { listaVouchersIds } = useVouchersIds(idsParaBusca, operadoraId);

  const listaRelatorio =
    listaVouchersIds && listaVouchersIds.length > 0
      ? listaVouchersIds
      : listaPrincipal;

  const [buscarDadosExportacao, { loading: CarregandoExportacao }] =
    useLazyQuery(GET_VOUCHERS_EXPORTACAO, {
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
  // Passamos o array tipado com a interface que você já criou
  const prepararDadosParaExcel = (vouchers: VoucherExportacao[]) => {
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

  const ExportarPlanilha = async () => {
    const { data } = await buscarDadosExportacao({
      variables: { filtro },
    });

    if (data && data.vouchersFiltrados && data.vouchersFiltrados.length > 0) {
      // 2. Transforma (achata) os dados para o formato do Excel
      const dadosFormatados = prepararDadosParaExcel(data.vouchersFiltrados);

      exportarPlanilhaFunc(
        dadosFormatados,
        `Relatorio_NeoFrota_Vouchers_${formatarParaYMD(hoje)}`,
        "xlsx",
      );
    } else {
      alert("Nenhum dado encontrado para os filtros selecionados.");
    }
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
          exportarPlanilha={ExportarPlanilha}
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
  setVisivel,
  visivel,
  refetch,
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
         
          <ModalEditarMassa
            setVisivel={setVisivel}
            visivel={visivel}
            idsSelecionados={selecionados}
            refetch={refetch}
          />
        </div>
      </div>
    </div>
  );
}

const Overlay = styled.div<{ $visivel: boolean; $bg: string }>`
  width: 100vw;
  height: 100vh;
  background-color: ${({ $bg }) => `${$bg}90`};
  position: absolute;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  top: 0;
  left: 0;
  padding: 1%;
  z-index: 10;
  backdrop-filter: blur(3px);
  opacity: ${({ $visivel }) => ($visivel ? 1 : 0)};
  pointer-events: ${({ $visivel }) => ($visivel ? "auto" : "none")};
  transition: all 0.3s ease-in-out;
`;

interface CxModalProps {
  $border: string;
  $visivel: boolean;
  $bg: string;
}

const CxModal = styled.div<CxModalProps>`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  gap: 7px;
  padding: 15px;
  width: 70%;
  border-radius: 22px;
  border: 1px solid ${({ $border }) => $border};
  background-color: ${({ $bg }) => $bg};
  position: absolute;
  z-index: 11;
  transform: ${({ $visivel }) => ($visivel ? "scale(1)" : "scale(0.6)")};
  opacity: ${({ $visivel }) => ($visivel ? 1 : 0)};
  pointer-events: ${({ $visivel }) => ($visivel ? "auto" : "none")};
  transition: all 0.3s ease-in-out;
  box-shadow: 4px 4px 8px #00000020;
`;

function ModalEditarMassa({
  visivel,
  setVisivel,
  idsSelecionados,
  refetch,
}: {
  visivel: boolean;
  setVisivel: (v: boolean) => void;
  idsSelecionados: string[];
  refetch: any;
}) {
  const [natureza, setNatureza] = useState<any>();
  const [status, setStatus] = useState<any>();
  const [tipoCorrida, setTipoCorrida] = useState<any>("");
  const [motoristaId, setMotoristaId] = useState<any>();
  const [dataHoraProgramado, setDataHoraProgramado] = useState<any>();
  const [observacao, setObservacao] = useState<any>();

  const [qntTempoParado, setQntTempoParado] = useState<any>();
  const [valorDeslocamento, setValorDeslocamento] = useState<any>();
  const [valorDeslocamentoRepasse, setValorDeslocamentoRepasse] =
    useState<any>();
  const [valorEstacionamento, setValorEstacionamento] = useState<any>();
  const [valorHoraParada, setValorHoraParada] = useState<any>();
  const [valorHoraParadaRepasse, setValorHoraParadaRepasse] = useState<any>();
  const [valorPedagio, setValorPedagio] = useState<any>();
  const [valorViagem, setValorViagem] = useState<any>();
  const [valorViagemRepasse, setValorViagemRepasse] = useState<any>();

  const operId = useSolicitanteLogado()?.operadoraId.id;

  const { editar, loading } = useEditarVouchersEmMassa();

  const limparCampos = () => {
    setNatureza("");
    setStatus("");
    setTipoCorrida("");
    setMotoristaId("");
    setDataHoraProgramado("");
    setObservacao("");
    setQntTempoParado("");
    setValorDeslocamento("");
    setValorDeslocamentoRepasse("");
    setValorEstacionamento("");
    setValorHoraParada("");
    setValorHoraParadaRepasse("");
    setValorPedagio("");
    setValorViagem("");
    setValorViagemRepasse("");
  };

  const editarEmMassaFunc = async () => {
    if (idsSelecionados.length === 0) {
      alert("Nenhum voucher selecionado preparado para Edição");
      return;
    }

    const edit = {
      natureza,
      status,
      tipoCorrida,
      motoristaId,
      dataHoraProgramado: dataHoraProgramado
        ? new Date(dataHoraProgramado)
        : undefined,
      observacao,
      qntTempoParado,
      valorDeslocamento: valorDeslocamento
        ? parseFloat(valorDeslocamento)
        : undefined,
      valorDeslocamentoRepasse: valorDeslocamentoRepasse
        ? parseFloat(valorDeslocamentoRepasse)
        : undefined,
      valorEstacionamento: valorEstacionamento
        ? parseFloat(valorEstacionamento)
        : undefined,
      valorHoraParada: valorHoraParada
        ? parseFloat(valorHoraParada)
        : undefined,
      valorHoraParadaRepasse: valorHoraParadaRepasse
        ? parseFloat(valorHoraParadaRepasse)
        : undefined,
      valorPedagio: valorPedagio ? parseFloat(valorPedagio) : undefined,
      valorViagem: valorViagem ? parseFloat(valorViagem) : undefined,
      valorViagemRepasse: valorViagemRepasse
        ? parseFloat(valorViagemRepasse)
        : undefined,
    };

    const inputLimpo = Object.fromEntries(
      Object.entries(edit).filter(
        ([_, valor]) => valor !== "" && valor !== undefined && valor !== null,
      ),
    );

    if (Object.keys(inputLimpo).length === 0) {
      alert("Preencha pelo menos um campo para aplicar a edição em massa.");
      return;
    }

    const editFinal = { ids: idsSelecionados, ...inputLimpo };

    await editar(editFinal);

    setVisivel(false);
    limparCampos();
    refetch();

    return;
  };

  const { listaMotoristas } = useMotorista(operId);

  const { Cor } = useTema();

  return (
    <Overlay
      $visivel={visivel}
      $bg={Cor.base}
      onClick={() => setVisivel(false)}
    >
      <CxModal
        $visivel={visivel}
        $bg={Cor.base}
        $border={Cor.texto2 + "50"}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{ display: "flex", flexDirection: "column", width: "100%" }}
        >
          <p
            style={{
              fontSize: 16,
              fontWeight: "normal",
              color: Cor.primariaTxt,
            }}
          >
            Edição em <strong>Massa</strong> de Vouchers
          </p>
          <p style={{ fontSize: 12, fontWeight: "normal" }}>
            Os Campos editados serão alterados em todos os vouchers anteriomente
            selecionados.
          </p>
          <div
            style={{
              width: "100%",
              height: 1,
              backgroundColor: Cor.secundaria,
            }}
          />
        </div>
        {/* Primeira Linha de Opcionais */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            width: "100%",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", width: "32%" }}
          >
            <p
              style={{
                fontSize: 14,
                color: Cor.primariaTxt + 90,
                fontWeight: "bold",
                margin: 5,
              }}
            >
              Natureza:
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
                onChange={(e) => setNatureza(e.target.value)}
                value={natureza}
              >
                <option
                  value={""}
                  style={{ backgroundColor: Cor.base2, color: Cor.texto2 + 70 }}
                >
                  Defina a Natureza
                </option>
                <option
                  value="Fixo"
                  style={{ backgroundColor: Cor.base2, color: Cor.texto2 }}
                >
                  Fixo
                </option>
                <option
                  value="Extra"
                  style={{ backgroundColor: Cor.base2, color: Cor.texto2 }}
                >
                  Extra
                </option>
                <option
                  value="Turno"
                  style={{ backgroundColor: Cor.base2, color: Cor.texto2 }}
                >
                  Turno
                </option>
              </select>
            </div>
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", width: "32%" }}
          >
            <p
              style={{
                fontSize: 14,
                color: Cor.primariaTxt + 90,
                fontWeight: "bold",
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
                onChange={(e) => setTipoCorrida(e.target.value)}
                value={tipoCorrida}
              >
                <option
                  value={""}
                  style={{ backgroundColor: Cor.base2, color: Cor.texto2 + 70 }}
                >
                  Defina o tipo da Corrida
                </option>
                <option
                  value="Entrada"
                  style={{ backgroundColor: Cor.base2, color: Cor.texto2 }}
                >
                  Entrada
                </option>
                <option
                  value="Saida"
                  style={{ backgroundColor: Cor.base2, color: Cor.texto2 }}
                >
                  Saída
                </option>
              </select>
            </div>
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", width: "32%" }}
          >
            <p
              style={{
                fontSize: 14,
                color: Cor.primariaTxt + 90,
                fontWeight: "bold",
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
                onChange={(e) => setStatus(e.target.value)}
                value={status}
              >
                <option
                  value={""}
                  style={{ backgroundColor: Cor.base2, color: Cor.texto2 + 70 }}
                >
                  Defina o status do Vouchers
                </option>
                <option
                  value="Aberto"
                  style={{ backgroundColor: Cor.base2, color: Cor.texto2 }}
                >
                  Aberto
                </option>
                <option
                  value="Concluido"
                  style={{ backgroundColor: Cor.base2, color: Cor.texto2 }}
                >
                  Concluido
                </option>
                <option
                  value="Cancelado"
                  style={{ backgroundColor: Cor.base2, color: Cor.texto2 }}
                >
                  Cancelado
                </option>
              </select>
            </div>
          </div>
        </div>
        {/* Primeira Linha de Opcionais */}
        <div
          style={{
            width: "100%",
            height: 1,
            backgroundColor: Cor.texto2 + 90,
          }}
        />
        {/* Segunda Linha de Opcionais */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            width: "100%",
            justifyContent: "space-evenly",
            alignItems: "center",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", width: "32%" }}
          >
            <p
              style={{
                fontSize: 14,
                color: Cor.primariaTxt + 90,
                fontWeight: "bold",
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
                onChange={(e) => setMotoristaId(e.target.value)}
                value={motoristaId}
              >
                <option
                  value={""}
                  style={{ backgroundColor: Cor.base2, color: Cor.texto2 + 70 }}
                >
                  Selecione o Motorista
                </option>
                {listaMotoristas?.map((m: any) => {
                  return (
                    <option
                      key={m.id}
                      value={m.id}
                      style={{
                        backgroundColor: Cor.base2,
                        color: Cor.texto2,
                      }}
                    >
                      {m.nome}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", width: "32%" }}
          >
            <p
              style={{
                fontSize: 14,
                color: Cor.primariaTxt + 90,
                fontWeight: "bold",
                margin: 5,
              }}
            >
              Data Programada:
            </p>
            <div
              style={{
                width: "100%",
                border: `1px solid ${Cor.texto2 + 50}`,
                padding: 10,
                borderRadius: 14,
              }}
            >
              <input
                type="datetime-local"
                style={{
                  border: "none",
                  outline: "none",
                  backgroundColor: "transparent",
                  width: "100%",
                  color: Cor.texto1,
                }}
                value={dataHoraProgramado}
                onChange={(e) => setDataHoraProgramado(e.target.value)}
              />
            </div>
          </div>
        </div>
        {/* Segunda Linha de Opcionais */}
        <div
          style={{
            width: "100%",
            height: 1,
            backgroundColor: Cor.texto2 + 90,
          }}
        />
        {/* Terceira Linha Valores */}
        {/* Parte 1 */}
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", width: "32%" }}
          >
            <p
              style={{
                fontSize: 14,
                color: Cor.primariaTxt + 90,
                fontWeight: "bold",
                margin: 5,
              }}
            >
              Valor Viagem:
            </p>
            <div
              style={{
                width: "100%",
                border: `1px solid ${Cor.texto2 + 50}`,
                padding: 10,
                borderRadius: 14,
              }}
            >
              <input
                type="number"
                style={{
                  border: "none",
                  outline: "none",
                  backgroundColor: "transparent",
                  width: "100%",
                  color: Cor.texto1,
                }}
                value={valorViagem}
                onChange={(e) => setValorViagem(e.target.value)}
                placeholder="Digite aqui..."
              />
            </div>
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", width: "32%" }}
          >
            <p
              style={{
                fontSize: 14,
                color: Cor.primariaTxt + 90,
                fontWeight: "bold",
                margin: 5,
              }}
            >
              Valor Deslocamento:
            </p>
            <div
              style={{
                width: "100%",
                border: `1px solid ${Cor.texto2 + 50}`,
                padding: 10,
                borderRadius: 14,
              }}
            >
              <input
                type="number"
                style={{
                  border: "none",
                  outline: "none",
                  backgroundColor: "transparent",
                  width: "100%",
                  color: Cor.texto1,
                }}
                value={valorDeslocamento}
                onChange={(e) => setValorDeslocamento(e.target.value)}
                placeholder="Digite aqui..."
              />
            </div>
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", width: "32%" }}
          >
            <p
              style={{
                fontSize: 14,
                color: Cor.primariaTxt + 90,
                fontWeight: "bold",
                margin: 5,
              }}
            >
              Valor Hora Parada:
            </p>
            <div
              style={{
                width: "100%",
                border: `1px solid ${Cor.texto2 + 50}`,
                padding: 10,
                borderRadius: 14,
              }}
            >
              <input
                type="number"
                style={{
                  border: "none",
                  outline: "none",
                  backgroundColor: "transparent",
                  width: "100%",
                  color: Cor.texto1,
                }}
                value={valorHoraParada}
                onChange={(e) => setValorHoraParada(e.target.value)}
                placeholder="Digite aqui..."
              />
            </div>
          </div>
        </div>
        {/* Parte 1 */}
        {/* Parte 2 */}
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", width: "32%" }}
          >
            <p
              style={{
                fontSize: 14,
                color: Cor.primariaTxt + 90,
                fontWeight: "bold",
                margin: 5,
              }}
            >
              Valor Viagem Repasse:
            </p>
            <div
              style={{
                width: "100%",
                border: `1px solid ${Cor.texto2 + 50}`,
                padding: 10,
                borderRadius: 14,
              }}
            >
              <input
                type="number"
                style={{
                  border: "none",
                  outline: "none",
                  backgroundColor: "transparent",
                  width: "100%",
                  color: Cor.texto1,
                }}
                value={valorViagemRepasse}
                onChange={(e) => setValorViagemRepasse(e.target.value)}
                placeholder="Digite aqui..."
              />
            </div>
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", width: "32%" }}
          >
            <p
              style={{
                fontSize: 14,
                color: Cor.primariaTxt + 90,
                fontWeight: "bold",
                margin: 5,
              }}
            >
              Valor Deslocamento Repasse:
            </p>
            <div
              style={{
                width: "100%",
                border: `1px solid ${Cor.texto2 + 50}`,
                padding: 10,
                borderRadius: 14,
              }}
            >
              <input
                type="number"
                style={{
                  border: "none",
                  outline: "none",
                  backgroundColor: "transparent",
                  width: "100%",
                  color: Cor.texto1,
                }}
                value={valorDeslocamentoRepasse}
                onChange={(e) => setValorDeslocamentoRepasse(e.target.value)}
                placeholder="Digite aqui..."
              />
            </div>
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", width: "32%" }}
          >
            <p
              style={{
                fontSize: 14,
                color: Cor.primariaTxt + 90,
                fontWeight: "bold",
                margin: 5,
              }}
            >
              Valor Hora Parada Repasse:
            </p>
            <div
              style={{
                width: "100%",
                border: `1px solid ${Cor.texto2 + 50}`,
                padding: 10,
                borderRadius: 14,
              }}
            >
              <input
                type="number"
                style={{
                  border: "none",
                  outline: "none",
                  backgroundColor: "transparent",
                  width: "100%",
                  color: Cor.texto1,
                }}
                value={valorHoraParadaRepasse}
                onChange={(e) => setValorHoraParadaRepasse(e.target.value)}
                placeholder="Digite aqui..."
              />
            </div>
          </div>
        </div>
        {/* Parte 2 */}
        {/* Parte 3 */}
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", width: "32%" }}
          >
            <p
              style={{
                fontSize: 14,
                color: Cor.primariaTxt + 90,
                fontWeight: "bold",
                margin: 5,
              }}
            >
              Valor Estacionamento:
            </p>
            <div
              style={{
                width: "100%",
                border: `1px solid ${Cor.texto2 + 50}`,
                padding: 10,
                borderRadius: 14,
              }}
            >
              <input
                type="number"
                style={{
                  border: "none",
                  outline: "none",
                  backgroundColor: "transparent",
                  width: "100%",
                  color: Cor.texto1,
                }}
                value={valorEstacionamento}
                onChange={(e) => setValorEstacionamento(e.target.value)}
                placeholder="Digite aqui..."
              />
            </div>
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", width: "32%" }}
          >
            <p
              style={{
                fontSize: 14,
                color: Cor.primariaTxt + 90,
                fontWeight: "bold",
                margin: 5,
              }}
            >
              Valor Pedágio:
            </p>
            <div
              style={{
                width: "100%",
                border: `1px solid ${Cor.texto2 + 50}`,
                padding: 10,
                borderRadius: 14,
              }}
            >
              <input
                type="number"
                style={{
                  border: "none",
                  outline: "none",
                  backgroundColor: "transparent",
                  width: "100%",
                  color: Cor.texto1,
                }}
                value={valorPedagio}
                onChange={(e) => setValorPedagio(e.target.value)}
                placeholder="Digite aqui..."
              />
            </div>
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", width: "32%" }}
          >
            <p
              style={{
                fontSize: 14,
                color: Cor.primariaTxt + 90,
                fontWeight: "bold",
                margin: 5,
              }}
            >
              Tempo Parado:
            </p>
            <div
              style={{
                width: "100%",
                border: `1px solid ${Cor.texto2 + 50}`,
                padding: 10,
                borderRadius: 14,
              }}
            >
              <input
                type="number"
                style={{
                  border: "none",
                  outline: "none",
                  backgroundColor: "transparent",
                  width: "100%",
                  color: Cor.texto1,
                }}
                value={qntTempoParado}
                onChange={(e) => setQntTempoParado(e.target.value)}
                placeholder="Digite aqui..."
              />
            </div>
          </div>
        </div>
        {/* Parte 3 */}
        {/* Terceira Linha Valores */}
        <div
          style={{
            width: "100%",
            height: 1,
            backgroundColor: Cor.texto2 + 90,
          }}
        />
        {/* Observação do Operador */}
        <div
          style={{ display: "flex", flexDirection: "column", width: "100%" }}
        >
          <p
            style={{
              fontSize: 14,
              color: Cor.primariaTxt + 90,
              fontWeight: "bold",
              margin: 5,
            }}
          >
            Observação do Operador:
          </p>
          <div
            style={{
              width: "100%",
              border: `1px solid ${Cor.texto2 + 50}`,
              padding: 10,
              borderRadius: 14,
            }}
          >
            <input
              type="text"
              style={{
                border: "none",
                outline: "none",
                backgroundColor: "transparent",
                width: "100%",
                color: Cor.texto1,
              }}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Digite aqui..."
            />
          </div>
        </div>
        {/* Observação do Operador */}
        <div
          style={{
            width: "100%",
            height: 1,
            backgroundColor: Cor.texto2 + 90,
          }}
        />
        {/* Ações */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            width: "100%",
            gap: 10,
          }}
        >
          <BtnVouchers $bg={Cor.atencao}>
            <p>Cancelar Vouchers</p>
          </BtnVouchers>
          <BtnVouchers $bg={Cor.primaria} onClick={() => editarEmMassaFunc()}>
            <p>{loading ? "Salvando..." : "Salvar para Todos"}</p>
          </BtnVouchers>
        </div>
        {/* Ações */}
      </CxModal>
    </Overlay>
  );
}

interface BtnVouchersProps {
  $bg: string;
}

const BtnVouchers = styled.div<BtnVouchersProps>`
  width: 15%;
  padding: 10px;
  background-color: ${({ $bg }) => $bg + 50};
  border-radius: 14px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: ${({ $bg }) => $bg};
  border: 1px solid ${({ $bg }) => $bg + 50};
  transition: all 0.3s ease-in-out;
  cursor: pointer;
  user-select: none;

  &:hover {
    background-color: ${({ $bg }) => $bg + 90};
    scale: 1.02;
  }

  &:active {
    background-color: ${({ $bg }) => $bg + 70};
    scale: 0.98;
  }
`;

// interface CardProps {
//   $cor: string;
//   $direction: string;
//   $padding: string;
// }

// const Card = styled.div<CardProps>`
//   width: 25%;
//   height: 100px;
//   border-radius: 14px;
//   background-color: ${({ $cor }) => $cor + 50};
//   padding: ${({ $padding }) => $padding};
//   display: flex;
//   flex-direction: ${({ $direction }) => $direction};
//   justify-content: space-between;
//   transition: ease-in-out all 0.1s;
//   user-select: none;
//   cursor: pointer;

//   &:hover {
//     background-color: ${({ $cor }) => $cor + 70};
//     scale: 1.02;
//   }

//   &:active {
//     background-color: ${({ $cor }) => $cor + 90};
//     scale: 0.98;
//   }
// `;

// const CardT = styled.div<CardProps>`
//   width: 25%;
//   height: 100px;
//   border-radius: 14px;
//   background-color: ${({ $cor }) => $cor};
//   padding: ${({ $padding }) => $padding};
//   display: flex;
//   flex-direction: ${({ $direction }) => $direction};
//   justify-content: space-between;
//   transition: ease-in-out all 0.1s;
//   user-select: none;
//   cursor: pointer;

//   &:hover {
//     background-color: ${({ $cor }) => $cor + "BB"};
//     scale: 1.02;
//   }

//   &:active {
//     background-color: ${({ $cor }) => $cor + "CC"};
//     scale: 0.98;
//   }
// `;

// function ResumoValores({
//   listaRelatorio,
// }: {
//   listaRelatorio: any;
//   filtro: any;
// }) {
//   const totais = listaRelatorio.reduce(
//     (soma: any, voucher: any) => {
//       const totalHoraParadaVoucher =
//         (voucher.valorHoraParada || 0) * (voucher.qntTempoParado || 0);
//       const totalHoraParadaRepasseVoucher =
//         (voucher.valorHoraParadaRepasse || 0) * (voucher.qntTempoParado || 0);

//       return {
//         viagem: soma.viagem + (voucher.valorViagem || 0),
//         viagemRepasse: soma.viagemRepasse + (voucher.valorViagemRepasse || 0),
//         deslocamento: soma.deslocamento + (voucher.valorDeslocamento || 0),
//         deslocamentoRepasse:
//           soma.deslocamentoRepasse + (voucher.valorDeslocamentoRepasse || 0),
//         pedagio: soma.pedagio + (voucher.valorPedagio || 0),
//         // Aqui somamos os valores já calculados com o tempo parado
//         horaParada: soma.horaParada + totalHoraParadaVoucher,
//         horaParadaRepasse:
//           soma.horaParadaRepasse + totalHoraParadaRepasseVoucher,
//       };
//     },
//     {
//       viagem: 0,
//       viagemRepasse: 0,
//       deslocamento: 0,
//       deslocamentoRepasse: 0,
//       pedagio: 0,
//       horaParada: 0,
//       horaParadaRepasse: 0,
//     },
//   );

//   const totalViagem =
//     totais.viagem + totais.deslocamento + totais.pedagio + totais.horaParada;

//   const totalRepasse =
//     totais.viagemRepasse +
//     totais.deslocamentoRepasse +
//     totais.pedagio +
//     totais.horaParadaRepasse;

//   function motoristasUnicos() {
//     const totalMotoristas = new Set(
//       listaRelatorio.map((v: any) => v.motorista.id),
//     );

//     return totalMotoristas.size || 0;
//   }

//   const lucro = totalViagem - totalRepasse;

//   const porcentLucro = (lucro / totalViagem) * 100;

//   const qntHP = listaRelatorio.reduce((soma: any, voucher: any) => {
//     return soma + (voucher.qntTempoParado || 0);
//   }, 0);

//   const valorCobrancaHp = listaRelatorio.reduce((soma: any, voucher: any) => {
//     return soma + (voucher.valorHoraParada * voucher.qntTempoParado || 0);
//   }, 0);

//   const valorRepasseHp = listaRelatorio.reduce((soma: any, voucher: any) => {
//     return (
//       soma + (voucher.valorHoraParadaRepasse * voucher.qntTempoParado || 0)
//     );
//   }, 0);

//   const totalFixos = listaRelatorio.filter((v: any) => v.natureza === "Fixo");
//   const totalExtras = listaRelatorio.filter((v: any) => v.natureza === "Extra");
//   const totalTurnos = listaRelatorio.filter((v: any) => v.natureza === "Turno");

//   function formatarValor(valor: any) {
//     const valorFormatado = new Intl.NumberFormat("pt-BR", {
//       style: "currency",
//       currency: "BRL",
//     }).format(valor);
//     return valorFormatado;
//   }

//   function formatPorcentagem(valor: any) {
//     const valorFormatado = new Intl.NumberFormat("pt-BR", {
//       style: "percent",
//       minimumFractionDigits: 1,
//       maximumFractionDigits: 1,
//     }).format(valor);

//     return valorFormatado;
//   }

//   const { Cor } = useTema();
//   return (
//     <div
//       style={{
//         width: "100%",
//         display: "flex",
//         flexDirection: "row",
//         gap: 10,
//         padding: 15,
//         marginTop: 10,
//         backgroundColor: Cor.base2,
//         borderRadius: 22,
//         boxShadow: Cor.sombra,
//       }}
//     >
//       {/* Card Faturamento Bruto */}
//       <CardT $cor={Cor.primaria} $direction="column" $padding="10px">
//         <div
//           style={{
//             display: "flex",
//             flexDirection: "row",
//             justifyContent: "space-between",
//             alignItems: "flex-start",
//           }}
//         >
//           <p style={{ fontWeight: "bolder", color: "#FFF", fontSize: 14 }}>
//             Faturamento Bruto
//           </p>
//           <p
//             style={{
//               fontFamily: "Icone",
//               fontWeight: "bolder",
//               fontSize: 24,
//               color: "#FFFF",
//             }}
//           >
//             local_activity
//           </p>
//         </div>
//         <p style={{ fontWeight: "bolder", color: "#FFFF", fontSize: 30 }}>
//           {formatarValor(totalViagem)}
//         </p>
//         <div
//           style={{
//             display: "flex",
//             flexDirection: "row",
//             gap: 5,
//             alignItems: "center",
//           }}
//         >
//           <p style={{ color: "#FFFF", fontSize: 12 }}>Fat. líquido:</p>
//           <p style={{ fontWeight: "bolder", color: "#FFFF", fontSize: 16 }}>
//             {formatarValor(totalViagem - totalRepasse)} |{" "}
//             <strong style={{ color: Cor.ativo }}>
//               {formatPorcentagem(porcentLucro / 100)}
//             </strong>
//           </p>
//         </div>
//       </CardT>
//       {/* Card Repasse Motoristas */}
//       <Card $cor={Cor.texto2} $direction="column" $padding="10px">
//         <div
//           style={{
//             display: "flex",
//             flexDirection: "row",
//             justifyContent: "space-between",
//             alignItems: "flex-start",
//           }}
//         >
//           <p style={{ fontWeight: "bolder", color: Cor.texto1, fontSize: 14 }}>
//             Total Repasses
//           </p>
//           <p
//             style={{
//               fontFamily: "Icone",
//               fontWeight: "bolder",
//               fontSize: 24,
//               color: Cor.texto1,
//             }}
//           >
//             car_tag
//           </p>
//         </div>
//         <p style={{ fontWeight: "bolder", color: Cor.atencao, fontSize: 28 }}>
//           {formatarValor(totalRepasse)}
//         </p>
//         <div
//           style={{
//             display: "flex",
//             flexDirection: "row",
//             gap: 5,
//             alignItems: "center",
//           }}
//         >
//           <p style={{ color: Cor.texto1, fontSize: 12 }}>Total de: </p>
//           <p
//             style={{
//               color: Cor.texto1,
//               fontSize: 16,
//               display: "flex",
//               flexDirection: "row",
//               gap: 5,
//               alignItems: "center",
//             }}
//           >
//             <strong style={{ color: Cor.secundaria, fontSize: 20 }}>
//               {motoristasUnicos()}
//             </strong>{" "}
//             motoristas
//           </p>
//         </div>
//       </Card>
//       {/* Card Horas Paradas */}
//       <Card $cor={Cor.texto2} $direction="row" $padding="8px">
//         <div
//           style={{
//             width: "50%",
//             display: "flex",
//             flexDirection: "column",
//             justifyContent: "space-between",
//             alignItems: "center",
//           }}
//         >
//           <p
//             style={{
//               color: Cor.texto1,
//               fontSize: 14,
//               textAlign: "center",
//               fontWeight: "bold",
//             }}
//           >
//             Total de Horas Paradas:
//           </p>
//           <p
//             style={{
//               fontSize: 34,
//               textAlign: "center",
//               fontWeight: "bold",
//               color: Cor.secundaria,
//             }}
//           >
//             {qntHP}h
//           </p>
//         </div>
//         <div
//           style={{
//             width: 1,
//             height: "100%",
//             backgroundColor: Cor.texto2,
//             margin: "0 5px",
//           }}
//         />
//         <div
//           style={{
//             width: "50%",
//             display: "flex",
//             flexDirection: "column",
//             justifyContent: "space-between",
//             alignItems: "Flex-start",
//             gap: 10,
//           }}
//         >
//           <div
//             style={{
//               display: "flex",
//               flexDirection: "column",
//               alignItems: "Flex-start",
//             }}
//           >
//             <p style={{ fontSize: 12, textAlign: "center", color: Cor.texto1 }}>
//               Cobrança:{" "}
//             </p>
//             <strong
//               style={{
//                 fontSize: 16,
//                 textAlign: "center",
//                 color: Cor.secundaria,
//               }}
//             >
//               {formatarValor(valorCobrancaHp)}
//             </strong>
//           </div>
//           <div
//             style={{
//               display: "flex",
//               flexDirection: "column",
//               alignItems: "Flex-start",
//             }}
//           >
//             <p style={{ fontSize: 12, textAlign: "center", color: Cor.texto1 }}>
//               Repasse:
//             </p>
//             <strong
//               style={{
//                 fontSize: 16,
//                 textAlign: "center",
//                 color: Cor.secundaria,
//               }}
//             >
//               {formatarValor(valorRepasseHp)}
//             </strong>
//           </div>
//         </div>
//       </Card>
//       {/* Card Naturezas Voucher   */}
//       <Card $cor={Cor.texto2} $direction="row" $padding="5px">
//         <div
//           style={{
//             width: "100%",
//             height: "100%",
//             display: "flex",
//             flexDirection: "row",
//             justifyContent: "space-between",
//             alignItems: "center",
//           }}
//         >
//           <div
//             style={{
//               width: "33%",
//               height: "100%",
//               display: "flex",
//               flexDirection: "column",
//               justifyContent: "center",
//               alignItems: "center",
//               gap: 5,
//               borderRadius: "10px 0 0 10px",
//               background:
//                 totalFixos.length === 0
//                   ? `linear-gradient(to top, ${Cor.texto2 + 60},${Cor.texto2 + 15})`
//                   : `linear-gradient(to top, ${Cor.fixo + 40},${Cor.fixo + 10})`,
//             }}
//           >
//             <p
//               style={{
//                 fontWeight: "bolder",
//                 color: totalFixos.length === 0 ? Cor.texto2 : Cor.textoFixo,
//                 fontSize: 32,
//                 borderBottom:
//                   totalFixos.length === 0
//                     ? `1px solid ${Cor.texto2}`
//                     : `1px solid ${Cor.fixo}`,
//                 width: "70%",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//               }}
//             >
//               {totalFixos.length}
//             </p>
//             <p
//               style={{
//                 color: totalFixos.length === 0 ? Cor.texto2 : Cor.textoFixo,
//                 fontWeight: 500,
//               }}
//             >
//               Fixos
//             </p>
//           </div>
//           <div
//             style={{
//               width: 1,
//               height: "100%",
//               backgroundColor: Cor.texto2,
//             }}
//           />
//           <div
//             style={{
//               width: "33%",
//               height: "100%",
//               display: "flex",
//               flexDirection: "column",
//               justifyContent: "center",
//               alignItems: "center",
//               gap: 5,
//               background:
//                 totalExtras.length === 0
//                   ? `linear-gradient(to top, ${Cor.texto2 + 60},${Cor.texto2 + 15})`
//                   : `linear-gradient(to top, ${Cor.extra + 40},${Cor.extra + 10})`,
//             }}
//           >
//             <p
//               style={{
//                 fontWeight: "bolder",
//                 color: totalExtras.length === 0 ? Cor.texto2 : Cor.textoExtra,
//                 fontSize: 32,
//                 borderBottom:
//                   totalExtras.length === 0
//                     ? `1px solid ${Cor.texto2}`
//                     : `1px solid ${Cor.extra}`,
//                 width: "70%",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//               }}
//             >
//               {totalExtras.length}
//             </p>
//             <p
//               style={{
//                 color: totalExtras.length === 0 ? Cor.texto2 : Cor.textoExtra,
//                 fontWeight: 500,
//               }}
//             >
//               Extras
//             </p>
//           </div>
//           <div
//             style={{
//               width: 1,
//               height: "100%",
//               backgroundColor: Cor.texto2,
//             }}
//           />
//           <div
//             style={{
//               width: "33%",
//               height: "100%",
//               display: "flex",
//               flexDirection: "column",
//               justifyContent: "center",
//               alignItems: "center",
//               gap: 5,
//               borderRadius: "0 10px 10px 0",
//               background:
//                 totalTurnos.length === 0
//                   ? `linear-gradient(to top, ${Cor.texto2 + 60},${Cor.texto2 + 15})`
//                   : `linear-gradient(to top, ${Cor.turno + 40},${Cor.turno + 10})`,
//             }}
//           >
//             <p
//               style={{
//                 fontWeight: "bolder",
//                 color: totalTurnos.length === 0 ? Cor.texto2 : Cor.textoTurno,
//                 fontSize: 32,
//                 borderBottom:
//                   totalTurnos.length === 0
//                     ? `1px solid ${Cor.texto2}`
//                     : `1px solid ${Cor.turno}`,
//                 width: "70%",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//               }}
//             >
//               {totalTurnos.length}
//             </p>
//             <p
//               style={{
//                 color: totalTurnos.length === 0 ? Cor.texto2 : Cor.textoTurno,
//                 fontWeight: 500,
//               }}
//             >
//               Turnos
//             </p>
//           </div>
//         </div>
//       </Card>
//     </div>
//   );
// }

function BaseFiltros({
  filtroAtivo,
  setFiltroAtivo,
  setIdsParaBusca,
  exportarPlanilha,
  carregandoExportacao,
}: {
  filtroAtivo: any;
  setFiltroAtivo: any;
  setIdsParaBusca: any;
  exportarPlanilha: any;
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
        boxShadow: Cor.sombra
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
          <BtnFiltrar $cor={Cor.texto2} onClick={() => exportarPlanilha()}>
            {carregandoExportacao ? "Exportando..." : "Exportar"}
          </BtnFiltrar>
        </div>
      </div>
    </div>
  );
}

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
