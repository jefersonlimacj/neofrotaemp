import { createContext, useContext } from "react";

interface solicitanteLogadoType {
  funcao: string;
  id: string;
  nome: string;
  email: string;
  senha: string;
  telefone: string;
  statusSolicitante: string;
  empresaClienteId: {
    nome: string;
    id: string;
    fotoLogoCliente: string;
    rSocial: string;
    cnpj: string;
  };
  fotoUrlSolicitante: string;
  operadoraId: {
    logoOperadora: string;
    nome: string;
    cnpj: string;
    rSocial: string;
    id: string;
  };
}

const SolicitanteLogadoContext = createContext<solicitanteLogadoType | null>(
  null,
);

export function useSolicitanteLogado() {
  return useContext(SolicitanteLogadoContext);
}

export default SolicitanteLogadoContext.Provider;
