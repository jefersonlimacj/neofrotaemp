import { useEffect, useState } from "react";
import BaseTelas from "../componentes/baseTelas";
import EditPerfil from "../componentes/editPerfil";
import { useSolicitanteLogado } from "../hooks/solicitanteLogado";
import { useTema } from "../hooks/temaContext";
import { useEditarSolicitante } from "../hooks/useSolicitantes";
import { useNavigate } from "react-router-dom";
import { supabase } from "../hooks/supabaseClient";

export function Configuracoes() {
  return (
    <BaseTelas
      conteudo={
        <>
          <EditPerfil />
          <ConfiguracaoConteudo />
        </>
      }
    />
  );
}

function ConfiguracaoConteudo() {
  const solicitante = useSolicitanteLogado();

  console.log("Solicitante Logado: ", solicitante);

  if (solicitante?.funcao === "Prin") return <ConfiguracoesPrinc />;

  if (solicitante?.funcao === "Finc") return <ConfiguracoesFinc />;

  if (solicitante?.funcao === "Oper") return <ConfiguracoesOper />;
}

function ConfiguracoesPrinc() {
  const navigate = useNavigate();
  const solicitante = useSolicitanteLogado();

  console.log("Solicitante Logado: ", solicitante);

  const Cor = useTema().Cor;

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [telefone, setTelefone] = useState("");
  const [fotoFuncionario, setFotoFuncionario] = useState<File>();
  const [imgPreview, setImgPreview] = useState("");
  const [removerFotoAtual, setRemoverFotoAtual] = useState(false);

  useEffect(() => {
    if (solicitante) {
      setNome(solicitante.nome);
      setEmail(solicitante?.email);
      setSenha(solicitante.senha);
      setTelefone(solicitante.telefone);
      setImgPreview(solicitante.fotoUrlSolicitante || "");
    }
  }, [solicitante]);

  const carregarImagem = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      setImgPreview(URL.createObjectURL(file));
      setFotoFuncionario(file);
      setRemoverFotoAtual(false);
    }
  };

  function removerFoto() {
    setImgPreview("");
    setFotoFuncionario(undefined);
    setRemoverFotoAtual(true);
  }

  const { editarSolicitante, loading } = useEditarSolicitante(
    String(solicitante?.empresaClienteId.id),
  );

  async function editarSolicitanteFunc() {
    const bucket = "neofrotabkt";

    try {
      const fotoUrlAntiga = solicitante?.fotoUrlSolicitante || null;

      let fotoUrlFinal = fotoUrlAntiga;

      if (removerFotoAtual) {
        fotoUrlFinal = null;

        if (fotoUrlAntiga) {
          try {
            const url = new URL(fotoUrlAntiga);

            const caminhoStorage = decodeURIComponent(
              url.pathname.split(`/storage/v1/object/public/${bucket}/`)[1],
            );

            if (caminhoStorage) {
              const { error: removeError } = await supabase.storage
                .from(bucket)
                .remove([caminhoStorage]);

              if (removeError) {
                console.error(
                  "Erro ao remover foto antiga do Storage:",
                  removeError,
                );
              }
            }
          } catch (error) {
            console.error(
              "Erro ao identificar o caminho da foto antiga:",
              error,
            );
          }
        }
      }

      if (fotoFuncionario) {
        const extensao =
          fotoFuncionario.name.split(".").pop()?.toLowerCase() || "jpg";

        const nomeImg = `img_perfis/${nome}-${Date.now()}.${extensao}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(nomeImg, fotoFuncionario, {
            cacheControl: "3600",
            upsert: false,
            contentType: fotoFuncionario.type,
          });

        if (uploadError) {
          throw uploadError;
        }

        if (!uploadData?.path) {
          throw new Error(
            "O upload foi realizado, mas o caminho da imagem não foi retornado.",
          );
        }

        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(uploadData.path);

        if (!urlData?.publicUrl) {
          throw new Error(
            "Não foi possível obter a URL pública da nova imagem.",
          );
        }

        fotoUrlFinal = urlData.publicUrl;

        if (fotoUrlAntiga) {
          try {
            const url = new URL(fotoUrlAntiga);

            const marcador = `/storage/v1/object/public/${bucket}/`;

            const indice = url.pathname.indexOf(marcador);

            if (indice !== -1) {
              const caminhoStorage = decodeURIComponent(
                url.pathname.substring(indice + marcador.length),
              );

              if (caminhoStorage) {
                const { error: removeError } = await supabase.storage
                  .from(bucket)
                  .remove([caminhoStorage]);

                if (removeError) {
                  console.error("Erro ao remover foto antiga:", removeError);
                }
              }
            }
          } catch (error) {
            console.error("Erro ao processar remoção da foto antiga:", error);
          }
        }
      }

      await editarSolicitante(solicitante?.id, {
        nome,
        email,
        telefone,
        senha,
        fotoUrlSolicitante: fotoUrlFinal,
      });

      setFotoFuncionario(undefined);
      setRemoverFotoAtual(false);

      if (fotoUrlFinal) {
        setImgPreview(fotoUrlFinal);
      } else {
        setImgPreview("");
      }

      navigate("/");
    } catch (error) {
      console.error("Erro ao editar solicitante:", error);
    }
  }

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        padding: "25px 15px 15px 15px",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        gap: 20,
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
          Editar meu perfil
        </h3>
        <div
          style={{
            width: "70%",
            height: 1,
            backgroundColor: Cor.primaria,
          }}
        />
      </div>
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          padding: 20,
          alignItems: "flex-start",
          justifyContent: "flex-start",
        }}
      >
        <div>
          <p style={{ color: Cor.secundaria, fontSize: 20 }}>
            Informações do Solicitante
          </p>
          <p style={{ color: Cor.texto1, fontSize: 12 }}>
            Preencha abaixo todos os campos e salve para editar o seu cadastro.
          </p>
        </div>
        <div
          style={{
            width: "100%",
            borderRadius: 22,
            marginTop: 20,
            boxShadow: Cor.sombra,
            border: "1px solid" + Cor.texto2 + 25,
            backgroundColor: Cor.base2,
            display: "flex",
            flexDirection: "column",
            padding: "20px 0",
          }}
        >
          <p
            style={{
              color: Cor.secundaria,
              fontSize: 14,
              fontWeight: "500",
              padding: "0 0 20px 20px",
            }}
          >
            Meu Perfil
          </p>
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 20,
            }}
          >
            <div
              style={{
                width: "50%",
                display: "flex",
                flexDirection: "column",
                gap: 20,
                padding: "0 20px",
              }}
            >
              <TextoEntrada
                placeholder="Nome do Funcionário"
                onChange={(e: { target: { value: any } }) =>
                  setNome(e.target.value)
                }
                value={nome}
                type="text"
                largura="100%"
              />
              {
                <TextoEntrada
                  placeholder="senha"
                  onChange={(e: { target: { value: any } }) =>
                    setSenha(e.target.value)
                  }
                  value={senha}
                  type="password"
                  largura="100%"
                />
              }
            </div>
            <div
              style={{
                width: 150,
                height: 200,
                backgroundColor: Cor.base2,
                borderRadius: 22,
                border: "1px solid",
                borderColor: Cor.texto2,
                boxShadow: Cor.sombra,
                backgroundImage: `url(${imgPreview})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div
              style={{
                width: "calc(50% - 150px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "center",
                gap: 5,
              }}
            >
              <p style={{ color: Cor.texto1, fontSize: 12 }}>
                Adicione a foto do funcionário.
              </p>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 20 }}
              >
                <input
                  type="file"
                  title=""
                  accept="image/*"
                  style={{
                    backgroundColor: Cor.primaria,
                    color: Cor.base,
                    borderRadius: 22,
                    padding: 10,
                  }}
                  onChange={carregarImagem}
                />
                <p
                  style={{
                    width: "50%",
                    padding: 5,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: Cor.texto2,
                    borderRadius: 12,
                    color: Cor.base,
                    cursor: "pointer",
                  }}
                  onClick={() => removerFoto()}
                >
                  Remover Foto
                </p>
              </div>
            </div>
          </div>
          <div
            style={{
              width: "100%",
              height: 1,
              backgroundColor: Cor.texto2,
              margin: "20px 0",
            }}
          />
          <button
            style={{
              backgroundColor: Cor.primaria,
              border: "none",
              width: "30%",
              alignSelf: "flex-end",
              padding: "10px 60px",
              borderRadius: 22,
              margin: "0 20px",
              color: Cor.base2,
              fontWeight: "bold",
              cursor: "pointer",
            }}
            onClick={() => {
              editarSolicitanteFunc();
            }}
          >
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </div>
        <div
          style={{
            width: "100%",
            borderRadius: 22,
            marginTop: 20,
            boxShadow: Cor.sombra,
            border: "1px solid" + Cor.texto2 + 25,
            backgroundColor: Cor.base2,
            display: "flex",
            flexDirection: "column",
            padding: "20px 0",
          }}
        ></div>
      </div>
    </div>
  );
}

function ConfiguracoesFinc() {
  const navigate = useNavigate();
  const solicitante = useSolicitanteLogado();

  console.log("Solicitante Logado: ", solicitante);

  const Cor = useTema().Cor;

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [telefone, setTelefone] = useState("");
  const [fotoFuncionario, setFotoFuncionario] = useState<File>();
  const [imgPreview, setImgPreview] = useState("");
  const [removerFotoAtual, setRemoverFotoAtual] = useState(false);

  useEffect(() => {
    if (solicitante) {
      setNome(solicitante.nome);
      setEmail(solicitante?.email);
      setSenha(solicitante.senha);
      setTelefone(solicitante.telefone);
      setImgPreview(solicitante.fotoUrlSolicitante || "");
    }
  }, [solicitante]);

  const carregarImagem = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      setImgPreview(URL.createObjectURL(file));
      setFotoFuncionario(file);
      setRemoverFotoAtual(false);
    }
  };

  function removerFoto() {
    setImgPreview("");
    setFotoFuncionario(undefined);
    setRemoverFotoAtual(true);
  }

  const { editarSolicitante, loading } = useEditarSolicitante(
    String(solicitante?.empresaClienteId.id),
  );

  async function editarSolicitanteFunc() {
    const bucket = "neofrotabkt";

    try {
      const fotoUrlAntiga = solicitante?.fotoUrlSolicitante || null;

      let fotoUrlFinal = fotoUrlAntiga;

      if (removerFotoAtual) {
        fotoUrlFinal = null;

        if (fotoUrlAntiga) {
          try {
            const url = new URL(fotoUrlAntiga);

            const caminhoStorage = decodeURIComponent(
              url.pathname.split(`/storage/v1/object/public/${bucket}/`)[1],
            );

            if (caminhoStorage) {
              const { error: removeError } = await supabase.storage
                .from(bucket)
                .remove([caminhoStorage]);

              if (removeError) {
                console.error(
                  "Erro ao remover foto antiga do Storage:",
                  removeError,
                );
              }
            }
          } catch (error) {
            console.error(
              "Erro ao identificar o caminho da foto antiga:",
              error,
            );
          }
        }
      }

      if (fotoFuncionario) {
        const extensao =
          fotoFuncionario.name.split(".").pop()?.toLowerCase() || "jpg";

        const nomeImg = `img_perfis/${nome}-${Date.now()}.${extensao}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(nomeImg, fotoFuncionario, {
            cacheControl: "3600",
            upsert: false,
            contentType: fotoFuncionario.type,
          });

        if (uploadError) {
          throw uploadError;
        }

        if (!uploadData?.path) {
          throw new Error(
            "O upload foi realizado, mas o caminho da imagem não foi retornado.",
          );
        }

        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(uploadData.path);

        if (!urlData?.publicUrl) {
          throw new Error(
            "Não foi possível obter a URL pública da nova imagem.",
          );
        }

        fotoUrlFinal = urlData.publicUrl;

        if (fotoUrlAntiga) {
          try {
            const url = new URL(fotoUrlAntiga);

            const marcador = `/storage/v1/object/public/${bucket}/`;

            const indice = url.pathname.indexOf(marcador);

            if (indice !== -1) {
              const caminhoStorage = decodeURIComponent(
                url.pathname.substring(indice + marcador.length),
              );

              if (caminhoStorage) {
                const { error: removeError } = await supabase.storage
                  .from(bucket)
                  .remove([caminhoStorage]);

                if (removeError) {
                  console.error("Erro ao remover foto antiga:", removeError);
                }
              }
            }
          } catch (error) {
            console.error("Erro ao processar remoção da foto antiga:", error);
          }
        }
      }

      await editarSolicitante(solicitante?.id, {
        nome,
        email,
        telefone,
        senha,
        fotoUrlSolicitante: fotoUrlFinal,
      });

      setFotoFuncionario(undefined);
      setRemoverFotoAtual(false);

      if (fotoUrlFinal) {
        setImgPreview(fotoUrlFinal);
      } else {
        setImgPreview("");
      }

      navigate("/");
    } catch (error) {
      console.error("Erro ao editar solicitante:", error);
    }
  }

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        padding: "25px 15px 15px 15px",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        gap: 20,
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
          Editar meu perfil
        </h3>
        <div
          style={{
            width: "70%",
            height: 1,
            backgroundColor: Cor.primaria,
          }}
        />
      </div>
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          padding: 20,
          alignItems: "flex-start",
          justifyContent: "flex-start",
        }}
      >
        <div>
          <p style={{ color: Cor.secundaria, fontSize: 20 }}>
            Informações do Solicitante
          </p>
          <p style={{ color: Cor.texto1, fontSize: 12 }}>
            Preencha abaixo todos os campos e salve para editar o seu cadastro.
          </p>
        </div>
        <div
          style={{
            width: "100%",
            borderRadius: 22,
            marginTop: 20,
            boxShadow: Cor.sombra,
            border: "1px solid" + Cor.texto2 + 25,
            backgroundColor: Cor.base2,
            display: "flex",
            flexDirection: "column",
            padding: "20px 0",
          }}
        >
          <p
            style={{
              color: Cor.secundaria,
              fontSize: 14,
              fontWeight: "500",
              padding: "0 0 20px 20px",
            }}
          >
            Meu Perfil
          </p>
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 20,
            }}
          >
            <div
              style={{
                width: "50%",
                display: "flex",
                flexDirection: "column",
                gap: 20,
                padding: "0 20px",
              }}
            >
              <TextoEntrada
                placeholder="Nome do Funcionário"
                onChange={(e: { target: { value: any } }) =>
                  setNome(e.target.value)
                }
                value={nome}
                type="text"
                largura="100%"
              />
              <TextoEntrada
                placeholder="senha"
                onChange={(e: { target: { value: any } }) =>
                  setSenha(e.target.value)
                }
                value={senha}
                type="password"
                largura="100%"
              />
            </div>
            <div
              style={{
                width: 150,
                height: 200,
                backgroundColor: Cor.base2,
                borderRadius: 22,
                border: "1px solid",
                borderColor: Cor.texto2,
                boxShadow: Cor.sombra,
                backgroundImage: `url(${imgPreview})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div
              style={{
                width: "calc(50% - 150px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "center",
                gap: 5,
              }}
            >
              <p style={{ color: Cor.texto1, fontSize: 12 }}>
                Adicione a foto do funcionário.
              </p>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 20 }}
              >
                <input
                  type="file"
                  title=""
                  accept="image/*"
                  style={{
                    backgroundColor: Cor.primaria,
                    color: Cor.base,
                    borderRadius: 22,
                    padding: 10,
                  }}
                  onChange={carregarImagem}
                />
                <p
                  style={{
                    width: "50%",
                    padding: 5,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: Cor.texto2,
                    borderRadius: 12,
                    color: Cor.base,
                    cursor: "pointer",
                  }}
                  onClick={() => removerFoto()}
                >
                  Remover Foto
                </p>
              </div>
            </div>
          </div>
          <div
            style={{
              width: "100%",
              height: 1,
              backgroundColor: Cor.texto2,
              margin: "20px 0",
            }}
          />
          <button
            style={{
              backgroundColor: Cor.primaria,
              border: "none",
              width: "30%",
              alignSelf: "flex-end",
              padding: "10px 60px",
              borderRadius: 22,
              margin: "0 20px",
              color: Cor.base2,
              fontWeight: "bold",
              cursor: "pointer",
            }}
            onClick={() => {
              editarSolicitanteFunc();
            }}
          >
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfiguracoesOper() {
  const navigate = useNavigate();
  const solicitante = useSolicitanteLogado();

  console.log("Solicitante Logado: ", solicitante);

  const Cor = useTema().Cor;

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [telefone, setTelefone] = useState("");
  const [fotoFuncionario, setFotoFuncionario] = useState<File>();
  const [imgPreview, setImgPreview] = useState("");
  const [removerFotoAtual, setRemoverFotoAtual] = useState(false);

  useEffect(() => {
    if (solicitante) {
      setNome(solicitante.nome);
      setEmail(solicitante?.email);
      setSenha(solicitante.senha);
      setTelefone(solicitante.telefone);
      setImgPreview(solicitante.fotoUrlSolicitante || "");
    }
  }, [solicitante]);

  const carregarImagem = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      setImgPreview(URL.createObjectURL(file));
      setFotoFuncionario(file);
      setRemoverFotoAtual(false);
    }
  };

  function removerFoto() {
    setImgPreview("");
    setFotoFuncionario(undefined);
    setRemoverFotoAtual(true);
  }

  const { editarSolicitante, loading } = useEditarSolicitante(
    String(solicitante?.empresaClienteId.id),
  );

  async function editarSolicitanteFunc() {
    const bucket = "neofrotabkt";

    try {
      const fotoUrlAntiga = solicitante?.fotoUrlSolicitante || null;

      let fotoUrlFinal = fotoUrlAntiga;

      if (removerFotoAtual) {
        fotoUrlFinal = null;

        if (fotoUrlAntiga) {
          try {
            const url = new URL(fotoUrlAntiga);

            const caminhoStorage = decodeURIComponent(
              url.pathname.split(`/storage/v1/object/public/${bucket}/`)[1],
            );

            if (caminhoStorage) {
              const { error: removeError } = await supabase.storage
                .from(bucket)
                .remove([caminhoStorage]);

              if (removeError) {
                console.error(
                  "Erro ao remover foto antiga do Storage:",
                  removeError,
                );
              }
            }
          } catch (error) {
            console.error(
              "Erro ao identificar o caminho da foto antiga:",
              error,
            );
          }
        }
      }

      if (fotoFuncionario) {
        const extensao =
          fotoFuncionario.name.split(".").pop()?.toLowerCase() || "jpg";

        const nomeImg = `img_perfis/${nome}-${Date.now()}.${extensao}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(nomeImg, fotoFuncionario, {
            cacheControl: "3600",
            upsert: false,
            contentType: fotoFuncionario.type,
          });

        if (uploadError) {
          throw uploadError;
        }

        if (!uploadData?.path) {
          throw new Error(
            "O upload foi realizado, mas o caminho da imagem não foi retornado.",
          );
        }

        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(uploadData.path);

        if (!urlData?.publicUrl) {
          throw new Error(
            "Não foi possível obter a URL pública da nova imagem.",
          );
        }

        fotoUrlFinal = urlData.publicUrl;

        if (fotoUrlAntiga) {
          try {
            const url = new URL(fotoUrlAntiga);

            const marcador = `/storage/v1/object/public/${bucket}/`;

            const indice = url.pathname.indexOf(marcador);

            if (indice !== -1) {
              const caminhoStorage = decodeURIComponent(
                url.pathname.substring(indice + marcador.length),
              );

              if (caminhoStorage) {
                const { error: removeError } = await supabase.storage
                  .from(bucket)
                  .remove([caminhoStorage]);

                if (removeError) {
                  console.error("Erro ao remover foto antiga:", removeError);
                }
              }
            }
          } catch (error) {
            console.error("Erro ao processar remoção da foto antiga:", error);
          }
        }
      }

      await editarSolicitante(solicitante?.id, {
        nome,
        email,
        telefone,
        senha,
        fotoUrlSolicitante: fotoUrlFinal,
      });

      setFotoFuncionario(undefined);
      setRemoverFotoAtual(false);

      if (fotoUrlFinal) {
        setImgPreview(fotoUrlFinal);
      } else {
        setImgPreview("");
      }

      navigate("/");
    } catch (error) {
      console.error("Erro ao editar solicitante:", error);
    }
  }

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        padding: "25px 15px 15px 15px",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        gap: 20,
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
          Editar meu perfil
        </h3>
        <div
          style={{
            width: "70%",
            height: 1,
            backgroundColor: Cor.primaria,
          }}
        />
      </div>
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          padding: 20,
          alignItems: "flex-start",
          justifyContent: "flex-start",
        }}
      >
        <div>
          <p style={{ color: Cor.secundaria, fontSize: 20 }}>
            Informações do Solicitante
          </p>
          <p style={{ color: Cor.texto1, fontSize: 12 }}>
            Preencha abaixo todos os campos e salve para editar o seu cadastro.
          </p>
        </div>
        <div
          style={{
            width: "100%",
            borderRadius: 22,
            marginTop: 20,
            boxShadow: Cor.sombra,
            border: "1px solid" + Cor.texto2 + 25,
            backgroundColor: Cor.base2,
            display: "flex",
            flexDirection: "column",
            padding: "20px 0",
          }}
        >
          <p
            style={{
              color: Cor.secundaria,
              fontSize: 14,
              fontWeight: "500",
              padding: "0 0 20px 20px",
            }}
          >
            Meu Perfil
          </p>
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 20,
            }}
          >
            <div
              style={{
                width: "50%",
                display: "flex",
                flexDirection: "column",
                gap: 20,
                padding: "0 20px",
              }}
            >
              <TextoEntrada
                placeholder="Nome do Funcionário"
                onChange={(e: { target: { value: any } }) =>
                  setNome(e.target.value)
                }
                value={nome}
                type="text"
                largura="100%"
              />
              <TextoEntrada
                placeholder="senha"
                onChange={(e: { target: { value: any } }) =>
                  setSenha(e.target.value)
                }
                value={senha}
                type="password"
                largura="100%"
              />
            </div>
            <div
              style={{
                width: 150,
                height: 200,
                backgroundColor: Cor.base2,
                borderRadius: 22,
                border: "1px solid",
                borderColor: Cor.texto2,
                boxShadow: Cor.sombra,
                backgroundImage: `url(${imgPreview})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div
              style={{
                width: "calc(50% - 150px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "center",
                gap: 5,
              }}
            >
              <p style={{ color: Cor.texto1, fontSize: 12 }}>
                Adicione a foto do funcionário.
              </p>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 20 }}
              >
                <input
                  type="file"
                  title=""
                  accept="image/*"
                  style={{
                    backgroundColor: Cor.primaria,
                    color: Cor.base,
                    borderRadius: 22,
                    padding: 10,
                  }}
                  onChange={carregarImagem}
                />
                <p
                  style={{
                    width: "50%",
                    padding: 5,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: Cor.texto2,
                    borderRadius: 12,
                    color: Cor.base,
                    cursor: "pointer",
                  }}
                  onClick={() => removerFoto()}
                >
                  Remover Foto
                </p>
              </div>
            </div>
          </div>
          <div
            style={{
              width: "100%",
              height: 1,
              backgroundColor: Cor.texto2,
              margin: "20px 0",
            }}
          />
          <button
            style={{
              backgroundColor: Cor.primaria,
              border: "none",
              width: "30%",
              alignSelf: "flex-end",
              padding: "10px 60px",
              borderRadius: 22,
              margin: "0 20px",
              color: Cor.base2,
              fontWeight: "bold",
              cursor: "pointer",
            }}
            onClick={() => {
              editarSolicitanteFunc();
            }}
          >
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

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
