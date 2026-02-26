const Storage = {
    KEYS: {
        ENTRIES: 'ribbon_entries',
        CATEGORIES: 'ribbon_categories',
        GOALS: 'ribbon_goals',
        PAYMENT_METHODS: 'ribbon_payment_methods',
        SAVING_GOALS: 'ribbon_saving_goals'
    },

    // Initial default categories
    DEFAULT_CATEGORIES: [
        { id: 'cat1', name: '食費', color: '#FFB7C5', icon: 'utensils', type: 'expense' },
        { id: 'cat2', name: '友達', color: '#B5EAD7', icon: 'users', type: 'expense' },
        { id: 'cat3', name: '日用品', color: '#FDFD96', icon: 'shopping-bag', type: 'expense' },
        { id: 'cat4', name: '美容', color: '#E0BBE4', icon: 'sparkles', type: 'expense' },
        { id: 'cat5', name: '交通費', color: '#FFD1DC', icon: 'train', type: 'expense' },
        { id: 'cat6', name: 'その他', color: '#D4F1F4', icon: 'more-horizontal', type: 'expense' },
        // Income categories
        { id: 'inc1', name: 'バイト', color: '#B5EAD7', icon: 'briefcase', type: 'income' },
        { id: 'inc2', name: 'お小遣い', color: '#FFB7C5', icon: 'gift', type: 'income' },
        { id: 'inc3', name: 'メルカリ', color: '#FDFD96', icon: 'package', type: 'income' },
        { id: 'inc4', name: 'その他', color: '#D4F1F4', icon: 'more-horizontal', type: 'income' }
    ],

    DEFAULT_PAYMENT_METHODS: [
        { id: 'pay1', name: '現金' },
        { id: 'pay2', name: 'クレジット' },
        { id: 'pay3', name: 'QR決済' },
        { id: 'pay4', name: '電子マネー' }
    ],

    init() {
        if (!localStorage.getItem(this.KEYS.ENTRIES)) {
            localStorage.setItem(this.KEYS.ENTRIES, JSON.stringify([]));
        }

        const storedCats = localStorage.getItem(this.KEYS.CATEGORIES);
        if (!storedCats) {
            localStorage.setItem(this.KEYS.CATEGORIES, JSON.stringify(this.DEFAULT_CATEGORIES));
        } else {
            // Migration: Add type: 'expense' to existing categories if missing
            const cats = JSON.parse(storedCats);
            let updated = false;
            cats.forEach(c => {
                if (!c.type) {
                    c.type = 'expense';
                    updated = true;
                }
            });
            // Ensure income categories exist
            const hasIncome = cats.some(c => c.type === 'income');
            if (!hasIncome) {
                const incomeDefaults = this.DEFAULT_CATEGORIES.filter(c => c.type === 'income');
                cats.push(...incomeDefaults);
                updated = true;
            }

            // Ensure unique colors for all categories
            const palette = ['#FFB7C5', '#B5EAD7', '#FDFD96', '#E0BBE4', '#FFD1DC', '#D4F1F4', '#C7CEEA', '#FFDAC1', '#BFFCC6', '#FFFFD1', '#97C1A9', '#85E3FF'];
            const usedColors = new Set();
            cats.forEach((c, idx) => {
                if (!c.color || usedColors.has(c.color)) {
                    c.color = palette[idx % palette.length];
                    updated = true;
                }
                usedColors.add(c.color);
            });

            if (updated) {
                localStorage.setItem(this.KEYS.CATEGORIES, JSON.stringify(cats));
            }
        }

        if (!localStorage.getItem(this.KEYS.GOALS)) {
            localStorage.setItem(this.KEYS.GOALS, JSON.stringify({
                incomeTarget: 200000,
                expenseTargetMin: 100000,
                expenseTargetMax: 150000
            }));
        }

        if (!localStorage.getItem(this.KEYS.PAYMENT_METHODS)) {
            localStorage.setItem(this.KEYS.PAYMENT_METHODS, JSON.stringify(this.DEFAULT_PAYMENT_METHODS));
        }

        if (!localStorage.getItem(this.KEYS.SAVING_GOALS)) {
            localStorage.setItem(this.KEYS.SAVING_GOALS, JSON.stringify({
                monthlyIncome: 0,
                monthlyAvgExpense: 0,
                targetAmount: 0,
                targetDate: '' // 'YYYY-MM'
            }));
        }
    },

    // Entries (Income/Expense)
    saveEntry(entry) {
        const entries = this.getEntries();
        entry.id = Date.now().toString();
        entry.createdAt = new Date().toISOString();
        entries.push(entry);
        localStorage.setItem(this.KEYS.ENTRIES, JSON.stringify(entries));
        return entry;
    },

    getEntries() {
        return JSON.parse(localStorage.getItem(this.KEYS.ENTRIES) || '[]');
    },

    deleteEntry(id) {
        let entries = this.getEntries();
        entries = entries.filter(e => e.id !== id);
        localStorage.setItem(this.KEYS.ENTRIES, JSON.stringify(entries));
    },

    // Categories
    getCategories() {
        return JSON.parse(localStorage.getItem(this.KEYS.CATEGORIES) || JSON.stringify(this.DEFAULT_CATEGORIES));
    },

    addCategory(cat) {
        const cats = this.getCategories();
        cat.id = 'cat_' + Date.now();
        cats.push(cat);
        localStorage.setItem(this.KEYS.CATEGORIES, JSON.stringify(cats));
    },

    deleteCategory(id) {
        let cats = this.getCategories();
        cats = cats.filter(c => c.id !== id);
        localStorage.setItem(this.KEYS.CATEGORIES, JSON.stringify(cats));
    },

    // Payment Methods
    getPaymentMethods() {
        return JSON.parse(localStorage.getItem(this.KEYS.PAYMENT_METHODS) || JSON.stringify(this.DEFAULT_PAYMENT_METHODS));
    },

    addPaymentMethod(name) {
        const methods = this.getPaymentMethods();
        methods.push({ id: 'pay_' + Date.now(), name });
        localStorage.setItem(this.KEYS.PAYMENT_METHODS, JSON.stringify(methods));
    },

    deletePaymentMethod(id) {
        let methods = this.getPaymentMethods();
        methods = methods.filter(m => m.id !== id);
        localStorage.setItem(this.KEYS.PAYMENT_METHODS, JSON.stringify(methods));
    },

    // Goals
    getGoals() {
        return JSON.parse(localStorage.getItem(this.KEYS.GOALS));
    },

    saveGoals(goals) {
        localStorage.setItem(this.KEYS.GOALS, JSON.stringify(goals));
    },

    // Saving Goals
    getSavingGoals() {
        return JSON.parse(localStorage.getItem(this.KEYS.SAVING_GOALS));
    },

    saveSavingGoals(goals) {
        localStorage.setItem(this.KEYS.SAVING_GOALS, JSON.stringify(goals));
    }
};

// Initialize on load
Storage.init();
