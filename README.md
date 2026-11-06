# ECU TUNNER FOCUS

Editor local de mapas para a **ECU Visteon 9M55AD**, estudada no Ford Focus
Duratec 2.0 de 2009.

O programa abre uma leitura da ECU, apresenta as tabelas conhecidas e permite
comparar, editar, salvar projetos e exportar uma cópia em `.bin` com verificação
de integridade. A interface funciona no navegador, **sem internet e sem instalação**.

> Este repositório contém o editor e as definições das tabelas. Não contém uma
> leitura de ECU, arquivo Stage 1 ou calibração pronta para gravar no carro.

## Como baixar e abrir

1. No GitHub, clique em **Code → Download ZIP**.
2. Extraia o ZIP em uma pasta do computador.
3. Abra **Editor9M55AD.html** no Microsoft Edge ou Google Chrome.
4. No Windows, também é possível abrir por **INICIAR.cmd**.

Para usar o editor não é necessário instalar Python, Node.js, WinOLS ou plugins.
O GitHub mostra o código do HTML; a interface aparece quando você baixa o arquivo
e o abre no navegador. Use o HTML gerado que já acompanha este repositório.

## O que é necessário

- Uma leitura própria e compatível com a estratégia **9M55AD**, com **2 MiB**
  (2.097.152 bytes). O arquivo pode estar sem extensão.
- Uma cópia original guardada separadamente para servir de referência.
- Edge ou Chrome em um computador.

O perfil é fixo: o programa confere tamanho, identificação, estruturas e hash
da região de código. Outra versão de software ou outra ECU pode ser recusada,
mesmo que também seja de um Focus ou de uma Visteon. Não é um editor universal.

## Primeiro uso: comparar original e modificada

1. Clique em **Comparar BINs**.
2. Escolha a leitura **original** e, depois, o arquivo **modificado**.
3. Confirme a comparação e selecione um mapa na lista lateral.
4. As células em **negrito** indicam diferenças em relação à original.

As duas leituras ficam separadas em memória. A original é a referência; a cópia
modificada é a origem do trabalho que pode ser editado e exportado.

As visualizações disponíveis ajudam a conferir o resultado:

| Visualização | O que mostra |
|---|---|
| Atual / Modificada | Os valores que serão editados |
| Base / Original | A referência carregada |
| Antes/depois | Os dois valores na mesma célula |
| Diferença | A diferença numérica entre modificada e original |

Se quiser começar apenas com um arquivo, use **Abrir BIN**. Nesse caso, ele passa
a ser a base da sessão; as alterações anteriores desse arquivo não aparecerão
em negrito até que ele seja comparado com a original.

## Como editar uma área da tabela

1. Pesquise o mapa pelo nome ou endereço hexadecimal e abra-o.
2. Leia a **unidade**, os **eixos** e as **evidências** mostradas na tela.
3. Selecione uma célula ou arraste o mouse para marcar um retângulo.
4. Escolha a operação, informe o valor e clique em **Aplicar à seleção**.
5. Confira a visualização **Antes/depois** ou **Diferença** antes de exportar.

| Operação | Significado aritmético |
|---|---|
| Somar / subtrair | Soma o número informado à unidade daquele mapa |
| Variação em % | `5` multiplica o valor por `1,05` |
| Multiplicar | `1,1` multiplica o valor por `1,1` |
| Definir | Substitui as células pelo número informado |

Esses são exemplos de operações, não valores de calibração recomendados.
Uma alteração de `5%` não equivale a somar `5°` de ignição. Em células negativas,
o percentual segue a aritmética normal.

Também é possível:

- Editar uma célula com **duplo clique** ou **Enter**.
- Usar ponto ou vírgula como separador decimal.
- Selecionar com **Shift + clique** ou **Shift + setas**.
- Copiar e colar blocos de valores separados por tabulação ou ponto e vírgula.
- Desfazer com **Ctrl + Z** e refazer com **Ctrl + Y**.
- Restaurar a seleção para os valores da base/referência.

Uma colagem inválida é recusada por inteiro. Os eixos são fixos nesta versão;
as operações atuam nos valores das tabelas e parâmetros apresentados.

## Salvar projeto, calcular checksum e exportar

São três ações diferentes:

| Ação | Resultado |
|---|---|
| **Salvar projeto** | Gera `.ecu9.json` para continuar a edição depois |
| **Calcular checksum** | Corrige o checksum principal e verifica principal, boot e VID |
| **Exportar BIN** | Repete a correção/verificação e baixa uma cópia `_mod.bin` |

**Salvar projeto não gera a BIN para o programador de ECU.** Para obter esse
arquivo, use **Exportar BIN**. O editor não sobrescreve a leitura original nem
se conecta ao veículo para fazer a gravação.

A exportação é recusada se as verificações de boot/VID não forem válidas. Um
checksum válido comprova a integridade verificada do arquivo; não comprova que
uma alteração de combustível, ignição ou torque seja adequada ao motor.

O **Relatório de alterações** gera um JSON com endereços, valores antes/depois,
hashes e estado dos checksums. Guarde esse relatório junto da versão exportada.

## Mapas disponíveis e limites da identificação

O catálogo tem **228 entradas**, incluindo ignição, combustível, pedal,
torque/carga, curvas e parâmetros auxiliares.

- **106 entradas** têm função documentada ou identificação parcial.
- **122 superfícies** permanecem não classificadas.
- Cada entrada apresenta as evidências e limitações disponíveis.

O editor inclui definições de referências de combustível, mistura nominal,
caracterização dos injetores, offset por bateria e pulso mínimo. As notas
distinguem funções confirmadas de interpretações ainda inferidas.

Observe estas diferenças ao ler os mapas:

- Coordenada interna de pedal não é automaticamente porcentagem de curso físico.
- Lambda nominal não é uma leitura de sonda wideband.
- Um mapa de avanço não é necessariamente o avanço final entregue ao motor.
- Unidades como `lb/s`, `psi` ou graus em determinados eixos podem ser inferidas;
  consulte a nota específica da entrada.
- As tabelas semelhantes não são sincronizadas automaticamente. Editar uma
  matriz de pedal não reconstrói suas inversas nem altera as outras matrizes.

## Privacidade: o que pode ser publicado

O editor trabalha com os arquivos selecionados **localmente, na memória do
navegador**. Esta versão não possui envio de BINs, telemetria, conta de usuário
ou armazenamento automático em um serviço externo.

**Não publique seus arquivos `.bin` ou `.ecu9.json`.** Um projeto salvo inclui
leituras completas em Base64 e pode conter tanto a original quanto a modificada.
Base64 é apenas uma codificação: não remove VIN, identificadores ou outros dados.

A versão pública foi separada da pasta de análise e não inclui leituras reais,
projetos de veículo, logs de rodagem ou capturas com arquivos pessoais carregados.
O hash individual da leitura usada no desenvolvimento também foi removido do
perfil distribuído; o hash de código usado para reconhecer a estratégia permanece.

Veja [PRIVACIDADE.md](PRIVACIDADE.md) antes de compartilhar arquivos ou contribuir.

## Desenvolvimento e testes

Para executar a suíte pública, instale Node.js 20 ou superior e rode:

```sh
npm test
```

Os testes usam somente dados sintéticos criados em memória. Não precisam de
leitura real, scanner, conexão ao carro ou dependências de terceiros.

Para gerar novamente o HTML a partir de `src/`, use Python 3:

```sh
python tools/build.py
```

Python e Node.js são necessários apenas para essas tarefas de desenvolvimento.

```text
Editor9M55AD.html   Aplicação pronta para abrir no navegador
INICIAR.cmd        Atalho de abertura no Windows
src/               Código e definições do perfil fixo
tools/build.py     Geração do HTML autocontido
tests/             Testes com dados sintéticos
PRIVACIDADE.md     Orientações sobre arquivos de veículo e contribuições
```

## Estado do projeto

Ferramenta experimental de edição e análise de arquivos. A validação de software
e checksum é diferente da validação da calibração no veículo. O programa não
promete ganho de potência, economia ou segurança mecânica de uma alteração.
