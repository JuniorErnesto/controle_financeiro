document.addEventListener("DOMContentLoaded", function () {
    // Checar se o usuário está logado (simples verificação, idealmente usar tokens/sessões mais robustas)
    const userData = JSON.parse(localStorage.getItem("userData"));
    if (!userData && window.location.pathname.endsWith("dashboard.html")) {
        window.location.href = "index.html"; // Redireciona para login se não estiver logado
        return;
    }

    // Elementos da UI - Login (já existente em outro contexto, mas para referência)
    const loginForm = document.getElementById("loginForm");
    const loginMessage = document.getElementById("loginMessage");

    // Elementos da UI - Dashboard
    const usernameDisplay = document.getElementById("usernameDisplay");
    const logoutButton = document.getElementById("logoutButton");
    const navLinksContainer = document.getElementById("nav-links");

    const dashboardLink = document.getElementById("dashboard-link");
    const historyLink = document.getElementById("history-link");
    const reportsLink = document.getElementById("reports-link");
    // O link de Gerenciar Usuários será criado dinamicamente

    const dashboardSection = document.getElementById("dashboard-section");
    const historySection = document.getElementById("history-section");
    const reportsSection = document.getElementById("reports-section");
    const userManagementSection = document.getElementById("user-management-section");

    // Resumo Financeiro
    const totalReceitasEl = document.getElementById("totalReceitas");
    const totalDespesasEl = document.getElementById("totalDespesas");
    const saldoAtualEl = document.getElementById("saldoAtual");

    // Adicionar Transação
    const addTransactionForm = document.getElementById("addTransactionForm");
    const transactionMessage = document.getElementById("transactionMessage");

    // Transações Recentes
    const recentTransactionsTableBody = document.getElementById("recentTransactionsTableBody");

    // Histórico
    const filterPeriodSelect = document.getElementById("filterPeriod");
    const customDateFiltersDiv = document.getElementById("customDateFilters");
    const startDateInput = document.getElementById("startDate");
    const endDateInput = document.getElementById("endDate");
    const applyFilterButton = document.getElementById("applyFilterButton");
    const historyTransactionsTableBody = document.getElementById("historyTransactionsTableBody");
    let expensePieChartInstance = null;
    let financialLineChartInstance = null;

    // Relatórios
    const reportPeriodSelect = document.getElementById("reportPeriod");
    const customReportDateFiltersDiv = document.getElementById("customReportDateFilters");
    const reportStartDateInput = document.getElementById("reportStartDate");
    const reportEndDateInput = document.getElementById("reportEndDate");
    const generatePdfButton = document.getElementById("generatePdfButton");
    const generateExcelButton = document.getElementById("generateExcelButton"); // Botão Excel

    // Gerenciamento de Usuários (Admin)
    const showAddUserModalButton = document.getElementById("showAddUserModalButton");
    const usersTableBody = document.getElementById("usersTableBody");
    const userModal = document.getElementById("userModal");
    const userModalTitle = document.getElementById("userModalTitle");
    const userForm = document.getElementById("userForm");
    const userIdInput = document.getElementById("userId");
    const modalUsernameInput = document.getElementById("modalUsername");
    const modalEmailInput = document.getElementById("modalEmail");
    const modalPasswordInput = document.getElementById("modalPassword");
    const modalRoleSelect = document.getElementById("modalRole");
    const saveUserButton = document.getElementById("saveUserButton");
    const userFormMessage = document.getElementById("userFormMessage");
    const closeUserModalButton = document.getElementById("closeUserModalButton");

    // Modal Editar Transação
    const editTransactionModal = document.getElementById("editTransactionModal");
    const closeEditTransactionModalButton = document.getElementById("closeEditTransactionModalButton");
    const editTransactionFormModal = document.getElementById("editTransactionFormModal");
    const editTransactionIdInput = document.getElementById("editTransactionId");
    const editDescriptionInput = document.getElementById("editDescription");
    const editAmountInput = document.getElementById("editAmount");
    const editTypeSelect = document.getElementById("editType");
    const editCategoryInput = document.getElementById("editCategory");
    const editDateInput = document.getElementById("editDate");
    const editTransactionMessageModal = document.getElementById("editTransactionMessageModal");

    // --- Funções Auxiliares ---
    function showMessage(element, message, isError = false) {
        element.textContent = message;
        element.className = "message"; // Limpa classes anteriores
        if (isError) {
            element.classList.add("error");
        } else {
            element.classList.add("success");
        }
        
        // Adiciona botão de fechar à mensagem
        if (message && !isError) {
            const closeBtn = document.createElement("span");
            closeBtn.innerHTML = "&times;";
            closeBtn.className = "message-close-btn";
            closeBtn.onclick = function() {
                element.textContent = "";
                element.className = "message";
            };
            element.appendChild(closeBtn);
            
            // Configura o timeout para a mensagem desaparecer após 10 segundos
            setTimeout(() => {
                if (element.textContent) {
                    element.textContent = "";
                    element.className = "message";
                }
            }, 10000);
        }
    }

    function formatDate(dateString) {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString("pt-BR");
    }
    
    function formatDateForInput(dateString) {
        if (!dateString) return "";
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    // --- Lógica do Login (já implementada, mas para contexto) ---
    if (loginForm) {
        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;
            showMessage(loginMessage, "");

            try {
                const response = await fetch("/api/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password }),
                });
                const result = await response.json();
                if (response.ok) {
                    showMessage(loginMessage, "Login bem-sucedido! Redirecionando...");
                    localStorage.setItem("userData", JSON.stringify(result.user));
                    setTimeout(() => { window.location.href = "dashboard.html"; }, 1500);
                } else {
                    showMessage(loginMessage, result.message || "Erro ao fazer login.", true);
                }
            } catch (error) {
                showMessage(loginMessage, "Erro de conexão. Tente novamente.", true);
            }
        });
    }

    // --- Lógica do Dashboard ---
    if (window.location.pathname.endsWith("dashboard.html")) {
        if (usernameDisplay) usernameDisplay.textContent = `Olá, ${userData.username}`;

        // Navegação
        const sections = [dashboardSection, historySection, reportsSection, userManagementSection];
        const navLinks = [dashboardLink, historyLink, reportsLink]; // User management link é dinâmico

        function showSection(sectionToShow) {
            sections.forEach(section => {
                if (section) section.classList.add("hidden");
            });
            if (sectionToShow) sectionToShow.classList.remove("hidden");
            
            navLinks.forEach(link => link.classList.remove("active"));
            if (sectionToShow === dashboardSection && dashboardLink) dashboardLink.classList.add("active");
            if (sectionToShow === historySection && historyLink) historyLink.classList.add("active");
            if (sectionToShow === reportsSection && reportsLink) reportsLink.classList.add("active");
            if (sectionToShow === userManagementSection && document.getElementById("user-mgm-link")) {
                 document.getElementById("user-mgm-link").classList.add("active");
            }
        }

        if (dashboardLink) dashboardLink.addEventListener("click", (e) => { e.preventDefault(); showSection(dashboardSection); loadDashboardData(); });
        if (historyLink) historyLink.addEventListener("click", (e) => { e.preventDefault(); showSection(historySection); loadHistoryTransactions(); });
        if (reportsLink) reportsLink.addEventListener("click", (e) => { e.preventDefault(); showSection(reportsSection); });

        // Logout
        if (logoutButton) {
            logoutButton.addEventListener("click", async () => {
                try {
                    await fetch("/api/logout", { method: "POST" });
                    localStorage.removeItem("userData");
                    window.location.href = "index.html";
                } catch (error) {
                    console.error("Erro ao fazer logout:", error);
                    alert("Erro ao fazer logout.");
                }
            });
        }

        // Adicionar link de Gerenciar Usuários se for admin
        if (userData.role === "admin" && navLinksContainer && userManagementSection) {
            const userMgmLink = document.createElement("li");
            userMgmLink.innerHTML = `<a href="#" id="user-mgm-link">Gerenciar Usuários</a>`;
            navLinksContainer.appendChild(userMgmLink);
            navLinks.push(userMgmLink.firstElementChild); // Adiciona ao array para controle de active
            userMgmLink.firstElementChild.addEventListener("click", (e) => { 
                e.preventDefault(); 
                showSection(userManagementSection); 
                loadUsers(); 
            });
        } else if (userManagementSection) {
            userManagementSection.remove(); // Remove a seção se não for admin
        }

        // Carregar Resumo Financeiro
        async function loadFinancialSummary(queryParams = "") {
            try {
                const response = await fetch(`/api/transactions/summary${queryParams}`);
                if (!response.ok) throw new Error("Falha ao carregar resumo");
                const summary = await response.json();
                totalReceitasEl.textContent = `R$ ${summary.total_receitas.toFixed(2)}`;
                totalDespesasEl.textContent = `R$ ${summary.total_despesas.toFixed(2)}`;
                saldoAtualEl.textContent = `R$ ${summary.saldo.toFixed(2)}`;
                saldoAtualEl.parentElement.classList.toggle("negativo", summary.saldo < 0);
            } catch (error) {
                console.error("Erro ao carregar resumo financeiro:", error);
            }
        }

        // Carregar Transações Recentes (para o painel)
        async function loadRecentTransactions() {
            try {
                const response = await fetch("/api/transactions?limit=5"); // Exemplo: pegar as últimas 5
                if (!response.ok) throw new Error("Falha ao carregar transações");
                const transactions = await response.json();
                recentTransactionsTableBody.innerHTML = "";
                transactions.slice(0, 5).forEach(t => addTransactionToTable(t, recentTransactionsTableBody, true));
            } catch (error) {
                console.error("Erro ao carregar transações recentes:", error);
            }
        }
        
        function addTransactionToTable(transaction, tableBody, includeActions = false) {
            const row = tableBody.insertRow();
            row.insertCell().textContent = formatDate(transaction.date);
            row.insertCell().textContent = transaction.description;
            row.insertCell().textContent = transaction.category || "-";
            row.insertCell().textContent = transaction.type === "receita" ? "Receita" : "Despesa";
            const amountCell = row.insertCell();
            amountCell.textContent = `R$ ${transaction.amount.toFixed(2)}`;
            amountCell.style.color = transaction.type === "receita" ? "#2ecc71" : "#e74c3c";

            if (includeActions) {
                const actionsCell = row.insertCell();
                const editButton = document.createElement("button");
                editButton.textContent = "Editar";
                editButton.className = "edit-btn";
                editButton.onclick = () => openEditTransactionModal(transaction);
                actionsCell.appendChild(editButton);

                const deleteButton = document.createElement("button");
                deleteButton.textContent = "Excluir";
                deleteButton.className = "delete-btn";
                deleteButton.onclick = () => deleteTransaction(transaction.id);
                actionsCell.appendChild(deleteButton);
            }
        }

        // Adicionar Nova Transação
        if (addTransactionForm) {
            addTransactionForm.addEventListener("submit", async function(event) {
                event.preventDefault();
                const description = document.getElementById("description").value;
                const amount = parseFloat(document.getElementById("amount").value);
                const type = document.getElementById("type").value;
                const category = document.getElementById("category").value;
                const date = document.getElementById("date").value; // Formato YYYY-MM-DD

                showMessage(transactionMessage, "");
                try {
                    const response = await fetch("/api/transactions", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ description, amount, type, category, date: date ? new Date(date).toISOString() : new Date().toISOString() }),
                    });
                    const result = await response.json();
                    if (response.ok) {
                        showMessage(transactionMessage, "Transação adicionada com sucesso!");
                        addTransactionForm.reset();
                        loadDashboardData(); // Recarrega dados do painel
                    } else {
                        showMessage(transactionMessage, result.message || "Erro ao adicionar transação.", true);
                    }
                } catch (error) {
                    showMessage(transactionMessage, "Erro de conexão.", true);
                }
            });
        }
        
        // Modal Editar Transação
        function openEditTransactionModal(transaction) {
            editTransactionIdInput.value = transaction.id;
            editDescriptionInput.value = transaction.description;
            editAmountInput.value = transaction.amount;
            editTypeSelect.value = transaction.type;
            editCategoryInput.value = transaction.category || "";
            editDateInput.value = formatDateForInput(transaction.date);
            showMessage(editTransactionMessageModal, "");
            editTransactionModal.classList.remove("hidden");
        }

        if (closeEditTransactionModalButton) {
            closeEditTransactionModalButton.onclick = () => editTransactionModal.classList.add("hidden");
        }

        if (editTransactionFormModal) {
            editTransactionFormModal.addEventListener("submit", async function(event) {
                event.preventDefault();
                const id = editTransactionIdInput.value;
                const description = editDescriptionInput.value;
                const amount = parseFloat(editAmountInput.value);
                const type = editTypeSelect.value;
                const category = editCategoryInput.value;
                const date = editDateInput.value;

                showMessage(editTransactionMessageModal, "");
                try {
                    const response = await fetch(`/api/transactions/${id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ description, amount, type, category, date: date ? new Date(date).toISOString() : new Date().toISOString() }),
                    });
                    const result = await response.json();
                    if (response.ok) {
                        showMessage(editTransactionMessageModal, "Transação atualizada com sucesso!", false);
                        editTransactionModal.classList.add("hidden");
                        loadDashboardData(); // Recarrega dados do painel e histórico se visível
                        if (!historySection.classList.contains("hidden")) {
                            loadHistoryTransactions();
                        }
                    } else {
                        showMessage(editTransactionMessageModal, result.message || "Erro ao atualizar transação.", true);
                    }
                } catch (error) {
                    showMessage(editTransactionMessageModal, "Erro de conexão.", true);
                }
            });
        }

        async function deleteTransaction(id) {
            if (!confirm("Tem certeza que deseja excluir esta transação?")) return;
            try {
                const response = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
                if (response.ok) {
                    alert("Transação excluída com sucesso!");
                    loadDashboardData();
                    if (!historySection.classList.contains("hidden")) {
                        loadHistoryTransactions();
                    }
                } else {
                    const result = await response.json();
                    alert(result.message || "Erro ao excluir transação.");
                }
            } catch (error) {
                alert("Erro de conexão ao excluir transação.");
            }
        }

        // Lógica do Histórico
        if (filterPeriodSelect) {
            filterPeriodSelect.addEventListener("change", function() {
                customDateFiltersDiv.classList.toggle("hidden", this.value !== "custom");
            });
        }
        if (applyFilterButton) {
            applyFilterButton.addEventListener("click", loadHistoryTransactions);
        }

        async function loadHistoryTransactions() {
            let queryParams = "?period=" + filterPeriodSelect.value;
            if (filterPeriodSelect.value === "custom") {
                const startDate = startDateInput.value;
                const endDate = endDateInput.value;
                if (startDate && endDate) {
                    queryParams = `?start_date=${new Date(startDate).toISOString()}&end_date=${new Date(endDate).toISOString()}`;
                } else {
                    alert("Por favor, selecione as datas inicial e final para o período personalizado.");
                    return;
                }
            }

            try {
                const response = await fetch(`/api/transactions${queryParams}`);
                if (!response.ok) throw new Error("Falha ao carregar histórico");
                const transactions = await response.json();
                historyTransactionsTableBody.innerHTML = "";
                transactions.forEach(t => addTransactionToTable(t, historyTransactionsTableBody, false)); // Sem ações no histórico
                
                // Atualizar resumo financeiro com base no filtro do histórico
                loadFinancialSummary(queryParams);
                // Atualizar gráficos
                updateCharts(transactions);

            } catch (error) {
                console.error("Erro ao carregar histórico de transações:", error);
                historyTransactionsTableBody.innerHTML = `<tr><td colspan="5">Erro ao carregar dados.</td></tr>`;
            }
        }
        
        function updateCharts(transactions) {
            // Limpar os canvas existentes para evitar crescimento infinito
            const expensePieChartCanvas = document.getElementById("expensePieChart");
            const financialLineChartCanvas = document.getElementById("financialLineChart");
            
            // Destruir instâncias anteriores de gráficos se existirem
            if (expensePieChartInstance) {
                expensePieChartInstance.destroy();
            }
            
            if (financialLineChartInstance) {
                financialLineChartInstance.destroy();
            }
            
            // Gráfico de Torta (Despesas por Categoria)
            const expenseCategories = {};
            transactions.filter(t => t.type === "despesa").forEach(t => {
                const category = t.category || "Outras";
                expenseCategories[category] = (expenseCategories[category] || 0) + t.amount;
            });

            const pieCtx = expensePieChartCanvas.getContext("2d");
            expensePieChartInstance = new Chart(pieCtx, {
                type: "pie",
                data: {
                    labels: Object.keys(expenseCategories),
                    datasets: [{
                        data: Object.values(expenseCategories),
                        backgroundColor: [
                            "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40",
                            "#FFCD56", "#C9CBCF", "#32CD32", "#FFD700"
                        ]
                    }]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        }
                    }
                }
            });

            // Gráfico de Linha (Evolução Financeira)
            const dailyData = {};
            transactions.sort((a,b) => new Date(a.date) - new Date(b.date)).forEach(t => {
                const dateStr = formatDateForInput(t.date); // YYYY-MM-DD
                if (!dailyData[dateStr]) {
                    dailyData[dateStr] = { receita: 0, despesa: 0 };
                }
                if (t.type === "receita") dailyData[dateStr].receita += t.amount;
                else dailyData[dateStr].despesa += t.amount;
            });

            const labels = Object.keys(dailyData).sort(); // Datas ordenadas
            const receitasData = labels.map(date => dailyData[date].receita);
            const despesasData = labels.map(date => dailyData[date].despesa);
            let saldoAcumulado = 0;
            const saldoData = labels.map(date => {
                saldoAcumulado += (dailyData[date].receita - dailyData[date].despesa);
                return saldoAcumulado;
            });

            const lineCtx = financialLineChartCanvas.getContext("2d");
            financialLineChartInstance = new Chart(lineCtx, {
                type: "line",
                data: {
                    labels: labels.map(l => formatDate(l)), // Formatar para DD/MM/YYYY
                    datasets: [
                        { label: "Receitas", data: receitasData, borderColor: "#2ecc71", fill: false },
                        { label: "Despesas", data: despesasData, borderColor: "#e74c3c", fill: false },
                        { label: "Saldo Acumulado", data: saldoData, borderColor: "#3498db", fill: false, type: "line" }
                    ]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: true,
                    scales: { 
                        y: { 
                            beginAtZero: false 
                        } 
                    } 
                }
            });
        }

        // Lógica de Relatórios
        if (reportPeriodSelect) {
            reportPeriodSelect.addEventListener("change", function() {
                customReportDateFiltersDiv.classList.toggle("hidden", this.value !== "custom");
            });
        }

        async function generateReport(format) {
            let queryParams = "period=" + reportPeriodSelect.value;
            if (reportPeriodSelect.value === "custom") {
                const startDate = reportStartDateInput.value;
                const endDate = reportEndDateInput.value;
                if (startDate && endDate) {
                    queryParams = `start_date=${new Date(startDate).toISOString()}&end_date=${new Date(endDate).toISOString()}`;
                } else {
                    alert("Por favor, selecione as datas inicial e final para o relatório personalizado.");
                    return;
                }
            }
            
            const url = format === "pdf" ? `/api/report/pdf?${queryParams}` : `/api/report/excel?${queryParams}`;
            const filename = format === "pdf" ? "relatorio_financeiro.pdf" : "relatorio_financeiro.xlsx";

            try {
                const response = await fetch(url);
                if (response.ok) {
                    const blob = await response.blob();
                    const downloadUrl = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = downloadUrl;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(downloadUrl);
                } else {
                    const errorData = await response.json();
                    alert(`Erro ao gerar relatório ${format.toUpperCase()}: ${errorData.message || "Erro desconhecido"}`);
                }
            } catch (error) {
                console.error(`Erro ao gerar relatório ${format.toUpperCase()}:`, error);
                alert(`Erro de conexão ao gerar relatório ${format.toUpperCase()}.`);
            }
        }

        if (generatePdfButton) {
            generatePdfButton.addEventListener("click", () => generateReport("pdf"));
        }
        if (generateExcelButton) { // Adicionado listener para o botão Excel
            generateExcelButton.addEventListener("click", () => generateReport("excel"));
        }

        // Lógica de Gerenciamento de Usuários (Admin)
        if (userData.role === "admin") {
            if (showAddUserModalButton) {
                showAddUserModalButton.onclick = () => {
                    userModalTitle.textContent = "Adicionar Usuário";
                    userForm.reset();
                    userIdInput.value = "";
                    modalPasswordInput.placeholder = "Senha";
                    showMessage(userFormMessage, "");
                    userModal.classList.remove("hidden");
                };
            }
            if (closeUserModalButton) {
                closeUserModalButton.onclick = () => userModal.classList.add("hidden");
            }

            async function loadUsers() {
                try {
                    const response = await fetch("/api/users");
                    if (!response.ok) throw new Error("Falha ao carregar usuários");
                    const users = await response.json();
                    usersTableBody.innerHTML = "";
                    users.forEach(user => {
                        const row = usersTableBody.insertRow();
                        row.insertCell().textContent = user.id;
                        row.insertCell().textContent = user.username;
                        row.insertCell().textContent = user.email;
                        row.insertCell().textContent = user.role;
                        const actionsCell = row.insertCell();
                        
                        const editButton = document.createElement("button");
                        editButton.textContent = "Editar";
                        editButton.className = "edit-btn";
                        editButton.onclick = () => openEditUserModal(user);
                        actionsCell.appendChild(editButton);

                        if (user.id !== userData.id) { // Não permitir excluir a si mesmo
                            const deleteButton = document.createElement("button");
                            deleteButton.textContent = "Excluir";
                            deleteButton.className = "delete-btn";
                            deleteButton.onclick = () => deleteUser(user.id);
                            actionsCell.appendChild(deleteButton);
                        }
                    });
                } catch (error) {
                    console.error("Erro ao carregar usuários:", error);
                    usersTableBody.innerHTML = `<tr><td colspan="5">Erro ao carregar usuários.</td></tr>`;
                }
            }

            function openEditUserModal(user) {
                userModalTitle.textContent = "Editar Usuário";
                userIdInput.value = user.id;
                modalUsernameInput.value = user.username;
                modalEmailInput.value = user.email;
                modalPasswordInput.value = ""; // Limpar senha, preencher apenas se for alterar
                modalPasswordInput.placeholder = "Deixe em branco para não alterar";
                modalRoleSelect.value = user.role;
                showMessage(userFormMessage, "");
                userModal.classList.remove("hidden");
            }

            if (userForm) {
                userForm.addEventListener("submit", async function(event) {
                    event.preventDefault();
                    const id = userIdInput.value;
                    const username = modalUsernameInput.value;
                    const email = modalEmailInput.value;
                    const password = modalPasswordInput.value;
                    const role = modalRoleSelect.value;
                    
                    const url = id ? `/api/users/${id}` : "/api/users";
                    const method = id ? "PUT" : "POST";
                    const body = { username, email, role };
                    if (password) body.password = password; // Incluir senha apenas se fornecida

                    showMessage(userFormMessage, "");
                    try {
                        const response = await fetch(url, {
                            method: method,
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(body),
                        });
                        const result = await response.json();
                        if (response.ok) {
                            showMessage(userFormMessage, `Usuário ${id ? "atualizado" : "adicionado"} com sucesso!`, false);
                            userModal.classList.add("hidden");
                            loadUsers();
                        } else {
                            showMessage(userFormMessage, result.message || "Erro ao salvar usuário.", true);
                        }
                    } catch (error) {
                        showMessage(userFormMessage, "Erro de conexão.", true);
                    }
                });
            }

            async function deleteUser(id) {
                if (!confirm("Tem certeza que deseja excluir este usuário?")) return;
                try {
                    const response = await fetch(`/api/users/${id}`, { method: "DELETE" });
                    if (response.ok) {
                        alert("Usuário excluído com sucesso!");
                        loadUsers();
                    } else {
                        const result = await response.json();
                        alert(result.message || "Erro ao excluir usuário.");
                    }
                } catch (error) {
                    alert("Erro de conexão ao excluir usuário.");
                }
            }
        }

        // Carregamento inicial de dados do painel
        function loadDashboardData() {
            loadFinancialSummary();
            loadRecentTransactions();
        }
        loadDashboardData(); // Carrega ao iniciar o dashboard
    }
});
