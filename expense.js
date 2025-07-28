class ExpenseTracker{
    contructor() {
        this.transactions=
        JSON.parse(localStorage.getItem('transactions')) || [];
        this.chart = null;
        this.init();
    }
    init() {
        this.setCurrentListeners();
        this.updateDisplay();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('addTransactionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTransaction();
        });

        document.getElementById('clear-all').addEventListener('click', () => {
            this.showConfirmationModal();
        });
        document.getElementById('confirm-clear').addEventListener('click', () => {
            this.clearAllTransactions();
        });
        document.getElementById('cancel-clear').addEventListener('click', () => {
            this.hideConfirmationModal();
        });
        document.getElementById('add-income').addEventListener('click', () => {
            this.setFormType('income');
        });

        document.getElementById('add-expense').addEventListener('click', () => {
            this.setFormType('expense');
        });
    
        document.getElementById('filter-category').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('filter-type').addEventListener('change', () => {
            this.applyFilters();
        });
        document.getElementById('filter-month').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('clear-filters').addEventListener('click', () => {
            this.clearFilters();
        });
    }
    setCurrentDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
    }

    setFormType(type) {
        document.getElementById('type').value = type;
        document.querySelector(`#type option[value="${type}"]`).selected = true;
        document.getElementById('transaction-form').scrollIntoView({ behavior: 'smooth' });
    }
    getFormData() {
        return{
            description: document.getElementById('description').value,
            amount: parseFloat(document.getElementById('amount').value),category:document.getElementById('category').value,
            type: document.getElementById('type').value,
            date: document.getElementById('date').value
        };
    }
    validateFormData({ description, amount, category, type, date }) {
        if (!description) {
            this.showError('Please enter a description');
            return false;
        }
        if (!amount || amount <= 0) {
            this.showError('Please enter a valid amount greater than 0');
            return false;
        }
        if (!category) {
            this.showError('Please select a category');
            return false;
        }
        if (!type) {
            this.showError('Please select transaction type');
            return false;
        }
        if (!date) {
            this.showError('Please select a date');
            return false;
        }
        return true;
    }

    showError(message) {
        let errorDiv = document.getElementById('error-message');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'error-message';
            errorDiv.style.cssText = `
                color: #e74c3c; 
                padding: 10px; 
                margin: 10px 0; 
                border: 1px solid #e74c3c; 
                border-radius: 5px; 
                background-color: #fdf2f2;
                font-weight: 500;
                animation: slideIn 0.3s ease;
            `;
            document.getElementById('transaction-form').insertBefore(errorDiv, document.querySelector('.form-group'));
        }
        errorDiv.textContent = message;
        setTimeout(() => {
            if (errorDiv && errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 3000);
    }

    
    addTransaction() {
        const formData = this.getFormData();
        if (!this.validateFormData(formData)) return;

        const transaction = {
            id: Date.now(),
            ...formData
        };

        this.transactions.push(transaction);
        this.saveTransactions();
        this.updateDisplay();
        this.clearForm();
        this.showSuccess(`${formData.type.charAt(0).toUpperCase() + formData.type.slice(1)} added successfully!`);
    }

    
    showSuccess(message) {
        let successDiv = document.getElementById('success-message');
        if (!successDiv) {
            successDiv = document.createElement('div');
            successDiv.id = 'success-message';
            successDiv.style.cssText = `
                color: #27ae60; 
                padding: 10px; 
                margin: 10px 0; 
                border: 1px solid #27ae60; 
                border-radius: 5px; 
                background-color: #f0fff0;
                font-weight: 500;
                animation: slideIn 0.3s ease;
            `;
            document.getElementById('transaction-form').insertBefore(successDiv, document.querySelector('.form-group'));
        }
        successDiv.textContent = message;
        setTimeout(() => {
            if (successDiv && successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 2000);
    }

  
    clearForm() {
        document.getElementById('transaction-form').reset();
        this.setCurrentDate(); 
    }

    
    saveTransactions() {
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
    }

    
    clearAllTransactions() {
        this.transactions = [];
        this.saveTransactions();
        this.updateDisplay();
    }


    updateDisplay() {
        this.updateBalance();
        this.updateTransactionsList();
        this.updateCategorySummary(); 
        this.updateChart();
    }

    
    updateBalance() {
        const totals = this.transactions.reduce((acc, { type, amount }) => {
            acc[type] += amount;
            return acc;
        }, { income: 0, expense: 0 });
        
        const balance = totals.income - totals.expense;
        
        document.getElementById('balance').textContent = `₹${balance.toFixed(2)}`;
        document.getElementById('income').textContent = `₹${totals.income.toFixed(2)}`;
        document.getElementById('expenses').textContent = `₹${totals.expense.toFixed(2)}`;
        
        
        const balanceElement = document.getElementById('balance');
        if (balance >= 0) {
            balanceElement.style.color = '#27ae60';
        } else {
            balanceElement.style.color = '#e74c3c';
        }
    }

       updateTransactionsList() {
        const incomeList = document.getElementById('income-transactions-list');
        const expenseList = document.getElementById('expense-transactions-list');

        const filteredTransactions = this.getFilteredTransactions();
        
        const incomeTransactions = filteredTransactions.filter(t => t.type === 'income');
        const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense');

    
        incomeList.innerHTML = '';
        expenseList.innerHTML = '';

       
        if (incomeTransactions.length === 0) {
            incomeList.innerHTML = '<div class="no-transactions"><p>No income transactions found.</p></div>';
        } else {
            incomeTransactions.forEach(transaction => {
                incomeList.appendChild(this.createTransactionElement(transaction));
            });
        }

        if (expenseTransactions.length === 0) {
            expenseList.innerHTML = '<div class="no-transactions"><p>No expense transactions found.</p></div>';
        } else {
            expenseTransactions.forEach(transaction => {
                expenseList.appendChild(this.createTransactionElement(transaction));
            });
        }
    }

    createTransactionElement({ id, description, amount, category, type, date }) {
        const transactionDiv = document.createElement('div');
        transactionDiv.className = 'transaction-item';
        
        const categoryEmoji = this.getCategoryEmoji(category);
        
        transactionDiv.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-icon">${categoryEmoji}</div>
                <div class="transaction-details">
                    <h4>${description}</h4>
                    <div class="transaction-meta">
                        <span>📅 ${this.formatDate(date)}</span>
                        <span>🏷️ ${this.capitalize(category)}</span>
                    </div>
                </div>
            </div>
            <div class="transaction-amount ${type}">
                ₹${amount.toFixed(2)}
                <button class="delete-btn" onclick="expenseTracker.deleteTransaction(${id})" title="Delete transaction">
                    🗑️
                </button>
            </div>
        `;
        
        return transactionDiv;
    }

    
    getCategoryEmoji(category) {
        const emojis = {
            food: '🍕', 
            transport: '🚗', 
            entertainment: '🎬', 
            shopping: '🛍️',
            bills: '💡', 
            health: '🏥', 
            education: '📚', 
            salary: '💼',
            freelance: '💻', 
            investment: '📈', 
            gift: '🎁', 
            other: '📝'
        };
        return emojis[category] || '📝';
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }


    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }


    getFilteredTransactions() {
        const categoryFilter = document.getElementById('filter-category').value;
        const typeFilter = document.getElementById('filter-type').value;
        const monthFilter = document.getElementById('filter-month').value;

        return this.transactions.filter(transaction => {
            const matchesCategory = !categoryFilter || transaction.category === categoryFilter;
            const matchesType = !typeFilter || transaction.type === typeFilter;
            const matchesMonth = !monthFilter || transaction.date.startsWith(monthFilter);
            
            return matchesCategory && matchesType && matchesMonth;
        });
    }

    // Apply filters
    applyFilters() {
        this.updateTransactionsList();
        this.updateCategorySummary();
    }

    // Clear all filters
    clearFilters() {
        document.getElementById('filter-category').value = '';
        document.getElementById('filter-type').value = '';
        document.getElementById('filter-month').value = '';
        this.applyFilters();
    }

    
    updateCategorySummary() {
        const summaryDiv = document.getElementById('category-summary');
        const expenseTransactions = this.getFilteredTransactions().filter(t => t.type === 'expense');

        if (expenseTransactions.length === 0) {
            summaryDiv.innerHTML = '<p>Add some expenses to see category breakdown</p>';
            return;
        }

        const categoryTotals = {};
        expenseTransactions.forEach(({ category, amount }) => {
            categoryTotals[category] = (categoryTotals[category] || 0) + amount;
        });

        const sortedCategories = Object.entries(categoryTotals)
            .sort(([,a], [,b]) => b - a);

        summaryDiv.innerHTML = sortedCategories.map(([category, total]) => {
            const count = expenseTransactions.filter(t => t.category === category).length;
            const percentage = ((total / expenseTransactions.reduce((sum, t) => sum + t.amount, 0)) * 100).toFixed(1);
            
            return `
                <div class="category-item">
                    <div class="category-info">
                        <div class="category-icon">${this.getCategoryEmoji(category)}</div>
                        <div class="category-details">
                            <h4>${this.capitalize(category)}</h4>
                            <div class="category-count">${count} transaction${count > 1 ? 's' : ''} (${percentage}%)</div>
                        </div>
                    </div>
                    <div class="category-amount">₹${total.toFixed(2)}</div>
                </div>
            `;
        }).join('');
    }

    
    getMonthlyData() {
        const monthlyData = {};

        this.transactions.forEach(({ type, amount, date }) => {
            const month = date.slice(0, 7); 

            if (!monthlyData[month]) {
                monthlyData[month] = { income: 0, expense: 0 };
            }

            monthlyData[month][type] += amount;
        });

      
        const sortedMonths = Object.keys(monthlyData).sort();
        const sortedData = {};
        sortedMonths.forEach(month => {
            sortedData[month] = monthlyData[month];
        });

        return sortedData;
    }

    // Update chart
    updateChart() {
        const monthlyData = this.getMonthlyData();
        const ctx = document.getElementById('income-expense-chart').getContext('2d');

        // Destroy existing chart
        if (this.chart) {
            this.chart.destroy();
        }

        // Handle empty data
        if (Object.keys(monthlyData).length === 0) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.font = '16px Arial';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText('No data to display', ctx.canvas.width / 2, ctx.canvas.height / 2);
            return;
        }

        // Create new chart
        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(monthlyData),
                datasets: [
                    {
                        label: 'Income',
                        data: Object.values(monthlyData).map(data => data.income),
                        backgroundColor: 'rgba(39, 174, 96, 0.8)',
                        borderColor: 'rgba(39, 174, 96, 1)',
                        borderWidth: 2,
                        borderRadius: 4
                    },
                    {
                        label: 'Expenses',
                        data: Object.values(monthlyData).map(data => data.expense),
                        backgroundColor: 'rgba(231, 76, 60, 0.8)',
                        borderColor: 'rgba(231, 76, 60, 1)',
                        borderWidth: 2,
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    title: {
                        display: true,
                        text: 'Monthly Income vs Expenses',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ₹' + context.raw.toLocaleString();
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₹' + value.toLocaleString();
                            }
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    // Delete transaction with confirmation
    deleteTransaction(id) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            this.transactions = this.transactions.filter(t => t.id !== id);
            this.saveTransactions();
            this.updateDisplay();
        }
    }

 
    showConfirmationModal() {
        document.getElementById('confirmation-modal').classList.remove('hidden');
    }

   
    hideConfirmationModal() {
        document.getElementById('confirmation-modal').classList.add('hidden');
    }

   
    exportData() {
        const dataStr = JSON.stringify(this.transactions, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'expense-tracker-data.json';
        link.click();
        URL.revokeObjectURL(url);
    }

    
    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (Array.isArray(importedData)) {
                    this.transactions = importedData;
                    this.saveTransactions();
                    this.updateDisplay();
                    alert('Data imported successfully!');
                } else {
                    alert('Invalid file format!');
                }
            } catch (error) {
                alert('Error reading file!');
            }
        };
        reader.readAsText(file);
    }
}


let expenseTracker;


window.addEventListener('DOMContentLoaded', () => {
    expenseTracker = new ExpenseTracker();
});


document.addEventListener('visibilitychange', () => {
    if (!document.hidden && expenseTracker) {
        expenseTracker.updateDisplay();
    }
});