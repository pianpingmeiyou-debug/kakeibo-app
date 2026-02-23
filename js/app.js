const App = {
    currentView: 'dashboard',
    currentDate: new Date(),
    selectedStars: 0,
    chart: null,
    COLOR_PALETTE: [
        '#FFB7C5', '#B5EAD7', '#FDFD96', '#E0BBE4', '#FFD1DC', '#D4F1F4',
        '#C7CEEA', '#FFDAC1', '#BFFCC6', '#FFFFD1', '#97C1A9', '#85E3FF'
    ],

    init() {
        this.setupEventListeners();
        this.render();
        this.updateCategoryLists();
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
        document.getElementById('add-entry-btn').addEventListener('click', () => this.switchView('add'));
        document.getElementById('cancel-btn').addEventListener('click', () => this.switchView('dashboard'));

        // Type toggle (Income/Expense)
        document.querySelectorAll('.type-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.type-toggle-btn').forEach(b => b.classList.remove('bg-white', 'shadow-sm', 'text-ribbon-pink'));
                document.querySelectorAll('.type-toggle-btn').forEach(b => b.classList.add('text-gray-400'));
                btn.classList.remove('text-gray-400');
                btn.classList.add('bg-white', 'shadow-sm', 'text-ribbon-pink');

                const type = btn.dataset.type;
                const necessityContainer = document.getElementById('necessity-container');
                if (type === 'income') {
                    necessityContainer.classList.add('opacity-30', 'pointer-events-none');
                } else {
                    necessityContainer.classList.remove('opacity-30', 'pointer-events-none');
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

        // Calendar Month Control
        document.getElementById('cal-prev-month').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('cal-next-month').addEventListener('click', () => this.changeMonth(1));

        // Category Management in Settings
        document.getElementById('add-expense-cat-btn').addEventListener('click', () => this.handleAddCategory('expense'));
        document.getElementById('add-income-cat-btn').addEventListener('click', () => this.handleAddCategory('income'));

        // Delete Category Delegation
        document.getElementById('settings-view').addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete-cat-btn');
            if (deleteBtn) {
                const id = deleteBtn.dataset.id;
                this.handleDeleteCategory(id);
            }
        });
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

        this.render();
    },

    render() {
        if (this.currentView === 'dashboard') {
            this.renderDashboard();
        } else if (this.currentView === 'stats') {
            this.renderStats();
        } else if (this.currentView === 'calendar') {
            this.renderCalendar();
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
        const recentEntries = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

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

        const entries = Storage.getEntries().filter(e => {
            const d = new Date(e.date);
            return d.getFullYear() === year && d.getMonth() === month && e.type === 'expense';
        });

        // Prepare chart data
        const categoryData = {};
        const categories = Storage.getCategories();
        entries.forEach(e => {
            categoryData[e.category] = (categoryData[e.category] || 0) + Number(e.amount);
        });

        const labels = Object.keys(categoryData);
        const data = Object.values(categoryData);
        const colors = labels.map(label => {
            const cat = categories.find(c => c.name === label);
            return cat ? cat.color : '#cbd5e1';
        });

        const ctx = document.getElementById('chart-canvas').getContext('2d');
        if (this.chart) this.chart.destroy();

        if (labels.length > 0) {
            this.chart = new Chart(ctx, {
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
            });
        }
    },

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        document.getElementById('cal-month-label').innerText = `${year}年${month + 1}月`;
        const entries = Storage.getEntries();
        const calendarBody = document.getElementById('calendar-body');
        calendarBody.innerHTML = Components.renderCalendar(year, month, entries);
    },

    renderSettings() {
        const goals = Storage.getGoals();
        document.getElementById('goal-income').value = goals.incomeTarget;
        document.getElementById('goal-expense-min').value = goals.expenseTargetMin;
        document.getElementById('goal-expense-max').value = goals.expenseTargetMax;

        // Render categories
        document.getElementById('expense-cat-list').innerHTML = Components.renderSettingsCategoryList('expense');
        document.getElementById('income-cat-list').innerHTML = Components.renderSettingsCategoryList('income');
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
        // Force refresh the entry form category list as well
        this.updateCategoryLists();
    },

    handleDeleteCategory(id) {
        Storage.deleteCategory(id);
        this.renderSettings();
        this.updateCategoryLists();
    },

    handleSave() {
        const type = document.querySelector('.type-toggle-btn.bg-white').dataset.type;
        const date = document.getElementById('input-date').value || new Date().toISOString().split('T')[0];
        const category = document.getElementById('input-category').value;
        const amount = document.getElementById('input-amount').value;
        const item = document.getElementById('input-item').value;
        const necessity = type === 'expense' ? this.selectedStars * 20 : 100;

        if (!amount) {
            alert('きんがくを入力してね！');
            return;
        }

        Storage.saveEntry({ date, type, category, amount, item, necessity });

        // Reset form
        document.getElementById('input-amount').value = '';
        document.getElementById('input-item').value = '';
        this.selectedStars = 0;
        document.querySelectorAll('.star-btn').forEach(b => b.classList.add('text-gray-300'));

        this.switchView('dashboard');
    },

    handleSaveGoals() {
        const income = document.getElementById('goal-income').value;
        const min = document.getElementById('goal-expense-min').value;
        const max = document.getElementById('goal-expense-max').value;

        Storage.saveGoals({
            incomeTarget: Number(income),
            expenseTargetMin: Number(min),
            expenseTargetMax: Number(max)
        });

        alert('目標を保存したよ ✨');
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
        // If type is not provided, use the current active type in entry form
        if (!type) {
            const activeBtn = document.querySelector('.type-toggle-btn.bg-white');
            type = activeBtn ? activeBtn.dataset.type : 'expense';
        }
        const select = document.getElementById('input-category');
        select.innerHTML = Components.renderCategoryOptions(type);
    }
};

// Start the app
document.addEventListener('DOMContentLoaded', () => {
    App.init();
    // Default date to today
    document.getElementById('input-date').value = new Date().toISOString().split('T')[0];
});

