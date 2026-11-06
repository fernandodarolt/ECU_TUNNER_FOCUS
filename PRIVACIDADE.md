# Privacidade e arquivos de veículo

## O que acompanha a versão pública

Código do editor, definições de tabelas da estratégia 9M55AD, instruções de uso
e testes inteiramente sintéticos. Não é necessário incluir uma leitura real
para baixar, inspecionar ou executar os testes do projeto.

O código de estratégia, os endereços dos mapas e o hash da região de código
servem para reconhecer uma versão de software. Não representam o VIN de um carro.

## O que deve ficar fora do GitHub

- Leituras de ECU, com ou sem extensão (`.bin`, `.hex`, `.phf`, `ecu`, etc.).
- Calibrações originais ou modificadas e arquivos exportados para gravação.
- Projetos `.ecu9.json`, porque incluem as leituras completas em Base64.
- Projetos de outros editores, backups e arquivos de identificação de scanners.
- Logs de rodagem ou diagnóstico que não tenham sido revisados e anonimizados.
- Capturas de tela que mostrem VIN, placa, dados pessoais ou nomes de arquivos
  que você não queira divulgar.

Um arquivo de teste derivado de uma leitura real continua contendo quase todos
os bytes dessa leitura, mesmo que poucas células tenham sido alteradas. Trocar
o nome para "teste" não o torna anônimo. Base64 também não anonimiza um arquivo.

O `.gitignore` reduz acidentes, mas não substitui a revisão de `git diff --cached`.
Ele não remove arquivos já versionados nem apaga versões antigas do histórico.
Arquivos de leitura sem extensão também exigem atenção.

## Como o editor trata os arquivos abertos

Os seletores de arquivo do navegador leem apenas o que você escolher. Original,
modificada e alterações ficam na memória da página durante o uso. Os botões de
salvar/exportar criam downloads locais; abrir uma BIN não a incorpora no HTML
do editor que está salvo no disco.

Esta versão não implementa upload, telemetria ou persistência automática em
`localStorage`/IndexedDB. Publicar o HTML limpo é diferente de publicar um projeto
salvo com dados do veículo.

## Para relatar um problema

Informe o navegador, a versão do editor, o nome/endereço do mapa, o procedimento
feito e a mensagem de erro. Use um exemplo sintético sempre que possível.
Antes de anexar qualquer relatório ou imagem, revise nomes, caminhos e dados.
Não anexe uma leitura real em uma issue pública.
