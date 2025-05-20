// Script para o sistema de gestão de ordens

document.addEventListener("DOMContentLoaded", function() {
    // Elementos globais
    const orderDashboardSection = document.getElementById("order-dashboard-section");
    const customersSection = document.getElementById("customers-section");
    const reportsSection = document.getElementById("reports-section");
    
    // Modais
    const customerModal = document.getElementById("customerModal");
    const orderModal = document.getElementById("orderModal");
    const orderDetailsModal = document.getElementById("orderDetailsModal");
    const expenseModal = document.getElementById("expenseModal");
    
    // Navegação
    const customersLink = document.getElementById("customers-link");
    const reportsLink = document.getElementById("reports-link");
    
    // Botões
    const newOrderButton = document.getElementById("newOrderButton");
    const newCustomerButton = document.getElementById("newCustomerButton");
    const newCustomerFromOrderButton = document.getElementById("newCustomerFromOrderButton");
    
    // Fechar modais
    const closeCustomerModalButton = document.getElementById("closeCustomerModalButton");
    const closeOrderModalButton = document.getElementById("closeOrderModalButton");
    const closeOrderDetailsModalButton = document.getElementById("closeOrderDetailsModalButton");
    const closeExpenseModalButton = document.getElementById("closeExpenseModalButton");
    
    // Formulários
    const customerForm = document.getElementById("customerForm");
    const orderForm = document.getElementById("orderForm");
    const expenseForm = document.getElementById("expenseForm");
    
    // Variáveis de estado
    let currentOrderId = null;
    let customers = [];
    let orders = [];
    
    // Inicialização
    init();
    
    function init() {
        // Carregar dados iniciais
        loadDashboardData();
        loadCustomers();
        
        // Configurar event listeners
        setupEventListeners();
    }
    
    function setupEventListeners() {
        // Navegação
        customersLink.addEventListener("click", showCustomersSection);
        reportsLink.addEventListener("click", showReportsSection);
        
        // Botões de ação
        newOrderButton.addEventListener("click", showNewOrderModal);
        newCustomerButton.addEventListener("click", showNewCustomerModal);
        newCustomerFromOrderButton.addEventListener("click", showNewCustomerModal);
        
        // Fechar modais
        closeCustomerModalButton.addEventListener("click", () => hideModal(customerModal));
        closeOrderModalButton.addEventListener("click", () => hideModal(orderModal));
        closeOrderDetailsModalButton.addEventListener("click", () => hideModal(orderDetailsModal));
        closeExpenseModalButton.addEventListener("click", () => hideModal(expenseModal));
        
        // Formulários
        customerForm.addEventListener("submit", handleCustomerFormSubmit);
        orderForm.addEventListener("submit", handleOrderFormSubmit);
        expenseForm.addEventListener("submit", handleExpenseFormSubmit);
        
        // Cálculo automático do total do orçamento
        document.getElementById("orderLaborCost").addEventListener("input", calculateOrderTotal);
        document.getElementById("orderPartsCost").addEventListener("input", calculateOrderTotal);
        document.getElementById("orderThirdPartyCost").addEventListener("input", calculateOrderTotal);
        
        // Filtros
        document.getElementById("statusFilter").addEventListener("change", applyFilters);
        document.getElementById("customerFilter").addEventListener("change", applyFilters);
        document.getElementById("dateRangeFilter").addEventListener("change", handleDateRangeChange);
        document.getElementById("applyFiltersButton").addEventListener("click", applyFilters);
        
        // Status cards
        document.querySelectorAll(".status-card").forEach(card => {
            card.addEventListener("click", () => {
                document.getElementById("statusFilter").value = card.dataset.status;
                applyFilters();
            });
        });
        
        // Cancelar ordem
        document.getElementById("cancelOrderButton").addEventListener("click", () => hideModal(orderModal));
        
        // Fechar detalhes da ordem
        document.getElementById("closeOrderDetailsButton").addEventListener("click", () => hideModal(orderDetailsModal));
    }
    
    // Funções de navegação
    function showCustomersSection(e) {
        e.preventDefault();
        orderDashboardSection.classList.add("hidden");
        customersSection.classList.remove("hidden");
        reportsSection.classList.add("hidden");
        
        loadCustomersTable();
    }
    
    function showReportsSection(e) {
        e.preventDefault();
        orderDashboardSection.classList.add("hidden");
        customersSection.classList.add("hidden");
        reportsSection.classList.remove("hidden");
        
        // Carregar dados de relatórios quando implementado
    }
    
    // Funções de modal
    function showModal(modal) {
        modal.classList.remove("hidden");
    }
    
    function hideModal(modal) {
        modal.classList.add("hidden");
    }
    
    function showNewCustomerModal() {
        // Limpar formulário
        customerForm.reset();
        document.getElementById("customerId").value = "";
        document.getElementById("customerModalTitle").textContent = "Novo Cliente";
        document.getElementById("customerFormMessage").textContent = "";
        document.getElementById("customerFormMessage").className = "message";
        
        showModal(customerModal);
    }
    
    function showNewOrderModal() {
        // Limpar formulário
        orderForm.reset();
        document.getElementById("orderId").value = "";
        document.getElementById("orderModalTitle").textContent = "Nova Ordem";
        document.getElementById("orderFormMessage").textContent = "";
        document.getElementById("orderFormMessage").className = "message";
        
        // Preencher select de clientes
        populateCustomerSelect();
        
        // Inicializar valor total
        document.getElementById("orderTotalAmount").value = "0.00";
        
        showModal(orderModal);
    }
    
    function showOrderDetailsModal(orderId) {
        currentOrderId = orderId;
        
        // Carregar detalhes da ordem
        fetchOrderDetails(orderId);
        
        showModal(orderDetailsModal);
    }
    
    function showAddExpenseModal(orderId) {
        // Limpar formulário
        expenseForm.reset();
        document.getElementById("expenseId").value = "";
        document.getElementById("expenseOrderId").value = orderId;
        document.getElementById("expenseModalTitle").textContent = "Adicionar Despesa";
        document.getElementById("expenseFormMessage").textContent = "";
        document.getElementById("expenseFormMessage").className = "message";
        
        // Definir data atual
        document.getElementById("expenseDate").valueAsDate = new Date();
        
        showModal(expenseModal);
    }
    
    // Funções de carregamento de dados
    function loadDashboardData() {
        // Carregar contadores de status e ordens recentes
        fetch('/api/orders/dashboard')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao carregar dados do dashboard');
                }
                return response.json();
            })
            .then(data => {
                updateStatusCounts(data.status_counts);
                loadOrdersTable(data.recent_orders);
            })
            .catch(error => {
                console.error('Erro:', error);
                showMessage('Erro ao carregar dados do dashboard', 'error');
            });
    }
    
    function loadCustomers() {
        fetch('/api/customers')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao carregar clientes');
                }
                return response.json();
            })
            .then(data => {
                customers = data;
                populateCustomerSelect();
                populateCustomerFilter();
            })
            .catch(error => {
                console.error('Erro:', error);
                showMessage('Erro ao carregar clientes', 'error');
            });
    }
    
    function loadOrdersTable(ordersData = null) {
        if (ordersData) {
            // Usar dados fornecidos
            orders = ordersData;
            renderOrdersTable();
        } else {
            // Buscar dados com filtros aplicados
            const status = document.getElementById("statusFilter").value;
            const customerId = document.getElementById("customerFilter").value;
            
            let url = '/api/orders';
            let params = [];
            
            if (status && status !== 'all') {
                params.push(`status=${status}`);
            }
            
            if (customerId && customerId !== 'all') {
                params.push(`customer_id=${customerId}`);
            }
            
            if (params.length > 0) {
                url += '?' + params.join('&');
            }
            
            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erro ao carregar ordens');
                    }
                    return response.json();
                })
                .then(data => {
                    orders = data;
                    renderOrdersTable();
                })
                .catch(error => {
                    console.error('Erro:', error);
                    showMessage('Erro ao carregar ordens', 'error');
                });
        }
    }
    
    function loadCustomersTable() {
        fetch('/api/customers')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao carregar clientes');
                }
                return response.json();
            })
            .then(data => {
                customers = data;
                renderCustomersTable();
            })
            .catch(error => {
                console.error('Erro:', error);
                showMessage('Erro ao carregar clientes', 'error');
            });
    }
    
    function fetchOrderDetails(orderId) {
        // Carregar detalhes da ordem
        fetch(`/api/orders/${orderId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao carregar detalhes da ordem');
                }
                return response.json();
            })
            .then(orderData => {
                // Preencher informações básicas
                renderOrderDetails(orderData);
                
                // Carregar histórico de status
                return fetch(`/api/orders/${orderId}/status-history`);
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao carregar histórico de status');
                }
                return response.json();
            })
            .then(historyData => {
                renderStatusTimeline(historyData);
                
                // Carregar despesas
                return fetch(`/api/orders/${orderId}/expenses`);
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao carregar despesas');
                }
                return response.json();
            })
            .then(expensesData => {
                renderExpensesTable(expensesData);
                
                // Carregar resumo de despesas
                return fetch(`/api/orders/${orderId}/expenses/summary`);
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao carregar resumo de despesas');
                }
                return response.json();
            })
            .then(summaryData => {
                renderExpensesSummary(summaryData);
                updateOrderMetrics(summaryData);
            })
            .catch(error => {
                console.error('Erro:', error);
                showMessage('Erro ao carregar detalhes da ordem', 'error');
            });
    }
    
    // Funções de renderização
    function renderOrdersTable() {
        const tableBody = document.getElementById("ordersTableBody");
        tableBody.innerHTML = '';
        
        if (orders.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="8" class="text-center">Nenhuma ordem encontrada</td>`;
            tableBody.appendChild(row);
            return;
        }
        
        orders.forEach(order => {
            const row = document.createElement('tr');
            
            // Calcular dias em andamento
            let daysRunning = '';
            if (order.created_at) {
                const createdDate = new Date(order.created_at);
                const today = new Date();
                const diffTime = Math.abs(today - createdDate);
                daysRunning = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
            
            // Formatar data
            const createdDate = order.created_at ? new Date(order.created_at).toLocaleDateString('pt-BR') : '';
            
            // Formatar valor
            const totalAmount = order.quote ? formatCurrency(order.quote.total_amount) : 'N/A';
            
            // Traduzir status
            const statusText = translateStatus(order.status);
            
            row.innerHTML = `
                <td>${order.order_number}</td>
                <td>${order.customer ? order.customer.name : 'N/A'}</td>
                <td>${order.equipment}</td>
                <td><span class="status-badge status-${order.status}">${statusText}</span></td>
                <td>${createdDate}</td>
                <td>${daysRunning}</td>
                <td>${totalAmount}</td>
                <td>
                    <button class="action-button view-button" data-id="${order.id}">Ver</button>
                    <button class="action-button edit-button" data-id="${order.id}">Editar</button>
                    ${order.status === 'quote' ? `<button class="action-button delete-button" data-id="${order.id}">Excluir</button>` : ''}
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Adicionar event listeners para botões de ação
        document.querySelectorAll('.view-button').forEach(button => {
            button.addEventListener('click', () => showOrderDetailsModal(button.dataset.id));
        });
        
        document.querySelectorAll('.edit-button').forEach(button => {
            button.addEventListener('click', () => editOrder(button.dataset.id));
        });
        
        document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', () => deleteOrder(button.dataset.id));
        });
    }
    
    function renderCustomersTable() {
        const tableBody = document.getElementById("customersTableBody");
        tableBody.innerHTML = '';
        
        if (customers.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="5" class="text-center">Nenhum cliente encontrado</td>`;
            tableBody.appendChild(row);
            return;
        }
        
        customers.forEach(customer => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${customer.name}</td>
                <td>${customer.email || 'N/A'}</td>
                <td>${customer.phone || 'N/A'}</td>
                <td><button class="action-button view-orders-button" data-id="${customer.id}">Ver Ordens</button></td>
                <td>
                    <button class="action-button edit-customer-button" data-id="${customer.id}">Editar</button>
                    <button class="action-button delete-customer-button" data-id="${customer.id}">Excluir</button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Adicionar event listeners para botões de ação
        document.querySelectorAll('.view-orders-button').forEach(button => {
            button.addEventListener('click', () => {
                document.getElementById("customerFilter").value = button.dataset.id;
                applyFilters();
                
                // Voltar para a seção de ordens
                orderDashboardSection.classList.remove("hidden");
                customersSection.classList.add("hidden");
                reportsSection.classList.add("hidden");
            });
        });
        
        document.querySelectorAll('.edit-customer-button').forEach(button => {
            button.addEventListener('click', () => editCustomer(button.dataset.id));
        });
        
        document.querySelectorAll('.delete-customer-button').forEach(button => {
            button.addEventListener('click', () => deleteCustomer(button.dataset.id));
        });
    }
    
    function renderOrderDetails(order) {
        // Preencher informações básicas
        document.getElementById("orderNumberDisplay").textContent = order.order_number;
        document.getElementById("detailsCustomerName").textContent = order.customer ? order.customer.name : 'N/A';
        document.getElementById("detailsEquipment").textContent = order.equipment;
        document.getElementById("detailsStatus").textContent = translateStatus(order.status);
        document.getElementById("detailsCreatedAt").textContent = formatDate(order.created_at);
        
        // Calcular dias em andamento
        let daysRunning = '';
        if (order.created_at) {
            const createdDate = new Date(order.created_at);
            const today = new Date();
            const diffTime = Math.abs(today - createdDate);
            daysRunning = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
        document.getElementById("detailsDaysRunning").textContent = daysRunning;
        
        document.getElementById("detailsProblemDescription").textContent = order.problem_description || 'Nenhuma descrição fornecida';
        
        // Preencher informações do orçamento
        if (order.quote) {
            document.getElementById("detailsLaborCost").textContent = formatCurrency(order.quote.labor_cost);
            document.getElementById("detailsPartsCost").textContent = formatCurrency(order.quote.parts_cost);
            document.getElementById("detailsThirdPartyCost").textContent = formatCurrency(order.quote.third_party_cost);
            document.getElementById("detailsEstimatedDays").textContent = `${order.quote.estimated_days} dias`;
            document.getElementById("detailsTotalAmount").textContent = formatCurrency(order.quote.total_amount);
        } else {
            document.getElementById("detailsLaborCost").textContent = 'N/A';
            document.getElementById("detailsPartsCost").textContent = 'N/A';
            document.getElementById("detailsThirdPartyCost").textContent = 'N/A';
            document.getElementById("detailsEstimatedDays").textContent = 'N/A';
            document.getElementById("detailsTotalAmount").textContent = 'N/A';
        }
        
        // Configurar botões de ação com base no status atual
        setupStatusButtons(order.status);
        
        // Configurar botão de adicionar despesa
        document.getElementById("addExpenseButton").addEventListener("click", () => showAddExpenseModal(order.id));
        
        // Configurar botão de editar ordem
        document.getElementById("editOrderButton").addEventListener("click", () => {
            hideModal(orderDetailsModal);
            editOrder(order.id);
        });
        
        // Configurar botão de gerar relatório
        document.getElementById("generateOrderReportButton").addEventListener("click", () => generateOrderReport(order.id));
    }
    
    function renderStatusTimeline(historyData) {
        const timelineContainer = document.getElementById("statusTimeline");
        timelineContainer.innerHTML = '';
        
        if (historyData.length === 0) {
            timelineContainer.innerHTML = '<p>Nenhum histórico de status disponível</p>';
            return;
        }
        
        // Ordenar do mais recente para o mais antigo
        historyData.sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at));
        
        historyData.forEach(entry => {
            const item = document.createElement('div');
            item.className = 'timeline-item';
            
            item.innerHTML = `
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                    <div class="timeline-status">${translateStatus(entry.status)}</div>
                    <div class="timeline-date">${formatDateTime(entry.changed_at)}</div>
                    <div class="timeline-by">Por: ${entry.changed_by}</div>
                    ${entry.notes ? `<div class="timeline-notes">${entry.notes}</div>` : ''}
                </div>
            `;
            
            timelineContainer.appendChild(item);
        });
    }
    
    function renderExpensesTable(expenses) {
        const tableBody = document.getElementById("expensesTableBody");
        tableBody.innerHTML = '';
        
        if (expenses.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="6" class="text-center">Nenhuma despesa registrada</td>`;
            tableBody.appendChild(row);
            return;
        }
        
        expenses.forEach(expense => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${formatDate(expense.date)}</td>
                <td>${translateExpenseCategory(expense.category)}</td>
                <td>${expense.description}</td>
                <td>${formatCurrency(expense.amount)}</td>
                <td>${expense.is_warranty ? 'Sim' : 'Não'}</td>
                <td>
                    <button class="action-button edit-expense-button" data-id="${expense.id}">Editar</button>
                    <button class="action-button delete-expense-button" data-id="${expense.id}">Excluir</button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Adicionar event listeners para botões de ação
        document.querySelectorAll('.edit-expense-button').forEach(button => {
            button.addEventListener('click', () => editExpense(button.dataset.id));
        });
        
        document.querySelectorAll('.delete-expense-button').forEach(button => {
            button.addEventListener('click', () => deleteExpense(button.dataset.id));
        });
    }
    
    function renderExpensesSummary(summary) {
        document.getElementById("expensesLaborTotal").textContent = formatCurrency(summary.labor || 0);
        document.getElementById("expensesPartsTotal").textContent = formatCurrency(summary.parts || 0);
        document.getElementById("expensesThirdPartyTotal").textContent = formatCurrency(summary.third_party || 0);
        document.getElementById("expensesTotalAmount").textContent = formatCurrency(summary.total || 0);
        document.getElementById("expensesWarrantyTotal").textContent = formatCurrency(summary.warranty_total || 0);
    }
    
    // Funções de manipulação de formulários
    function handleCustomerFormSubmit(e) {
        e.preventDefault();
        
        const customerId = document.getElementById("customerId").value;
        const customerData = {
            name: document.getElementById("customerName").value,
            email: document.getElementById("customerEmail").value,
            phone: document.getElementById("customerPhone").value,
            address: document.getElementById("customerAddress").value
        };
        
        const url = customerId ? `/api/customers/${customerId}` : '/api/customers';
        const method = customerId ? 'PUT' : 'POST';
        
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(customerData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao salvar cliente');
            }
            return response.json();
        })
        .then(data => {
            showFormMessage(customerForm, data.message, 'success');
            
            // Atualizar lista de clientes
            loadCustomers();
            
            // Se estiver na seção de clientes, atualizar tabela
            if (!customersSection.classList.contains("hidden")) {
                loadCustomersTable();
            }
            
            // Fechar modal após 1 segundo
            setTimeout(() => {
                hideModal(customerModal);
            }, 1000);
        })
        .catch(error => {
            console.error('Erro:', error);
            showFormMessage(customerForm, 'Erro ao salvar cliente', 'error');
        });
    }
    
    function handleOrderFormSubmit(e) {
        e.preventDefault();
        
        const orderId = document.getElementById("orderId").value;
        const orderData = {
            customer_id: document.getElementById("orderCustomer").value,
            equipment: document.getElementById("orderEquipment").value,
            problem_description: document.getElementById("orderProblemDescription").value,
            labor_cost: parseFloat(document.getElementById("orderLaborCost").value) || 0,
            parts_cost: parseFloat(document.getElementById("orderPartsCost").value) || 0,
            third_party_cost: parseFloat(document.getElementById("orderThirdPartyCost").value) || 0,
            estimated_days: parseInt(document.getElementById("orderEstimatedDays").value) || 1,
            notes: document.getElementById("orderNotes").value
        };
        
        const url = orderId ? `/api/orders/${orderId}` : '/api/orders';
        const method = orderId ? 'PUT' : 'POST';
        
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao salvar ordem');
            }
            return response.json();
        })
        .then(data => {
            showFormMessage(orderForm, data.message, 'success');
            
            // Atualizar lista de ordens
            loadOrdersTable();
            loadDashboardData();
            
            // Fechar modal após 1 segundo
            setTimeout(() => {
                hideModal(orderModal);
            }, 1000);
        })
        .catch(error => {
            console.error('Erro:', error);
            showFormMessage(orderForm, 'Erro ao salvar ordem', 'error');
        });
    }
    
    function handleExpenseFormSubmit(e) {
        e.preventDefault();
        
        const expenseId = document.getElementById("expenseId").value;
        const orderId = document.getElementById("expenseOrderId").value;
        const expenseData = {
            category: document.getElementById("expenseCategory").value,
            description: document.getElementById("expenseDescription").value,
            amount: parseFloat(document.getElementById("expenseAmount").value) || 0,
            date: document.getElementById("expenseDate").value,
            is_warranty: document.getElementById("expenseIsWarranty").checked
        };
        
        const url = expenseId ? `/api/expenses/${expenseId}` : `/api/orders/${orderId}/expenses`;
        const method = expenseId ? 'PUT' : 'POST';
        
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(expenseData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao salvar despesa');
            }
            return response.json();
        })
        .then(data => {
            showFormMessage(expenseForm, data.message, 'success');
            
            // Atualizar despesas da ordem atual
            if (currentOrderId) {
                fetch(`/api/orders/${currentOrderId}/expenses`)
                    .then(response => response.json())
                    .then(expensesData => {
                        renderExpensesTable(expensesData);
                        
                        // Atualizar resumo de despesas
                        return fetch(`/api/orders/${currentOrderId}/expenses/summary`);
                    })
                    .then(response => response.json())
                    .then(summaryData => {
                        renderExpensesSummary(summaryData);
                        updateOrderMetrics(summaryData);
                    });
            }
            
            // Fechar modal após 1 segundo
            setTimeout(() => {
                hideModal(expenseModal);
            }, 1000);
        })
        .catch(error => {
            console.error('Erro:', error);
            showFormMessage(expenseForm, 'Erro ao salvar despesa', 'error');
        });
    }
    
    // Funções de edição e exclusão
    function editCustomer(customerId) {
        const customer = customers.find(c => c.id == customerId);
        if (!customer) return;
        
        document.getElementById("customerId").value = customer.id;
        document.getElementById("customerName").value = customer.name;
        document.getElementById("customerEmail").value = customer.email || '';
        document.getElementById("customerPhone").value = customer.phone || '';
        document.getElementById("customerAddress").value = customer.address || '';
        
        document.getElementById("customerModalTitle").textContent = "Editar Cliente";
        document.getElementById("customerFormMessage").textContent = "";
        document.getElementById("customerFormMessage").className = "message";
        
        showModal(customerModal);
    }
    
    function editOrder(orderId) {
        fetch(`/api/orders/${orderId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao carregar ordem');
                }
                return response.json();
            })
            .then(order => {
                document.getElementById("orderId").value = order.id;
                document.getElementById("orderCustomer").value = order.customer_id;
                document.getElementById("orderEquipment").value = order.equipment;
                document.getElementById("orderProblemDescription").value = order.problem_description || '';
                document.getElementById("orderNotes").value = order.notes || '';
                
                if (order.quote) {
                    document.getElementById("orderLaborCost").value = order.quote.labor_cost || 0;
                    document.getElementById("orderPartsCost").value = order.quote.parts_cost || 0;
                    document.getElementById("orderThirdPartyCost").value = order.quote.third_party_cost || 0;
                    document.getElementById("orderEstimatedDays").value = order.quote.estimated_days || 1;
                    document.getElementById("orderTotalAmount").value = order.quote.total_amount || 0;
                }
                
                document.getElementById("orderModalTitle").textContent = "Editar Ordem";
                document.getElementById("orderFormMessage").textContent = "";
                document.getElementById("orderFormMessage").className = "message";
                
                // Preencher select de clientes
                populateCustomerSelect();
                
                showModal(orderModal);
            })
            .catch(error => {
                console.error('Erro:', error);
                showMessage('Erro ao carregar ordem para edição', 'error');
            });
    }
    
    function editExpense(expenseId) {
        fetch(`/api/expenses/${expenseId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao carregar despesa');
                }
                return response.json();
            })
            .then(expense => {
                document.getElementById("expenseId").value = expense.id;
                document.getElementById("expenseOrderId").value = expense.order_id;
                document.getElementById("expenseCategory").value = expense.category;
                document.getElementById("expenseDescription").value = expense.description;
                document.getElementById("expenseAmount").value = expense.amount;
                document.getElementById("expenseDate").value = expense.date ? expense.date.split('T')[0] : '';
                document.getElementById("expenseIsWarranty").checked = expense.is_warranty;
                
                document.getElementById("expenseModalTitle").textContent = "Editar Despesa";
                document.getElementById("expenseFormMessage").textContent = "";
                document.getElementById("expenseFormMessage").className = "message";
                
                showModal(expenseModal);
            })
            .catch(error => {
                console.error('Erro:', error);
                showMessage('Erro ao carregar despesa para edição', 'error');
            });
    }
    
    function deleteCustomer(customerId) {
        if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
        
        fetch(`/api/customers/${customerId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao excluir cliente');
            }
            return response.json();
        })
        .then(data => {
            showMessage(data.message, 'success');
            loadCustomersTable();
            loadCustomers();
        })
        .catch(error => {
            console.error('Erro:', error);
            showMessage('Erro ao excluir cliente', 'error');
        });
    }
    
    function deleteOrder(orderId) {
        if (!confirm('Tem certeza que deseja excluir esta ordem?')) return;
        
        fetch(`/api/orders/${orderId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao excluir ordem');
            }
            return response.json();
        })
        .then(data => {
            showMessage(data.message, 'success');
            loadOrdersTable();
            loadDashboardData();
        })
        .catch(error => {
            console.error('Erro:', error);
            showMessage('Erro ao excluir ordem', 'error');
        });
    }
    
    function deleteExpense(expenseId) {
        if (!confirm('Tem certeza que deseja excluir esta despesa?')) return;
        
        fetch(`/api/expenses/${expenseId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao excluir despesa');
            }
            return response.json();
        })
        .then(data => {
            showMessage(data.message, 'success');
            
            // Atualizar despesas da ordem atual
            if (currentOrderId) {
                fetch(`/api/orders/${currentOrderId}/expenses`)
                    .then(response => response.json())
                    .then(expensesData => {
                        renderExpensesTable(expensesData);
                        
                        // Atualizar resumo de despesas
                        return fetch(`/api/orders/${currentOrderId}/expenses/summary`);
                    })
                    .then(response => response.json())
                    .then(summaryData => {
                        renderExpensesSummary(summaryData);
                        updateOrderMetrics(summaryData);
                    });
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            showMessage('Erro ao excluir despesa', 'error');
        });
    }
    
    // Funções de atualização de status
    function updateOrderStatus(orderId, newStatus) {
        fetch(`/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao atualizar status');
            }
            return response.json();
        })
        .then(data => {
            showMessage(data.message, 'success');
            
            // Atualizar detalhes da ordem
            fetchOrderDetails(orderId);
            
            // Atualizar lista de ordens e dashboard
            loadOrdersTable();
            loadDashboardData();
        })
        .catch(error => {
            console.error('Erro:', error);
            showMessage('Erro ao atualizar status', 'error');
        });
    }
    
    function setupStatusButtons(currentStatus) {
        const buttonsContainer = document.getElementById("statusButtons");
        buttonsContainer.innerHTML = '';
        
        // Definir próximos status possíveis com base no status atual
        let nextStatuses = [];
        
        switch (currentStatus) {
            case 'quote':
                nextStatuses = [{ value: 'approved', label: 'Aprovar Orçamento' }];
                break;
            case 'approved':
                nextStatuses = [{ value: 'in_progress', label: 'Iniciar Manutenção' }];
                break;
            case 'in_progress':
                nextStatuses = [{ value: 'completed', label: 'Marcar como Concluída' }];
                break;
            case 'completed':
                nextStatuses = [{ value: 'returned', label: 'Registrar Devolução' }];
                break;
            case 'returned':
                nextStatuses = [
                    { value: 'warranty', label: 'Registrar Problema de Garantia' },
                    { value: 'closed', label: 'Encerrar Ordem' }
                ];
                break;
            case 'warranty':
                nextStatuses = [{ value: 'closed', label: 'Encerrar Ordem' }];
                break;
            default:
                break;
        }
        
        // Criar botões para cada próximo status possível
        nextStatuses.forEach(status => {
            const button = document.createElement('button');
            button.className = 'secondary-button';
            button.textContent = status.label;
            button.addEventListener('click', () => {
                if (confirm(`Tem certeza que deseja alterar o status para "${translateStatus(status.value)}"?`)) {
                    updateOrderStatus(currentOrderId, status.value);
                }
            });
            
            buttonsContainer.appendChild(button);
        });
    }
    
    // Funções de relatório
    function generateOrderReport(orderId) {
        // Implementar geração de relatório
        alert('Funcionalidade de geração de relatório será implementada em breve.');
    }
    
    // Funções utilitárias
    function updateStatusCounts(counts) {
        document.querySelectorAll(".status-card").forEach(card => {
            const status = card.dataset.status;
            const countElement = card.querySelector(".count");
            
            if (counts[status] !== undefined) {
                countElement.textContent = counts[status];
            } else {
                countElement.textContent = "0";
            }
        });
    }
    
    function populateCustomerSelect() {
        const select = document.getElementById("orderCustomer");
        select.innerHTML = '<option value="">Selecione um cliente</option>';
        
        customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = customer.name;
            select.appendChild(option);
        });
    }
    
    function populateCustomerFilter() {
        const select = document.getElementById("customerFilter");
        select.innerHTML = '<option value="all">Todos</option>';
        
        customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = customer.name;
            select.appendChild(option);
        });
    }
    
    function calculateOrderTotal() {
        const laborCost = parseFloat(document.getElementById("orderLaborCost").value) || 0;
        const partsCost = parseFloat(document.getElementById("orderPartsCost").value) || 0;
        const thirdPartyCost = parseFloat(document.getElementById("orderThirdPartyCost").value) || 0;
        
        const total = laborCost + partsCost + thirdPartyCost;
        document.getElementById("orderTotalAmount").value = total.toFixed(2);
    }
    
    function handleDateRangeChange() {
        const dateRangeFilter = document.getElementById("dateRangeFilter");
        const customDateRange = document.getElementById("customDateRange");
        
        if (dateRangeFilter.value === 'custom') {
            customDateRange.classList.remove("hidden");
        } else {
            customDateRange.classList.add("hidden");
        }
    }
    
    function applyFilters() {
        loadOrdersTable();
    }
    
    function updateOrderMetrics(summary) {
        // Atualizar barra de progresso de orçamento vs despesas
        const budgetVsExpensesBar = document.getElementById("budgetVsExpensesBar");
        const budgetVsExpensesText = document.getElementById("budgetVsExpensesText");
        
        if (summary.quote && summary.quote.total_amount > 0) {
            const percentage = Math.min(100, (summary.total / summary.quote.total_amount) * 100);
            budgetVsExpensesBar.style.width = `${percentage}%`;
            
            if (percentage > 100) {
                budgetVsExpensesBar.style.backgroundColor = '#e74c3c'; // Vermelho para acima do orçamento
            } else if (percentage > 90) {
                budgetVsExpensesBar.style.backgroundColor = '#f39c12'; // Amarelo para próximo do limite
            } else {
                budgetVsExpensesBar.style.backgroundColor = '#2ecc71'; // Verde para dentro do orçamento
            }
            
            budgetVsExpensesText.textContent = `${formatCurrency(summary.total)} de ${formatCurrency(summary.quote.total_amount)} (${percentage.toFixed(1)}%)`;
        } else {
            budgetVsExpensesBar.style.width = '0%';
            budgetVsExpensesText.textContent = 'Sem orçamento definido';
        }
        
        // Calcular margem de lucro
        const profitMargin = document.getElementById("profitMargin");
        
        if (summary.quote && summary.quote.total_amount > 0) {
            const profit = summary.quote.total_amount - summary.total;
            const marginPercentage = (profit / summary.quote.total_amount) * 100;
            
            profitMargin.textContent = `${formatCurrency(profit)} (${marginPercentage.toFixed(1)}%)`;
            
            if (marginPercentage < 0) {
                profitMargin.style.color = '#e74c3c'; // Vermelho para prejuízo
            } else if (marginPercentage < 10) {
                profitMargin.style.color = '#f39c12'; // Amarelo para margem baixa
            } else {
                profitMargin.style.color = '#2ecc71'; // Verde para margem boa
            }
        } else {
            profitMargin.textContent = 'N/A';
            profitMargin.style.color = '';
        }
    }
    
    function showMessage(message, type) {
        // Implementar exibição de mensagem global
        alert(message);
    }
    
    function showFormMessage(form, message, type) {
        const messageElement = form.querySelector(".message");
        messageElement.textContent = message;
        messageElement.className = `message ${type}`;
    }
    
    function formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }
    
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('pt-BR');
    }
    
    function formatDateTime(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    function translateStatus(status) {
        const statusMap = {
            'quote': 'Orçamento',
            'approved': 'Aprovada',
            'in_progress': 'Em Andamento',
            'completed': 'Concluída',
            'returned': 'Devolvida',
            'warranty': 'Garantia',
            'closed': 'Fechada'
        };
        
        return statusMap[status] || status;
    }
    
    function translateExpenseCategory(category) {
        const categoryMap = {
            'parts': 'Peças',
            'labor': 'Mão de Obra',
            'third_party': 'Serviços Terceirizados'
        };
        
        return categoryMap[category] || category;
    }
});
