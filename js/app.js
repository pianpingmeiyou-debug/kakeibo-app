const App = {
    currentView: 'dashboard',
    currentDate: new Date(),
    selectedStars: 0,
    editingId: null,
    showAllRecent: false,
    chart: null,
    COLOR_PALETTE: [
        '#FFB7C5', '#B5EAD7', '#FDFD96', '#E0BBE4', '#FFD1DC', '#D4F1F4',
        '#C7CEEA', '#FFDAC1', '#BFFCC6', '#FFFFD1', '#97C1A9', '#85E3FF'
    ],

    init() {
        this.setupEventListeners();
        this.render();
        this.updateCategoryLists();
        this.updatePaymentLists();
    },

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.switchView(view);
            });
        });

        // Add Entry
        document.getElementById('add-entry-btn').addEventListener('click', () => {
            this.editingId = null;
            this.switchView('add');
        });
        document.getElementById('cancel-btn').addEventListener('click', () => this.switchView('dashboard'));
        document.getElementById('view-all-btn').addEventListener('click', () => {
            this.showAllRecent = !this.showAllRecent;
            this.renderDashboard();
        });

        // Type toggle (Income/Expense)
        document.querySelectorAll('.type-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.type-toggle-btn').forEach(b => b.classList.remove('bg-white', 'shadow-sm', 'text-ribbon-pink'));
                document.querySelectorAll('.type-toggle-btn').forEach(b => b.classList.add('text-gray-400'));
                btn.classList.remove('text-gray-400');
                btn.classList.add('bg-white', 'shadow-sm', 'text-ribbon-pink');

                const type = btn.dataset.type;
                const necessityContainer = document.getElementById('necessity-container');
                const paymentSelect = document.getElementById('input-payment');
                if (type === 'income') {
                    necessityContainer.classList.add('opacity-30', 'pointer-events-none');
                    paymentSelect.disabled = true;
                    paymentSelect.parentElement.classList.add('opacity-30');
                } else {
                    necessityContainer.classList.remove('opacity-30', 'pointer-events-none');
                    paymentSelect.disabled = false;
                    paymentSelect.parentElement.classList.remove('opacity-30');
                }
                // Refresh categories for this type
                this.updateCategoryLists(type);
            });
        });

        // Star rating
        document.querySelectorAll('.star-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const val = parseInt(btn.dataset.value);
                this.selectedStars = val;
                document.querySelectorAll('.star-btn').forEach((b, i) => {
                    if (i < val) {
                        b.classList.remove('text-gray-300');
                        b.classList.add('text-yellow-400');
                    } else {
                        b.classList.remove('text-yellow-400');
                        b.classList.add('text-gray-300');
                    }
                });
            });
        });

        // Save Entry
        document.getElementById('save-btn').addEventListener('click', () => this.handleSave());

        // Stats Month Control
        document.getElementById('prev-month').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('next-month').addEventListener('click', () => this.changeMonth(1));

        // AI Generation
        document.getElementById('generate-ai-btn').addEventListener('click', () => this.generateFullAdvice());

        // Goal Setting
        document.getElementById('save-goals-btn').addEventListener('click', () => this.handleSaveGoals());

        // Saving Goals
        document.getElementById('save-saving-goals-btn').addEventListener('click', () => this.handleSaveSavingGoals());
        document.getElementById('edit-saving-btn').addEventListener('click', () => {
            document.getElementById('saving-setup-form').classList.remove('hidden');
            document.getElementById('saving-stats').classList.add('hidden');
        });

        // Calendar Month Control
        document.getElementById('cal-prev-month').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('cal-next-month').addEventListener('click', () => this.changeMonth(1));

        // Category & Payment Management in Settings
        document.getElementById('add-expense-cat-btn').addEventListener('click', () => this.handleAddCategory('expense'));
        document.getElementById('add-income-cat-btn').addEventListener('click', () => this.handleAddCategory('income'));
        document.getElementById('add-payment-method-btn').addEventListener('click', () => this.handleAddPaymentMethod());

        // Delete Delegation
        document.getElementById('settings-view').addEventListener('click', (e) => {
            const deleteCatBtn = e.target.closest('.delete-cat-btn');
            if (deleteCatBtn) {
                this.handleDeleteCategory(deleteCatBtn.dataset.id);
            }
            const deletePayBtn = e.target.closest('.delete-pay-btn');
            if (deletePayBtn) {
                this.handleDeletePaymentMethod(deletePayBtn.dataset.id);
            }
        });

        // Record Edit & Delete
        document.getElementById('recent-list').addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-entry-btn');
            if (editBtn) {
                this.handleEdit(editBtn.dataset.id);
            }
        });
        document.getElementById('delete-btn').addEventListener('click', () => this.handleDeleteEntry());
    },

    switchView(viewId) {
        this.currentView = viewId;
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
        document.getElementById(`${viewId}-view`).classList.remove('hidden');

        // Update nav UI
        document.querySelectorAll('.nav-btn').forEach(btn => {
            if (btn.dataset.view === viewId) {
                btn.classList.add('nav-active');
                btn.classList.remove('text-gray-400');
            } else {
                btn.classList.remove('nav-active');
                btn.classList.add('text-gray-400');
            }
        });

        if (viewId === 'add') {
            const title = document.querySelector('#add-view h2');
            const deleteBtn = document.getElementById('delete-btn');
            if (this.editingId) {
                title.innerText = '記録を修正する ✏️';
                deleteBtn.classList.remove('hidden');
            } else {
                title.innerText = '記録をつける ✏️';
                deleteBtn.classList.add('hidden');
            }
        }

        if (viewId !== 'dashboard') {
            this.showAllRecent = false;
        }

        this.render();
    },

    render() {
        if (this.currentView === 'dashboard') {
            this.renderDashboard();
        } else if (this.currentView === 'stats') {
            this.renderStats();
        } else if (this.currentView === 'calendar') {
            this.renderCalendar();
        } else if (this.currentView === 'saving') {
            this.renderSaving();
        } else if (this.currentView === 'settings') {
            this.renderSettings();
        }
    },

    renderDashboard() {
        const entries = Storage.getEntries();
        const goals = Storage.getGoals();
        const now = new Date();
        const monthEntries = entries.filter(e => {
            const d = new Date(e.date);
            return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        });

        const totalExpense = monthEntries.filter(e => e.type === 'expense').reduce((sum, e) => sum + Number(e.amount), 0);
        const totalIncome = monthEntries.filter(e => e.type === 'income').reduce((sum, e) => sum + Number(e.amount), 0);

        // Update Labels
        document.getElementById('month-label').innerText = `${now.getFullYear()}年${now.getMonth() + 1}月`;
        document.getElementById('total-expense').innerText = `¥${totalExpense.toLocaleString()}`;
        document.getElementById('total-income').innerText = `¥${totalIncome.toLocaleString()}`;

        // Progress Bar
        const percent = Math.min((totalExpense / goals.expenseTargetMax) * 100, 100);
        document.getElementById('expense-progress-bar').style.width = `${percent}%`;
        document.getElementById('expense-progress-text').innerText = `¥${totalExpense.toLocaleString()} / ¥${Number(goals.expenseTargetMax).toLocaleString()}`;

        // AI Mini Comment
        document.getElementById('ai-mini-comment').innerText = AILogic.getMiniComment(totalExpense, goals);

        // Recent List
        const recentList = document.getElementById('recent-list');
        const viewAllBtn = document.getElementById('view-all-btn');
        let recentEntries = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));

        if (this.showAllRecent) {
            viewAllBtn.innerText = 'とじる';
        } else {
            viewAllBtn.innerText = 'すべて見る';
            recentEntries = recentEntries.slice(0, 5);
        }

        if (recentEntries.length > 0) {
            recentList.innerHTML = recentEntries.map(e => Components.renderTransaction(e)).join('');
            this.refreshIcons();
        } else {
            recentList.innerHTML = '<p class="text-center py-10 text-gray-400 text-sm italic">まだデータがないよ 🕊️</p>';
        }
    },

    renderStats() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        document.getElementById('stats-month-label').innerText = `${year}年${month + 1}月`;

        const monthEntries = Storage.getEntries().filter(e => {
            const d = new Date(e.date);
            return d.getFullYear() === year && d.getMonth() === month && e.type === 'expense';
        });

        // 1. Category Chart
        const categoryData = {};
        const categories = Storage.getCategories();
        monthEntries.forEach(e => {
            categoryData[e.category] = (categoryData[e.category] || 0) + Number(e.amount);
        });

        const catLabels = Object.keys(categoryData);
        const catValues = Object.values(categoryData);
        const catColors = catLabels.map(label => {
            const cat = categories.find(c => c.name === label);
            return cat ? cat.color : '#cbd5e1';
        });

        const ctxCat = document.getElementById('chart-canvas').getContext('2d');
        if (this.chart) this.chart.destroy();
        if (catLabels.length > 0) {
            this.chart = new Chart(ctxCat, this.getChartConfig(catLabels, catValues, catColors));
        }

        // 2. Payment Method Chart
        const paymentData = {};
        monthEntries.forEach(e => {
            const method = e.paymentMethod || '未選択';
            paymentData[method] = (paymentData[method] || 0) + Number(e.amount);
        });

        const payLabels = Object.keys(paymentData);
        const payValues = Object.values(paymentData);
        const payColors = payLabels.map((_, i) => this.COLOR_PALETTE[i % this.COLOR_PALETTE.length]);

        const ctxPay = document.getElementById('payment-chart-canvas').getContext('2d');
        if (this.paymentChart) this.paymentChart.destroy();
        if (payLabels.length > 0) {
            this.paymentChart = new Chart(ctxPay, this.getChartConfig(payLabels, payValues, payColors));
        }
    },

    getChartConfig(labels, data, colors) {
        return {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { usePointStyle: true, font: { size: 10 } } }
                },
                cutout: '70%'
            }
        };
    },

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        document.getElementById('cal-month-label').innerText = `${year}年${month + 1}月`;
        const entries = Storage.getEntries();
        const calendarBody = document.getElementById('calendar-body');
        calendarBody.innerHTML = Components.renderCalendar(year, month, entries);
    },

    renderSaving() {
        const goals = Storage.getSavingGoals();
        const entries = Storage.getEntries();
        const setupForm = document.getElementById('saving-setup-form');
        const statsArea = document.getElementById('saving-stats');

        if (!goals || goals.targetAmount <= 0) {
            setupForm.classList.remove('hidden');
            statsArea.classList.add('hidden');
            return;
        }

        setupForm.classList.add('hidden');
        statsArea.classList.remove('hidden');

        // Calculate stats
        const now = new Date();
        const totalIncome = entries.filter(e => e.type === 'income').reduce((sum, e) => sum + Number(e.amount), 0);
        const totalExpense = entries.filter(e => e.type === 'expense').reduce((sum, e) => sum + Number(e.amount), 0);
        const currentSavings = totalIncome - totalExpense;

        const monthEntries = entries.filter(e => {
            const d = new Date(e.date);
            return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        });
        const monthlySavings = monthEntries.filter(e => e.type === 'income').reduce((sum, e) => sum + Number(e.amount), 0) -
            monthEntries.filter(e => e.type === 'expense').reduce((sum, e) => sum + Number(e.amount), 0);

        // UI Update
        document.getElementById('saving-total-amount').innerText = `¥${Math.max(0, currentSavings).toLocaleString()}`;
        document.getElementById('saving-monthly-amount').innerText = `¥${monthlySavings.toLocaleString()}`;

        const remain = Math.max(0, goals.targetAmount - currentSavings);
        const percent = Math.min(100, (currentSavings / goals.targetAmount) * 100);
        document.getElementById('saving-progress-text').innerText = `達成率 ${Math.round(percent)}%`;
        document.getElementById('saving-remain-text').innerText = `あと ¥${remain.toLocaleString()}`;
        document.getElementById('saving-progress-bar').style.width = `${percent}%`;

        // AI Comment
        document.getElementById('ai-saving-comment').innerText = AILogic.analyzeSavings();
        this.refreshIcons();
    },

    renderSettings() {
        const goals = Storage.getGoals();
        document.getElementById('goal-income').value = goals.incomeTarget;
        document.getElementById('goal-expense-max').value = goals.expenseTargetMax;

        // Render categories & payments
        document.getElementById('expense-cat-list').innerHTML = Components.renderSettingsCategoryList('expense');
        document.getElementById('income-cat-list').innerHTML = Components.renderSettingsCategoryList('income');
        document.getElementById('payment-method-list').innerHTML = Components.renderSettingsPaymentMethodList();
        this.refreshIcons();
    },

    refreshIcons() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    },

    handleAddCategory(type) {
        const inputId = type === 'expense' ? 'add-expense-cat-input' : 'add-income-cat-input';
        const input = document.getElementById(inputId);
        const name = input.value.trim();
        if (!name) return;

        Storage.addCategory({
            name: name,
            type: type,
            color: this.COLOR_PALETTE[Storage.getCategories().length % this.COLOR_PALETTE.length],
            icon: type === 'expense' ? 'tag' : 'circle-dollar-sign'
        });

        input.value = '';
        this.renderSettings();
        this.updateCategoryLists();
    },

    handleDeleteCategory(id) {
        Storage.deleteCategory(id);
        this.renderSettings();
        this.updateCategoryLists();
    },

    handleAddPaymentMethod() {
        const input = document.getElementById('add-payment-method-input');
        const name = input.value.trim();
        if (!name) return;

        Storage.addPaymentMethod(name);
        input.value = '';
        this.renderSettings();
        this.updatePaymentLists();
    },

    handleDeletePaymentMethod(id) {
        Storage.deletePaymentMethod(id);
        this.renderSettings();
        this.updatePaymentLists();
    },

    handleSave() {
        const type = document.querySelector('.type-toggle-btn.bg-white').dataset.type;
        const date = document.getElementById('input-date').value || new Date().toISOString().split('T')[0];
        const category = document.getElementById('input-category').value;
        const paymentMethod = document.getElementById('input-payment').value;
        const amount = document.getElementById('input-amount').value;
        const item = document.getElementById('input-item').value;
        const necessity = type === 'expense' ? this.selectedStars * 20 : 100;

        if (!amount) {
            alert('きんがくを入力してね！');
            return;
        }

        const entryData = { date, type, category, paymentMethod, amount, item, necessity };

        if (this.editingId) {
            entryData.id = this.editingId;
            Storage.updateEntry(entryData);
        } else {
            Storage.saveEntry(entryData);
        }

        // Reset form
        document.getElementById('input-amount').value = '';
        document.getElementById('input-item').value = '';
        this.selectedStars = 0;
        document.querySelectorAll('.star-btn').forEach(b => b.classList.add('text-gray-300'));

        this.switchView('dashboard');
    },

    handleSaveGoals() {
        const income = document.getElementById('goal-income').value;
        const max = document.getElementById('goal-expense-max').value;

        Storage.saveGoals({
            incomeTarget: Number(income),
            expenseTargetMin: 0,
            expenseTargetMax: Number(max)
        });

        alert('目標をほぞんしたよ ✨');
    },

    handleSaveSavingGoals() {
        const income = document.getElementById('saving-monthly-income').value;
        const target = document.getElementById('saving-target-amount').value;
        const date = document.getElementById('saving-target-date').value;

        if (!income || !target) {
            alert('月収と目標額を入力してね！');
            return;
        }

        Storage.saveSavingGoals({
            monthlyIncome: Number(income),
            targetAmount: Number(target),
            targetDate: date
        });

        this.renderSaving();
    },

    handleEdit(id) {
        const entry = Storage.getEntries().find(e => e.id === id);
        if (!entry) return;

        this.editingId = id;
        this.switchView('add');

        // Populate form
        const typeBtn = document.querySelector(`.type-toggle-btn[data-type="${entry.type}"]`);
        if (typeBtn) typeBtn.click();

        document.getElementById('input-date').value = entry.date;
        document.getElementById('input-category').value = entry.category;
        document.getElementById('input-payment').value = entry.paymentMethod || '';
        document.getElementById('input-amount').value = entry.amount;
        document.getElementById('input-item').value = entry.item || '';

        const starVal = Math.round(entry.necessity / 20);
        this.selectedStars = starVal;
        document.querySelectorAll('.star-btn').forEach((b, i) => {
            if (i < starVal) {
                b.classList.remove('text-gray-300');
                b.classList.add('text-yellow-400');
            } else {
                b.classList.remove('text-yellow-400');
                b.classList.add('text-gray-300');
            }
        });
    },

    handleDeleteEntry() {
        if (!this.editingId) return;
        if (confirm('このきろくを消してもいい？ 🕊️')) {
            Storage.deleteEntry(this.editingId);
            this.editingId = null;
            this.switchView('dashboard');
        }
    },

    changeMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.render();
    },

    generateFullAdvice() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const advice = AILogic.assessMonth(year, month);
        document.getElementById('ai-full-comment').innerText = advice;
    },

    updateCategoryLists(type = null) {
        if (!type) {
            const activeBtn = document.querySelector('.type-toggle-btn.bg-white');
            type = activeBtn ? activeBtn.dataset.type : 'expense';
        }
        const select = document.getElementById('input-category');
        select.innerHTML = Components.renderCategoryOptions(type);
    },

    updatePaymentLists() {
        const select = document.getElementById('input-payment');
        if (select) {
            select.innerHTML = Components.renderPaymentMethodOptions();
        }
    }
};

// Start the app
document.addEventListener('DOMContentLoaded', () => {
    App.init();
    // Default date to today
    document.getElementById('input-date').value = new Date().toISOString().split('T')[0];
});
