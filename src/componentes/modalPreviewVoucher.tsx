import { useTema } from "../hooks/temaContext";
import styled from "styled-components";
import assPadrao from "../assets/image/not_sing.png";
import { useVoucherExtraId, useVoucherFixoId } from "../hooks/useVouchers";
import CircularProgress from "@mui/material/CircularProgress";

interface CxModalProps {
  $border: string;
  $visivel: boolean;
  $bg: string;
}

const Overlay = styled.div<{ $visivel: boolean; $bg: string }>`
  width: 100vw;
  height: 100vh;
  background-color: ${({ $bg }) => `${$bg}90`};
  position: absolute;
  display: flex;
  flex-direction: row;
  justify-content: center;
  alin-items: center;
  top: 0;
  left: 0;
  padding: 1%;
  z-index: 10;
  backdrop-filter: blur(3px);
  opacity: ${({ $visivel }) => ($visivel ? 1 : 0)};
  pointer-events: ${({ $visivel }) => ($visivel ? "auto" : "none")};
  transition: all 0.3s ease-in-out;
`;

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

function ModalPreviewVoucher({
  visivel,
  setVisivel,
  v,
}: {
  visivel: boolean;
  setVisivel: any;
  v: any;
}) {
  const Cor = useTema().Cor;

  const { voucherExtraId, loading: loadingExtra } = useVoucherExtraId(
    v?.natureza === "Extra" ? v?.id : null,
  );

  console.log(v)

  const { voucherFixoId, loading: loadingFixo } = useVoucherFixoId(
    v?.natureza === "Fixo" || v?.natureza === "Turno" ? v?.id : null,
  );

  const voucher = v?.natureza === "Extra" ? voucherExtraId : voucherFixoId;
  const loading = loadingExtra || loadingFixo;

  if (!visivel) return null;

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
        {/* ESTADO DE CARREGAMENTO INTERNO DO MODAL */}
        {loading ? (
          <div
            style={{ display: "flex", justifyContent: "center", padding: 50 }}
          >
            <CircularProgress sx={{ color: Cor.primaria }} />
          </div>
        ) : !voucher ? (
          <div style={{ padding: 20, textAlign: "center" }}>
            <p>Erro ao carregar detalhes do voucher.</p>
            <button onClick={() => setVisivel(false)}>Fechar</button>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                width: "100%",
                paddingBottom: 5,
                borderBottom: `1px solid ${Cor.primaria}`,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: "bold",
                    color: Cor.texto1,
                  }}
                >
                  Detalhes
                </p>
                <p style={{ fontSize: 12, color: Cor.texto2 }}>
                  Mais informações sobre o voucher completo.
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <p
                  style={{
                    fontSize: 18,
                    color:
                      voucher.natureza === "Fixo"
                        ? Cor.textoFixo
                        : Cor.textoExtra,
                  }}
                >
                  ID: <strong>{voucher.id}</strong>
                </p>
                <p
                  style={{
                    cursor: "pointer",
                    fontFamily: "Icone",
                    fontSize: 24,
                    color: Cor.primaria,
                  }}
                  onClick={() => setVisivel(false)}
                >
                  close
                </p>
              </div>
            </div>

            {/* Renderização dos componentes filhos com o dado COMPLETO (voucher) */}
            <PrimeiraLinha v={voucher} />
            <DetalhesDaViagem v={voucher} />

            <div
              style={{
                width: "100%",
                height: 1,
                backgroundColor: Cor.texto2 + "70",
              }}
            />
            <DetalhesDaViagem2 v={voucher} />

            <div
              style={{
                width: "100%",
                height: 1,
                backgroundColor: Cor.texto2 + "70",
              }}
            />

            <div
              style={{
                width: "100%",
                gap: 10,
                display: "flex",
                flexDirection: "row",
              }}
            >
              <DetalhesDoOperador v={voucher} />
              <DetalhesDoMotorista v={voucher} />
            </div>

            <div
              style={{
                width: "100%",
                height: 180,
                display: "flex",
                flexDirection: "row",
                gap: 10,
              }}
            >
              <ListaPassageirosVoucher v={voucher} />
              <Assinatura v={voucher} />
            </div>

            <div
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-start",
              }}
            >
              <ResultadoVoucher v={voucher} />
            </div>
          </>
        )}
      </CxModal>
    </Overlay>
  );
}

export default ModalPreviewVoucher;

function PrimeiraLinha({ v }: { v: any }) {
  const Cor = useTema().Cor;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        padding: "5px 0 5px 0",
        borderBottom: `1px solid ${Cor.texto2 + 70}`,
      }}
    >
      <div
        style={{
          width: "50%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          borderRight: `1px solid ${Cor.texto2 + 70}`,
          padding: 5,
          gap: 10,
        }}
      >
        <img
          src={v?.empresaCliente?.fotoLogoCliente || "srcassetsimageicon.png"}
          alt="img_Marca_Cliente"
          style={{
            width: 75,
            height: 75,
            objectFit: "cover",
            borderRadius: 18,
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", width: "80%" }}>
          <p style={{ fontSize: 12, color: Cor.texto2 }}>Cliente</p>
          <p
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: Cor.texto1,
              textOverflow: "ellipsis",
              maxWidth: "95%",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            {v?.empresaCliente?.rSocial}
          </p>
          <p style={{ fontSize: 12, color: Cor.texto2 }}>Unidade</p>
          <p
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: Cor.texto1,
              textOverflow: "ellipsis",
              maxWidth: "95%",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            {v?.unidadeCliente?.nome} - {v?.unidadeCliente?.endRua},{" "}
            {v?.unidadeCliente?.endNumero} - {v?.unidadeCliente?.endBairro}
          </p>
        </div>
      </div>
      <div
        style={{
          width: "50%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          padding: 5,
        }}
      >
        <img
          src={v?.motorista?.fotoMotorista || "srcassetsimageimg-bg.png"}
          alt="img_Marca_Cliente"
          style={{
            width: 75,
            height: 75,
            objectFit: "cover",
            borderRadius: 18,
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", width: "80%" }}>
          <p style={{ fontSize: 12, color: Cor.texto2 }}>Motorista</p>
          <p style={{ fontSize: 16, fontWeight: "bold", color: Cor.texto1 }}>
            {v?.motorista?.nome}
          </p>
          <p style={{ fontSize: 12, color: Cor.texto2 }}>Veículo</p>
          <p
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: Cor.texto1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "block",
            }}
          >
            {v?.carro?.marca} {v?.carro?.modelo} {v?.carro?.cor} / Placa -{" "}
            {v?.carro?.placa}
          </p>
        </div>
      </div>
    </div>
  );
}

function DetalhesDaViagem({ v }: { v: any }) {
  const Cor = useTema().Cor;
  return (
    <div
      style={{
        width: "100%",
        height: 50,
        borderRadius: 18,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 25,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 35,
            height: 35,
            backgroundColor:
              v?.natureza === "Fixo"
                ? Cor.fixo
                : v?.natureza === "Turno"
                  ? Cor.turno
                  : Cor.extra,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p
            style={{
              fontFamily: "Icone",
              fontWeight: "bold",
              color: Cor.base,
              fontSize: 24,
            }}
          >
            {v?.natureza === "Fixo"
              ? "history"
              : v?.natureza === "Turno"
                ? "cycle"
                : "car_tag"}
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <p style={{ fontSize: 12, color: Cor.texto2 }}>Natureza</p>
          <p
            style={{
              fontSize: 14,
              fontWeight: "bold",
              color:
                v?.natureza === "Fixo"
                  ? Cor.textoFixo
                  : v?.natureza === "Turno"
                    ? Cor.textoTurno
                    : Cor.textoExtra,
            }}
          >
            {v?.natureza}
          </p>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 35,
            height: 35,
            backgroundColor:
              v?.natureza === "Fixo"
                ? Cor.fixo
                : v?.natureza === "Turno"
                  ? Cor.turno
                  : Cor.extra,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p
            style={{
              fontFamily: "Icone",
              fontWeight: "bold",
              color: Cor.base,
              fontSize: 24,
            }}
          >
            login
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <p style={{ fontSize: 12, color: Cor.texto2 }}>Tipo</p>
          <p
            style={{
              fontSize: 14,
              fontWeight: "bold",
              color:
                v?.natureza === "Fixo"
                  ? Cor.textoFixo
                  : v?.natureza === "Turno"
                    ? Cor.textoTurno
                    : Cor.textoExtra,
            }}
          >
            {v?.tipoCorrida}
          </p>
        </div>
      </div>
      <div
        style={{
          width: "45%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          padding: "10px 15px",
          backgroundColor: Cor.texto2 + 10,
          border: "1px solid " + Cor.texto2 + 30,
          borderRadius: 10,
          boxShadow: Cor.sombra,
        }}
      >
        <div
          style={{
            width: "45%",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <p style={{ fontSize: 12, color: Cor.texto2 }}>Origem</p>
            <p
              style={{
                width: 125,
                fontSize: 14,
                fontWeight: "bold",
                color:
                  v?.natureza === "Fixo"
                    ? Cor.textoFixo
                    : v?.natureza === "Turno"
                      ? Cor.textoTurno
                      : Cor.textoExtra,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "block",
              }}
            >
              {v?.origem}
            </p>
          </div>
          <div
            style={{
              width: 30,
              height: 30,
              backgroundColor:
                v?.natureza === "Fixo"
                  ? Cor.fixo
                  : v?.natureza === "Turno"
                    ? Cor.turno
                    : Cor.extra,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <p
              style={{
                fontFamily: "Icone",
                fontWeight: "bold",
                color: Cor.base,
                fontSize: 18,
              }}
            >
              map
            </p>
          </div>
        </div>
        <p
          style={{
            fontFamily: "Icone",
            fontWeight: "bold",
            color:
              v?.natureza === "Fixo"
                ? Cor.textoFixo
                : v?.natureza === "Turno"
                  ? Cor.textoTurno
                  : Cor.textoExtra,
            fontSize: 24,
          }}
        >
          close
        </p>
        <div
          style={{
            width: "45%",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              backgroundColor:
                v?.natureza === "Fixo"
                  ? Cor.fixo
                  : v?.natureza === "Turno"
                    ? Cor.turno
                    : Cor.extra,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <p
              style={{
                fontFamily: "Icone",
                fontWeight: "bold",
                color: Cor.base,
                fontSize: 20,
              }}
            >
              distance
            </p>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
            }}
          >
            <p
              style={{
                fontSize: 12,
                color: Cor.texto2,
                textAlign: "right",
              }}
            >
              Destino
            </p>
            <p
              style={{
                width: 125,
                fontSize: 14,
                fontWeight: "bold",
                color:
                  v?.natureza === "Fixo"
                    ? Cor.textoFixo
                    : v?.natureza === "Turno"
                      ? Cor.textoTurno
                      : Cor.textoExtra,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "block",
                textAlign: "right",
              }}
            >
              {v?.destino}
            </p>
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 35,
            height: 35,
            backgroundColor:
              v?.natureza === "Fixo"
                ? Cor.fixo
                : v?.natureza === "Turno"
                  ? Cor.turno
                  : Cor.extra,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p
            style={{
              fontFamily: "Icone",
              fontWeight: "bold",
              color: Cor.base,
              fontSize: 24,
            }}
          >
            timer
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <p style={{ fontSize: 12, color: Cor.texto2 }}>Programação</p>
          <p
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color:
                v?.natureza === "Fixo"
                  ? Cor.textoFixo
                  : v?.natureza === "Turno"
                    ? Cor.textoTurno
                    : Cor.textoExtra,
            }}
          >
            {new Date(v?.dataHoraProgramado).toLocaleString("pt-BR", {
              timeZone: "UTC",
              weekday: "short",
              hour: "2-digit",
              minute: "2-digit",
              day: "2-digit",
              month: "2-digit",
              year: "2-digit",
            })}
          </p>
          {v?.dataHoraConclusao === null ? null : (
            <p
              style={{
                fontSize: 12,
                color: Cor.texto1,
              }}
            >
              Assinado em:{" "}
              <strong
                style={{
                  fontSize: 14,
                  color:
                    v?.natureza === "Fixo"
                      ? Cor.textoFixo
                      : v?.natureza === "Turno"
                        ? Cor.textoTurno
                        : Cor.textoExtra,
                }}
              >
                {new Date(v?.dataHoraConclusao).toLocaleString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                })}
              </strong>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function DetalhesDaViagem2({ v }: { v: any }) {
  const Cor = useTema().Cor;

  console.log(v);
  return (
    <div
      style={{
        width: "100%",
        height: 50,
        borderRadius: 18,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 5,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 35,
            height: 35,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p
            style={{
              fontFamily: "Icone",
              fontWeight: "bold",
              color:
                v?.natureza === "Fixo"
                  ? Cor.fixo
                  : v?.natureza === "Turno"
                    ? Cor.turno
                    : Cor.extra,
              fontSize: 24,
            }}
          >
            request_quote
          </p>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <p style={{ fontSize: 12, color: Cor.texto2 }}>Valor Cobrança</p>
          <p
            style={{
              fontSize: 20,
              fontWeight: "bold",
              color:
                v?.natureza === "Fixo"
                  ? Cor.textoFixo
                  : v?.natureza === "Turno"
                    ? Cor.textoTurno
                    : Cor.textoExtra,
            }}
          >
            {Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(Number(v?.valorViagem))}
          </p>
        </div>
      </div>
      <div
        style={{
          width: 1,
          height: "80%",
          backgroundColor: Cor.texto2 + 70,
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          width: "12%",
        }}
      >
        <div
          style={{ display: "flex", flexDirection: "column", width: "100%" }}
        >
          <p style={{ fontSize: 12, color: Cor.texto2, textAlign: "center" }}>
            Adicional
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <p
              style={{
                fontSize: 12,
                color: Cor.texto1,
              }}
            >
              Cobr.:{" "}
              <strong
                style={{
                  fontSize: 14,
                  color:
                    v?.natureza === "Fixo"
                      ? Cor.textoFixo
                      : v?.natureza === "Turno"
                        ? Cor.textoTurno
                        : Cor.textoExtra,
                }}
              >
                {Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(Number(v?.valorDeslocamento))}
              </strong>
            </p>
          </div>
        </div>
      </div>
      <div
        style={{
          width: 1,
          height: "80%",
          backgroundColor: Cor.texto2 + 70,
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          width: "12%",
        }}
      >
        <div
          style={{ display: "flex", flexDirection: "column", width: "100%" }}
        >
          <p style={{ fontSize: 12, color: Cor.texto2, textAlign: "center" }}>
            Hora Parada
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <p
              style={{
                fontSize: 12,
                color: Cor.texto1,
              }}
            >
              Cobr.:{" "}
              <strong
                style={{
                  fontSize: 14,
                  color:
                    v?.natureza === "Fixo"
                      ? Cor.textoFixo
                      : v?.natureza === "Turno"
                        ? Cor.textoTurno
                        : Cor.textoExtra,
                }}
              >
                {Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(Number(v?.valorHoraParada * v?.qntTempoParado))}
              </strong>
            </p>
          </div>
        </div>
      </div>
      <div
        style={{
          width: 1,
          height: "80%",
          backgroundColor: Cor.texto2 + 70,
        }}
      />
      {v?.natureza === "Fixo" ? (
        <CodigoRoteiro v={v} />
      ) : v?.natureza === "Turno" ? (
        <CodigoRoteiro v={v} />
      ) : (
        <Solicitante v={v} />
      )}
    </div>
  );
}

function Solicitante({ v }: { v: any }) {
  const Cor = useTema().Cor;
  const natureza = v?.natureza;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: 10,
        alignItems: "center",
        backgroundColor: Cor.texto2 + 20,
        padding: "5px 10px",
        borderLeft: `12px solid ${natureza === "fixo" ? Cor.fixo : Cor.extra}`,
        borderTop: `1px solid ${Cor.texto2 + 20}`,
        borderRight: `1px solid ${Cor.texto2 + 20}`,
        borderBottom: `1px solid ${Cor.texto2 + 20}`,
        width: 300,
        borderRadius: 18,
      }}
    >
      <p
        style={{
          fontFamily: "Icone",
          fontWeight: "bold",
          color: natureza === "fixo" ? Cor.fixo : Cor.extra,
          fontSize: 28,
        }}
      >
        person
      </p>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        <p style={{ fontSize: 12, color: Cor.texto2 }}>Solicitante</p>
        <p
          style={{
            fontSize: 20,
            fontWeight: "bold",
            color: natureza === "fixo" ? Cor.textoFixo : Cor.textoExtra,
          }}
        >
          {v?.solicitante?.nome}
        </p>
      </div>
    </div>
  );
}

function CodigoRoteiro({ v }: { v: any }) {
  const Cor = useTema().Cor;

  console.log(v)

  const natureza = v?.natureza;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: 10,
        alignItems: "center",
        backgroundColor: Cor.texto2 + 20,
        padding: "5px 10px",
        borderLeft: `12px solid ${
          v?.natureza === "Fixo"
            ? Cor.fixo
            : v?.natureza === "Turno"
              ? Cor.turno
              : Cor.extra
        }`,
        borderTop: `1px solid ${Cor.texto2 + 20}`,
        borderRight: `1px solid ${Cor.texto2 + 20}`,
        borderBottom: `1px solid ${Cor.texto2 + 20}`,
        width: 300,
        borderRadius: 18,
      }}
    >
      <p
        style={{
          fontFamily: "Icone",
          fontWeight: "bold",
          color:
            v?.natureza === "Fixo"
              ? Cor.fixo
              : v?.natureza === "Turno"
                ? Cor.turno
                : Cor.extra,
          fontSize: 28,
        }}
      >
        person
      </p>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        <p style={{ fontSize: 12, color: Cor.texto2 }}>Código do Roteiro</p>
        <p
          style={{
            fontSize: 20,
            fontWeight: "bold",
            color:
              v?.natureza === "Fixo"
                ? Cor.textoFixo
                : v?.natureza === "Turno"
                  ? Cor.textoTurno
                  : Cor.textoExtra,
          }}
        >
          {natureza === "Fixo"
            ? v?.modeloFixo?.nomeModelo
            : v?.modeloTurno?.nomeModelo}
        </p>
      </div>
    </div>
  );
}

function DetalhesDoOperador({ v }: { v: any }) {
  const Cor = useTema().Cor;
  return (
    <div
      style={{
        width: "50%",
        backgroundColor: Cor.texto2 + 20,
        height: 35,
        borderRadius: 18,
        alignItems: "center",
        display: "flex",
        flexDirection: "row",
        padding: 10,
      }}
    >
      <p style={{ fontSize: 12, color: Cor.texto1, whiteSpace: "nowrap" }}>
        Obs. Opr.:{" "}
      </p>
      <p
        style={{
          fontSize: 12,
          fontWeight: "500",
          color: Cor.texto1,
          marginLeft: 5,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {v?.observacao || "Nenhuma observação registrada."}
      </p>
    </div>
  );
}

function DetalhesDoMotorista({ v }: { v: any }) {
  const Cor = useTema().Cor;
  return (
    <div
      style={{
        width: "50%",
        backgroundColor: Cor.texto2 + 20,
        height: 35,
        borderRadius: 18,
        alignItems: "center",
        display: "flex",
        flexDirection: "row",
        padding: 10,
      }}
    >
      <p style={{ fontSize: 12, color: Cor.texto1, whiteSpace: "noWrap" }}>
        Obs. Mot.:{" "}
      </p>
      <p
        style={{
          fontSize: 12,
          fontWeight: "500",
          color: Cor.texto1,
          marginLeft: 5,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {v?.observacaoMotorista || "Nenhuma observação registrada."}
      </p>
    </div>
  );
}

function ListaPassageirosVoucher({ v }: { v: any }) {
  const passageiros = v?.passageiros || [];

  const Cor = useTema().Cor;
  return (
    <div
      style={{
        width: "80%",
        backgroundColor: Cor.texto2 + 20,
        height: 180,
        borderRadius: 18,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        overflowY: "auto",
        gap: 5,
        padding: 10,
        border: `1px solid ${Cor.texto2 + 20}`,
        scrollbarColor: `${Cor.secundaria} ${Cor.base + "00"}`,
      }}
    >
      {passageiros.map((p: any, index: number) => (
        <CardPassageiroVoucher key={index} p={p} />
      ))}
    </div>
  );
}

function CardPassageiroVoucher({ p }: { p: any }) {
  const Cor = useTema().Cor;
  return (
    <div
      style={{
        height: 45,
        width: "100%",
        backgroundColor:
          p.statusPresenca === "Ausente" ? Cor.atencao + 50 : Cor.base,
        borderRadius: 10,
        border: `1px solid ${Cor.texto2 + 40}`,
        padding: 5,
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 5,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "28%",
        }}
      >
        <p style={{ fontSize: 12, color: Cor.texto2 }}>Tipo</p>
        <p
          style={{
            fontSize: 14,
            fontWeight: "500",
            color: Cor.texto1,
            textOverflow: "ellipsis",
            maxWidth: "95%",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {p?.passageiroId?.nome}
        </p>
      </div>
      <div style={{ width: 1, height: "100%", backgroundColor: Cor.texto2 }} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "14%",
        }}
      >
        <p style={{ fontSize: 12, color: Cor.texto2 }}>Telefone</p>
        <p
          style={{
            fontSize: 14,
            fontWeight: "500",
            color: Cor.texto1,
            textOverflow: "ellipsis",
            maxWidth: "95%",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {p?.passageiroId?.telefone}
        </p>
      </div>
      <div style={{ width: 1, height: "100%", backgroundColor: Cor.texto2 }} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "8%",
        }}
      >
        <p style={{ fontSize: 12, color: Cor.texto2 }}>Horário</p>
        <p
          style={{
            fontSize: 14,
            fontWeight: "500",
            color: Cor.texto1,
            textOverflow: "ellipsis",
            maxWidth: "95%",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {p?.passageiroId?.horarioEmbarque}
        </p>
      </div>
      <div style={{ width: 1, height: "100%", backgroundColor: Cor.texto2 }} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "45%",
        }}
      >
        <p style={{ fontSize: 12, color: Cor.texto2 }}>Endereço</p>
        <p
          style={{
            fontSize: 14,
            fontWeight: "500",
            color: Cor.texto1,
            textOverflow: "ellipsis",
            maxWidth: "100%",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {p?.passageiroId?.endRua}, {p?.passageiroId?.endNumero} -{" "}
          {p?.passageiroId?.endBairro} - {p?.passageiroId?.endCidade}
        </p>
      </div>
    </div>
  );
}

function Assinatura({ v }: { v: any }) {
  const Cor = useTema().Cor;

  return (
    <div
      style={{
        width: "20%",
        backgroundColor: Cor.texto2 + 20,
        height: 180,
        borderRadius: 18,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 5,
        padding: 10,
        border: `1px solid ${Cor.texto2 + 20}`,
        scrollbarColor: `${Cor.secundaria} ${Cor.base + "00"}`,
      }}
    >
      <p style={{ fontSize: 12, color: Cor.texto1 }}>Assinatura:</p>
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 10,
          backgroundColor: Cor.texto2 + 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 5,
        }}
      >
        <img
          src={v?.assinatura || assPadrao}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 6,
            backgroundColor: "#f4f4f4",
          }}
        />
      </div>
    </div>
  );
}

function ResultadoVoucher({ v }: { v: any }) {
  const totalCobranca =
    Number(v?.valorViagem || 0) +
    Number(v?.valorDeslocamento || 0) +
    Number(v?.valorHoraParada * v?.qntTempoParado || 0);
  const Cor = useTema().Cor;
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "row",
        gap: 10,
        alignItems: "center",
      }}
    >
      <p style={{ fontSize: 14, color: Cor.texto1 }}>Valor Total:</p>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        <p
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color:
              v?.natureza === "Fixo"
                ? Cor.textoFixo
                : v?.natureza === "Turno"
                  ? Cor.textoTurno
                  : Cor.textoExtra,
          }}
        >
          <strong>
            {Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(Number(totalCobranca))}
          </strong>
        </p>
      </div>
      <div
        style={{
          width: 1,
          height: "80%",
          backgroundColor: Cor.texto2 + 70,
        }}
      />

      <div
        style={{
          width: 1,
          height: "80%",
          backgroundColor: Cor.texto2 + 70,
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        <p style={{ fontSize: 12, color: Cor.texto2 }}>Tempo Parado</p>
        <p
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color:
              v?.natureza === "Fixo"
                ? Cor.textoFixo
                : v?.natureza === "Turno"
                  ? Cor.textoTurno
                  : Cor.textoExtra,
          }}
        >
          <strong>{v?.qntTempoParado || 0}h</strong>
        </p>
      </div>
    </div>
  );
}
