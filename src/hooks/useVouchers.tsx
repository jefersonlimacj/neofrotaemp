import { gql, useMutation, useQuery } from "@apollo/client";

const CREATE_VOUCHER = gql`
  mutation CriarVoucher($input: VoucherCreateInput!) {
    criarVoucher(input: $input) {
      id
    }
  }
`;

interface CreateVoucherInput {
  origem: string;
  destino: string;
  dataHoraProgramado: string;
  dataHoraConclusao: string;
  dataHoraCriacao: string;

  qntTempoParado: string;
  assinatura: string;
  observacaoMotorista: string;
  observacao: string;

  valorViagem: number;
  valorViagemRepasse: number;
  valorDeslocamento: number;
  valorDeslocamentoRepasse: number;
  valorHoraParada: number;
  valorHoraParadaRepasse: number;
  valorPedagio: number;
  valorEstacionamento: number;

  natureza: string;
  tipoCorrida: string;
  status: string;

  empresaClienteId: string;
  unidadeClienteId: string;
  motoristaId: string;
  carroId: string;
  adminUsuarioId: string;
  solicitanteId: string;
  operadoraId: string;

  modeloFixoId: string;
  modeloTurnoId: string;
  rotaId: string;

  passageiros: string[];
}

export function useCreateVoucher() {
  const [createVoucher, { data, loading, error }] = useMutation(CREATE_VOUCHER);

  const lancar = (input: CreateVoucherInput) => {
    return createVoucher({
      variables: { input },
    });
  };

  return {
    lancar,
    data,
    loading,
    error,
  };
}

const GET_VOUCHERS = gql`
  query Vouchers(
    $operadiraId: ID
    $filter: VoucherFilterInput
    $offset: Int
    $limit: Int
  ) {
    vouchers(
      operadiraId: $operadiraId
      filter: $filter
      offset: $offset
      limit: $limit
    ) {
      id
      origem
      destino
      dataHoraProgramado
      dataHoraConclusao
      dataHoraCriacao
      qntTempoParado
      assinatura
      observacaoMotorista
      observacao
      valorViagem
      valorViagemRepasse
      valorDeslocamento
      valorDeslocamentoRepasse
      valorHoraParada
      valorHoraParadaRepasse
      valorPedagio
      valorEstacionamento
      natureza
      tipoCorrida
      status
      empresaCliente {
        id
        nome
        fotoLogoCliente
        rSocial
        statusCliente
      }
      unidadeCliente {
        id
        nome
        endBairro
        endCep
        endCidade
        endComplemento
        endNumero
        endRua
        endUf
        statusUnidadeCliente
        cnpj
      }
      motorista {
        id
        nome
        fotoMotorista
        vCnh
        statusMotorista
        statusCnh
      }
      carro {
        id
        marca
        modelo
        cor
        placa
        ano
      }
      adminUsuario {
        id
        nome
        funcao
        fotoAdminOperadora
      }
      solicitante {
        id
        nome
        funcao
        fotoUrlSolicitante
      }

      operadora {
        id
      }
      passageiros {
        id
        statusPresenca
        horarioEmbarqueReal
        rateio
        passageiroId {
          ativo
          email
          endBairro
          endCidade
          endNumero
          endRua
          fotoPerfilPassageiro
          horarioEmbarque
          matricula
          id
        }
      }
    }
  }
`;

interface UseVouchersParams {
  operadiraId?: string; // Troque para 'number' se o seu ID for numérico
  offset?: number;
  limit?: number;
  motoristaId?: string;
  natureza?: string;
  status?: string;
}

export function useVouchers({
  operadiraId,
  offset,
  limit,
  motoristaId,
  natureza,
  status,
}: UseVouchersParams) {
  const { data, loading, error, refetch } = useQuery(GET_VOUCHERS, {
    variables: {
      operadiraId,
      offset,
      filter: {
        motoristaId,
        natureza,
        status,
      },
      limit,
    },
    fetchPolicy: "cache-and-network",
  });

  return {
    listaVouchers: data ? data.vouchers : [],
    loading,
    error,
    refetch: refetch || Promise.resolve(),
  };
}

const GET_VOUCHERS_IDS = gql`
  query VouchersIds($ids: [ID!]!, $operadoraId: ID!) {
    vouchersIds(ids: $ids, operadoraId: $operadoraId) {
      id
      origem
      destino
      dataHoraProgramado
      dataHoraConclusao
      dataHoraCriacao
      qntTempoParado
      assinatura
      observacaoMotorista
      observacao
      valorViagem
      valorViagemRepasse
      valorDeslocamento
      valorDeslocamentoRepasse
      valorHoraParada
      valorHoraParadaRepasse
      valorPedagio
      valorEstacionamento
      natureza
      tipoCorrida
      status
      empresaCliente {
        id
        nome
        fotoLogoCliente
        rSocial
        statusCliente
      }
      unidadeCliente {
        id
        nome
        endBairro
        endCep
        endCidade
        endComplemento
        endNumero
        endRua
        endUf
        statusUnidadeCliente
        cnpj
      }
      motorista {
        id
        nome
        fotoMotorista
        vCnh
        statusMotorista
        statusCnh
      }
      carro {
        id
        marca
        modelo
        cor
        placa
        ano
      }
      adminUsuario {
        id
        nome
        funcao
        fotoAdminOperadora
      }
      solicitante {
        id
        nome
        funcao
        fotoUrlSolicitante
      }
      operadora {
        id
      }
      passageiros {
        id
        statusPresenca
        horarioEmbarqueReal
        rateio
        passageiroId {
          ativo
          email
          endBairro
          endCidade
          endNumero
          endRua
          fotoPerfilPassageiro
          horarioEmbarque
          matricula
          id
        }
      }
    }
  }
`;

export function useVouchersIds(ids: any, operadoraId: any) {
  const { data, loading, error } = useQuery(GET_VOUCHERS_IDS, {
    variables: { ids, operadoraId },
    fetchPolicy: "cache-and-network",
  });

  return {
    listaVouchersIds: data ? data.vouchersIds : [],
    error,
    loading,
  };
}


const GET_VOUCHERS_DATA = gql`
  query VoucherOperadoraData($operadoraId: ID!, $diaSelecionado: String!) {
    voucherOperadoraData(
      operadoraId: $operadoraId
      diaSelecionado: $diaSelecionado
    ) {
      id
      origem
      destino
      dataHoraProgramado
      dataHoraConclusao
      dataHoraCriacao
      qntTempoParado
      assinatura
      observacaoMotorista
      observacao
      valorViagem
      valorViagemRepasse
      valorDeslocamento
      valorDeslocamentoRepasse
      valorHoraParada
      valorHoraParadaRepasse
      valorPedagio
      valorEstacionamento
      natureza
      tipoCorrida
      status
      empresaCliente {
        id
        nome
        fotoLogoCliente
        rSocial
        statusCliente
      }
      unidadeCliente {
        endBairro
        endCep
        endCidade
        endComplemento
        endNumero
        endRua
        endUf
        id
        statusUnidadeCliente
        cnpj
        nome
      }
      motorista {
        id
        cnh
        cpf
        nome
        fotoMotorista
        email
        statusCnh
        statusMotorista
        tipoMotorista
        vCnh
      }

      carro {
        id
        placa
        marca
        modelo
        cor
        crlv
        vCrlv
        chassi
        ano
      }
      adminUsuario {
        id
        nome
      }
      solicitante {
        funcao
        fotoUrlSolicitante
        nome
        telefone
      }
      passageiros {
        horarioEmbarqueReal
        id
        rateio
        statusPresenca
        passageiroId {
          ativo
          email
          endBairro
          endCidade
          endNumero
          endRua
          fotoPerfilPassageiro
          horarioEmbarque
          id
          matricula
          nome
          pontoApanha
          telefone
          centroCustoClienteId {
            id
            nome
            codigo
          }
        }
      }
    }
  }
`;

export function useVouchersData(operadoraId: any, diaSelecionado: string) {
  const { data, loading, error, refetch } = useQuery<any>(GET_VOUCHERS_DATA, {
    variables: {
      operadoraId,
      diaSelecionado,
    },
    fetchPolicy: "cache-and-network",
  });

  return {
    listaVoucherData: data ? data.voucherOperadoraData : [],
    loading,
    error,
    refetch: refetch || Promise.resolve(),
  };
}

const GET_VOUCHERS_FILTROS = gql`
  query VouchersFiltrados($filtro: FiltroVouchersInput!) {
    vouchersFiltrados(filtro: $filtro) {
      id
      origem
      destino
      dataHoraProgramado
      dataHoraConclusao
      valorViagem
      valorViagemRepasse
      valorDeslocamento
      valorDeslocamentoRepasse
      valorHoraParada
      valorHoraParadaRepasse
      valorPedagio
      valorEstacionamento
      qntTempoParado
      natureza
      tipoCorrida
      status
      observacaoMotorista
      observacao
      empresaCliente {
        id
        nome
        fotoLogoCliente
      }
      unidadeCliente {
        id
        nome
      }
      motorista {
        id
        nome
      }
      adminUsuario {
        id
        nome
      }
      solicitante {
        id
        nome
      }
      modeloFixo {
        ativo
        nomeModelo
        configuracoes {
          id
        }
      }
      modeloTurno {
        ativo
        nomeModelo
      }
      rota {
        id
        tributacao
        origem
        destino
      }
      observacaoMotorista
    }
  }
`;

export const GET_VOUCHERS_EXPORTACAO = gql`
  query VouchersExportacao($filtro: FiltroVouchersInput!) {
    vouchersFiltrados(filtro: $filtro) {
      id
      origem
      destino
      dataHoraProgramado
      dataHoraCriacao
      dataHoraConclusao
      valorViagem
      valorViagemRepasse
      valorDeslocamento
      valorDeslocamentoRepasse
      valorHoraParada
      valorHoraParadaRepasse
      valorPedagio
      valorEstacionamento
      qntTempoParado
      natureza
      tipoCorrida
      status
      observacao
      observacaoMotorista
      carro {
        id
        placa
        marca
        modelo
        cor
        ano
      }
      modeloFixo {
        id
        nomeModelo
        ativo
      }
      adminUsuario {
        id
        nome
      }
      empresaCliente {
        id
        nome
        statusCliente
      }
      motorista {
        id
        nome
        tipoMotorista
        statusCnh
      }
      unidadeCliente {
        id
        nome
        endRua
        endNumero
        endBairro
        endCep
        endCidade
        endComplemento
        endUf
      }
      passageiros {
        id
        horarioEmbarqueReal
        passageiroId {
          id
          nome
          matricula
          endBairro
          endCidade
          centroCustoClienteId {
            codigo
            id
            nome
          }
        }
        rateio
        statusPresenca
      }
      rota {
        id
        origem
        destino
        tributacao
      }
      solicitante {
        id
        nome
        funcao
      }
    }
  }
`;

export function useVouchersFiltrados(filtro: any) {
  const { data, loading, error, refetch } = useQuery(GET_VOUCHERS_FILTROS, {
    variables: {
      filtro: filtro,
    },
    fetchPolicy: "network-only",
    skip: !filtro?.operadoraId,
  });

  return {
    listaRelatorio: data ? data.vouchersFiltrados : [],
    loading,
    error,
    refetch,
  };
}

const GET_VOUCHERS_RANKING = gql`
  query VouchersFiltrados($filtro: FiltroVouchersInput!) {
    vouchersFiltrados(filtro: $filtro) {
      id
      motorista {
        id
        nome
        fotoMotorista
      }
    }
  }
`;

export function useVouchersRanking(filtro: any) {
  const { data, loading, error, refetch } = useQuery(GET_VOUCHERS_RANKING, {
    variables: {
      filtro: filtro,
    },
    fetchPolicy: "network-only",
    skip: !filtro?.operadoraId,
  });

  return {
    listaRanking: data ? data.vouchersFiltrados : [],
    loading,
    error,
    refetch,
  };
}

const GET_VOUCHERS_PREV = gql`
  query VoucherOperadoraData($operadoraId: ID!, $diaSelecionado: String!) {
    voucherOperadoraData(
      operadoraId: $operadoraId
      diaSelecionado: $diaSelecionado
    ) {
      id
      natureza
      tipoCorrida
      origem
      destino
      dataHoraProgramado
      status
      empresaCliente {
        id
        nome
      }
      motorista {
        id
        nome
      }
    }
  }
`;

export function useVoucherPrev(operadoraId: any, diaSelecionado: string) {
  const { data, loading, error, refetch } = useQuery<any>(GET_VOUCHERS_PREV, {
    variables: {
      operadoraId,
      diaSelecionado,
    },
    fetchPolicy: "cache-and-network",
  });

  return {
    listaVoucherPrevData: data ? data.voucherOperadoraData : [],
    loading,
    error,
    refetch: refetch || Promise.resolve(),
  };
}

const GET_VOUCHER_FIXO_ID = gql`
  query Voucher($voucherId: ID!) {
    voucher(id: $voucherId) {
      carro {
        id
        placa
        marca
        modelo
        cor
        crlv
        vCrlv
        chassi
        ano
      }
      modeloFixo {
        id
        nomeModelo
        ativo
        valorViagem
        valorViagemRepasse
        valorHoraParada
        valorHoraParadaRepasse
        valorDeslocamento
        valorDeslocamentoRepasse
        valorPedagio
      }
      modeloTurno {
        id
        nomeModelo
        ativo
      }
      adminUsuario {
        id
        nome
      }
      assinatura
      dataHoraConclusao
      dataHoraCriacao
      dataHoraProgramado
      destino
      empresaCliente {
        id
        nome
        rSocial
        statusCliente
        fotoLogoCliente
        cnpj
      }
      id
      motorista {
        id
        nome
        email
        senha
        fotoMotorista
        cpf
        cnh
        vCnh
        statusMotorista
        tipoMotorista
        dataCriacao
        statusCnh
      }
      natureza
      observacao
      observacaoMotorista
      origem
      qntTempoParado
      status
      tipoCorrida
      unidadeCliente {
        id
        nome
        cnpj
        endRua
        endNumero
        endBairro
        endCep
        endCidade
        endComplemento
        endUf
        statusUnidadeCliente
        matriz
      }
      valorDeslocamento
      valorDeslocamentoRepasse
      valorEstacionamento
      valorHoraParada
      valorHoraParadaRepasse
      valorPedagio
      valorViagem
      valorViagemRepasse
      passageiros {
        id
        horarioEmbarqueReal
        passageiroId {
          id
          nome
          matricula
          telefone
          email
          ativo
          fotoPerfilPassageiro
          endRua
          endNumero
          endBairro
          endCidade
          pontoApanha
          horarioEmbarque
          centroCustoClienteId {
            codigo
            id
            nome
          }
        }
        rateio
        statusPresenca
      }
    }
  }
`;

export function useVoucherFixoId(voucherId: string) {
  const { data, loading, error, refetch } = useQuery(GET_VOUCHER_FIXO_ID, {
    variables: {
      voucherId,
    },
    skip: !voucherId,
  });

  return {
    voucherFixoId: data?.voucher || null,
    loading,
    error,
    refetch: refetch || Promise.resolve(),
  };
}

const GET_VOUCHER_EXTRA_ID = gql`
  query Voucher($voucherId: ID!) {
    voucher(id: $voucherId) {
      carro {
        id
        placa
        marca
        modelo
        cor
        crlv
        vCrlv
        chassi
        ano
      }
      adminUsuario {
        id
        nome
      }
      assinatura
      dataHoraConclusao
      dataHoraCriacao
      dataHoraProgramado
      destino
      empresaCliente {
        id
        nome
        rSocial
        statusCliente
        fotoLogoCliente
        cnpj
      }
      id
      motorista {
        id
        nome
        email
        senha
        fotoMotorista
        cpf
        cnh
        vCnh
        statusMotorista
        tipoMotorista
        dataCriacao
        statusCnh
      }
      natureza
      observacao
      observacaoMotorista
      origem
      qntTempoParado
      status
      tipoCorrida
      unidadeCliente {
        id
        nome
        cnpj
        endRua
        endNumero
        endBairro
        endCep
        endCidade
        endComplemento
        endUf
        statusUnidadeCliente
        matriz
      }
      valorDeslocamento
      valorDeslocamentoRepasse
      valorEstacionamento
      valorHoraParada
      valorHoraParadaRepasse
      valorPedagio
      valorViagem
      valorViagemRepasse
      solicitante {
        id
        nome
        email
        senha
        funcao
        telefone
        statusSolicitante
        fotoUrlSolicitante
      }
      passageiros {
        id
        horarioEmbarqueReal
        passageiroId {
          id
          nome
          matricula
          telefone
          email
          ativo
          fotoPerfilPassageiro
          endRua
          endNumero
          endBairro
          endCidade
          pontoApanha
          horarioEmbarque
          centroCustoClienteId {
            codigo
            id
            nome
          }
        }
        rateio
        statusPresenca
      }
      rota {
        id
        origem
        destino
        tributacao
        rotaValor {
          id
          categoria
          valorViagem
          valorViagemRepasse
          valorHoraParada
          valorHoraParadaRepasse
          valorDeslocamento
          valorDeslocamentoRepasse
          valorPedagio {
            id
            nome
            valor
          }
        }
      }
    }
  }
`;

export function useVoucherExtraId(voucherId: string) {
  const { data, loading, error, refetch } = useQuery(GET_VOUCHER_EXTRA_ID, {
    variables: {
      voucherId,
    },
    skip: !voucherId,
  });

  return {
    voucherExtraId: data?.voucher || null,
    loading,
    error,
    refetch: refetch || Promise.resolve(),
  };
}

const UPDATE_VOUCHER = gql`
  mutation EditarVoucher($input: VoucherUpdateInput!) {
    editarVoucher(input: $input) {
      id
    }
  }
`;

export function useEditarVoucher() {
  const [editarVoucher, { data, loading, error }] = useMutation(UPDATE_VOUCHER);

  const editar = (input: any) => {
    return editarVoucher({ variables: { input } });
  };

  return {
    editar,
    data,
    loading,
    error,
  };
}

const UPDATE_VOUCHERS_EM_MASSA = gql`
  mutation EditarVouchersEmMassa($input: EditarVouchersEmMassaInput!) {
    editarVouchersEmMassa(input: $input) {
      count
    }
  }
`;

export function useEditarVouchersEmMassa() {
  const [editarVouchersEmMassa, { data, loading, error }] = useMutation(
    UPDATE_VOUCHERS_EM_MASSA,
  );

  const editar = (input: any) => {
    return editarVouchersEmMassa({
      variables: { input },
    });
  };

  return {
    editar,
    data,
    loading,
    error,
  };
}

const CREATE_VOUCHER_MASSA = gql`
  mutation GerarVouchersEmMassa($inputs: [VoucherCreateInput!]!) {
    gerarVouchersEmMassa(inputs: $inputs) {
      id
    }
  }
`;

export function useGerarVouchersEmMassa() {
  const [gerarVouchersEmMassa, { data, loading, error }] =
    useMutation(CREATE_VOUCHER_MASSA);

  const gerar = (inputs: any) => {
    return gerarVouchersEmMassa({
      variables: { inputs },
    });
  };

  return {
    gerar,
    data,
    loading,
    error,
  };
}
