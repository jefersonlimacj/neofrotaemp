import { useState } from "react";
import { useTema } from "../hooks/temaContext";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

function NavMenu({ sidebar }: { sidebar: boolean }) {
  const location = useLocation();
  const { Cor } = useTema();

  const listaTelasMaster = [
    {
      tela: "Dashboard",
      icone: "dashboard",
      path: "/",
      submenu: false,
      itensSubMenu: [],
    },
    {
      tela: "Funcionários",
      icone: "person",
      path: "/funcionarios",
      submenu: false,
      itensSubMenu: [],
    },
    // {
    //   tela: "Financeiro",
    //   icone: "money_bag",
    //   path: "/financeiro",
    //   submenu: false,
    //   itensSubMenu: [],
    // },
    {
      tela: "Relatórios",
      icone: "list",
      path: "/relatorios",
      submenu: false,
      itensSubMenu: [],
    },
    // {
    //   tela: "Configurações",
    //   icone: "settings",
    //   path: "/configuracoes",
    //   submenu: false,
    //   itensSubMenu: [],
    // },
    {
      tela: "Configurações",
      icone: "settings",
      path: "/configuracoes",
      submenu: false,
      itensSubMenu: [],
    },
  ];

  const [submenuAberto, setSubmenuAberto] = useState<string | null>(null);

  return (
    <>
      <div style={{ width: "100%", height: "80vh" }}>
        <ul
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 5,
            marginTop: 10,
          }}
        >
          {listaTelasMaster.map(
            ({ tela, icone, path, submenu, itensSubMenu }) => (
              <BtnMenu
                key={path}
                sidebar={sidebar}
                Cor={Cor}
                tela={tela}
                icone={icone}
                ativo={location.pathname === path}
                path={path}
                submenu={submenu}
                itensSubMenu={itensSubMenu}
                aberto={submenuAberto === tela}
                abrirSubmenu={() => setSubmenuAberto(tela)}
                fecharSubmenu={() => setSubmenuAberto(null)}
              />
            ),
          )}
        </ul>
      </div>
    </>
  );
}

interface BtnMenuProps {
  $sidebar: boolean;
  $CorPrimaria: string;
  $CorTexto2: string;
  $ativo: boolean;
  $CorBase: string;
  $CorSecundaria: string;
}

const BtnMenuStyled = styled.li<BtnMenuProps>`
  display: flex;
  width: 100%;
  flex-direction: row;
  gap: ${({ $sidebar }) => ($sidebar ? "15px" : "5px")};
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease-in;

  .indicador-on {
    width: ${({ $sidebar }) => ($sidebar ? "10px" : "8px")};
    height: 45px;
    border-radius: 0px 10px 10px 0px;
    background-color: ${({ $CorPrimaria }) => $CorPrimaria};
    transition: all 0.2s ease-in;
  }

  .indicador-off {
    width: 5px;
    height: 45px;
    border-radius: 0px 10px 10px 0px;
    background-color: ${({ $CorTexto2 }) => $CorTexto2 + 80};
  }

  .seletor-menu {
    align-items: center;
    width: 100%;
    height: 45px;
    transition: all 0.2s ease-in;
  }

  .btn-seletor-menu {
    display: flex;
    flex-direction: row;
    gap: 10px;
    align-items: center;
    justify-content: ${({ $sidebar }) => ($sidebar ? "flex-start" : "center")};
    padding-left: ${({ $sidebar }) => ($sidebar ? "10px" : "0px")};
    width: 90%;
    height: 100%;
    border-radius: 14px;
    background-color: ${({ $ativo, $CorPrimaria }) =>
      $ativo ? $CorPrimaria + 25 : "transparent"};
    transition: all 0.2s ease-in;
  }

  .btn-seletor-menu:hover {
    background-color: ${({ $ativo, $CorPrimaria, $CorTexto2 }) =>
      $ativo ? $CorPrimaria + 25 : $CorTexto2 + 25};
  }

  .nome-tela {
    font-size: 16;
    font-weight: ${({ $ativo }) => ($ativo ? "bold" : "normal")};
    color: ${({ $ativo, $CorPrimaria, $CorTexto2 }) =>
      $ativo ? $CorPrimaria : $CorTexto2};
    opacity: ${({ $sidebar }) => ($sidebar ? 1 : 0)};
    position: ${({ $sidebar }) => ($sidebar ? "relative" : "absolute")};
    transform: ${({ $sidebar }) => ($sidebar ? "scale(1)" : "scale(0)")};
    transition: all 0.2s ease-in;
  }
`;

const SubMenuLateral = styled.div<BtnMenuProps>`
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 200px;
  height: 100vh;
  background-color: ${({ $CorBase }) => $CorBase + "BB"};
  position: absolute;
  top: 0;
  left: ${({ $sidebar }) => ($sidebar ? "200px" : "60px")};
  z-index: 1;
  border-right: 1px solid ${({ $CorSecundaria }) => $CorSecundaria + 50};
  backdrop-filter: blur(5px);

  transform: translateX(-50px);
  opacity: 0;
  animation: slideIn 0.3s forwards;

  @keyframes slideIn {
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .submenu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    border-radius: 8px;
    margin: 4px 8px;
    cursor: pointer;
    transition: background 0.2s;
    color: ${({ $CorTexto2 }) => $CorTexto2};
    font-size: 16px;
    font-weight: normal;
  }

  .submenu-item:hover {
    background: ${({ $CorPrimaria }) => $CorPrimaria + 25};
    color: ${({ $CorPrimaria }) => $CorPrimaria};
    font-weight: bold;
  }
`;

function BtnMenu({
  ativo,
  sidebar,
  tela,
  Cor,
  icone,
  path,
  submenu,
  itensSubMenu,
  aberto,
  abrirSubmenu,
  fecharSubmenu,
}: {
  sidebar: boolean;
  ativo: boolean;
  tela: string;
  icone: string;
  Cor: any;
  path: string;
  submenu?: boolean;
  itensSubMenu?: { tela: string; icone: string; path: string }[];
  aberto?: boolean;
  abrirSubmenu?: () => void;
  fecharSubmenu?: () => void;
}) {
  const navigate = useNavigate();

  return (
    <>
      <BtnMenuStyled
        $sidebar={sidebar}
        $CorPrimaria={Cor.primaria}
        $CorTexto2={Cor.texto2}
        $ativo={ativo}
        $CorBase={Cor.base}
        $CorSecundaria={Cor.secundaria}
        onClick={() => navigate(`${path}`)}
        //  onClick={() => !submenu && navigate(`${path}`)}
        onMouseEnter={() => submenu && abrirSubmenu?.()}
      >
        {ativo ? (
          <div className="indicador-on" />
        ) : (
          <div className="indicador-off" />
        )}
        <div className="seletor-menu">
          <div className="btn-seletor-menu">
            <p
              style={{
                fontFamily: "Icone",
                fontSize: 20,
                fontWeight: ativo ? "bold" : "normal",
                color: ativo ? Cor.primaria : Cor.texto2,
              }}
            >
              {icone}
            </p>
            <p className="nome-tela">{tela}</p>
            {submenu && sidebar && (
              <p
                style={{
                  fontFamily: "Icone",
                  fontSize: 20,
                  color: Cor.secundaria,
                }}
              >
                arrow_right
              </p>
            )}
          </div>
        </div>
      </BtnMenuStyled>
      {submenu && aberto && (
        <SubMenuLateral
          $sidebar={sidebar}
          $CorPrimaria={Cor.primaria}
          $CorTexto2={Cor.texto2}
          $ativo={ativo}
          $CorBase={Cor.base}
          $CorSecundaria={Cor.secundaria}
          onMouseLeave={() => fecharSubmenu?.()}
        >
          <div
            style={{
              width: "100%",
              height: 60,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: Cor.base2,
              gap: 5,
              borderBottom: `2px solid ${Cor.secundaria}`,
            }}
          >
            <p
              style={{
                fontFamily: "Icone",
                fontSize: 20,
                color: Cor.texto2,
                fontWeight: "bold",
              }}
            >
              {icone}
            </p>
            <p
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: Cor.secundaria,
              }}
            >
              {tela}
            </p>
          </div>
          {itensSubMenu?.map((item) => (
            <div
              key={item.tela}
              className="submenu-item"
              onClick={() => navigate(item.path)}
            >
              <span>{item.tela}</span>
            </div>
          ))}
        </SubMenuLateral>
      )}
    </>
  );
}

export default NavMenu;
