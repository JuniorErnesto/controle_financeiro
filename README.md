# Controle Financeiro

![Status do Projeto](https://img.shields.io/badge/status-em%20desenvolvimento-yellow) ![Licença](https://img.shields.io/badge/license-MIT-green) 

## Descrição do Projeto

O **Controle Financeiro** é uma aplicação web desenvolvida para auxiliar empresas a gerenciar suas finanças de forma eficiente. Ele permite o controle detalhado de entradas e gastos, fornecendo ferramentas para acompanhamento e análise dos dados financeiros da organização.

## Funcionalidades

* Registro e gestão de Entradas Financeiras.
* Registro e gestão de Gastos Financeiros.
* Visualização gráfica dos dados financeiros para análise rápida.
* Geração de relatórios em formato PDF com os dados financeiros.
* Geração de relatórios em formato Excel (.xlsx) com os dados financeiros.

## Tecnologias Utilizadas

* **Backend:** Python com o framework Flask.
* **Frontend:** HTML, CSS e JavaScript puro para a interface do usuário.
* **Banco de Dados:** MySQL, gerenciado via phpMyAdmin.

## Pré-requisitos

Para rodar este projeto localmente, você precisará ter instalado:

* Python (versão X.X ou superior)
* MySQL Database (ou acesso a um servidor MySQL)
* pip (gerenciador de pacotes Python)

## Instalação

1.  Clone o repositório:
    ```bash
    git clone (https://github.com/JuniorErnesto/controleFinanceiro)
    cd controle-financeiro
    ```
2.  Crie um ambiente virtual (recomendado):
    ```bash
    python -m venv venv
    ```
3.  Ative o ambiente virtual:
    * No Windows:
        ```bash
        .\venv\Scripts\activate
        ```
    * No macOS e Linux:
        ```bash
        source venv/bin/activate
        ```
4.  Instale as dependências do projeto:
    ```bash
    pip install -r requirements.txt 
    ```
5.  Configure o banco de dados MySQL:
    * Crie um banco de dados chamado `controle_financeiro` (ou o nome que preferir).
    * Importe o schema do banco de dados (se você tiver um arquivo .sql para a estrutura das tabelas).
    * Configure as credenciais do banco de dados no arquivo de configuração da aplicação (ex: `config.py` ou variáveis de ambiente). *Detalhe este passo.*

6.  Execute as migrações do banco de dados (se aplicável). *Detalhe este passo.*

## Como Rodar

1.  Certifique-se de que o ambiente virtual está ativado.
2.  Execute o aplicativo Flask:
    ```bash
    python main.py
    ```
3.  A aplicação estará disponível em `http://127.0.0.1:8000/` (ou a porta configurada).

## Estrutura do Projeto

*Ajuste esta estrutura para refletir a organização real do seu projeto.*

## Como Contribuir

1. Faça um Fork do projeto.
2. Crie uma nova branch para sua feature (`git checkout -b feature/MinhaNovaFeature`).
3. Faça commit das suas mudanças (`git commit -m 'Adiciona nova feature'`).
4. Faça Push para a branch (`git push origin feature/MinhaNovaFeature`).
5. Abra um Pull Request.

## Licença

Este projeto está licenciado sob a Licença MIT. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes. ---

Feito por Rocket Technology
