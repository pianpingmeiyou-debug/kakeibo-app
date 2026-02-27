const Components = {
    renderTransaction(entry) {
        const categories = Storage.getCategories();
        const category = categories.find(c => c.name === entry.category) || categories[0];
        const isExpense = entry.type === 'expense';

        return `
            <div class="bg-white p-4 rounded-2xl shadow-soft flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 relative" data-id="${entry.id}">
                <button class="edit-entry-btn absolute top-1.5 right-3 text-[10px] bg-gray-50 px-2 py-1 rounded-lg text-gray-400 font-bold hover:bg-gray-100 transition-colors" data-id="${entry.id}">再編集</button>
                <div class="w-12 h-12 rounded-full flex items-center justify-center" style="background-color: ${category.color}33">
                    <i data-lucide="${category.icon || 'tag'}" style="color: ${category.color}"></i>
                </div>
                <div class="flex-1">
                    <h3 class="font-bold text-sm text-trailing-edit-container pr-12">${entry.item || entry.category}</h3>
                    <p class="text-[10px] text-gray-400">${new Date(entry.date).toLocaleDateString('ja-JP')} ・ ${entry.category} ${entry.paymentMethod ? `・ ${entry.paymentMethod}` : ''}</p>
                </div>
                <div class="text-right">
                    <p class="font-bold ${isExpense ? 'text-ribbon-pink' : 'text-blue-400'}">
                        ${isExpense ? '-' : '+'}${Number(entry.amount).toLocaleString()}円
                    </p>
                    ${isExpense ? `
                        <div class="flex justify-end gap-0.5 mt-1">
                            ${this.renderStars(entry.necessity)}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    renderStars(percent) {
        let stars = '';
        const count = Math.round(Number(percent) / 20);
        for (let i = 1; i <= 5; i++) {
            stars += `<i data-lucide="star" class="w-2.5 h-2.5 ${i <= count ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}"></i>`;
        }
        return stars;
    },

    renderCategoryOptions(type = 'expense') {
        const categories = Storage.getCategories().filter(c => c.type === type);
        return categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    },

    renderPaymentMethodOptions() {
        const methods = Storage.getPaymentMethods();
        return `<option value="">(未選択)</option>` + methods.map(m => `<option value="${m.name}">${m.name}</option>`).join('');
    },

    renderSettingsCategoryList(type = 'expense') {
        const categories = Storage.getCategories().filter(c => c.type === type);
        const defaults = Storage.DEFAULT_CATEGORIES.map(c => c.id);

        return categories.map(c => {
            const isDefault = defaults.includes(c.id);
            return `
                <div class="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 group">
                    <span class="text-gray-600">${c.name}</span>
                    ${!isDefault ? `
                        <button class="delete-cat-btn ml-1 text-gray-300 hover:text-red-400 transition-colors" data-id="${c.id}">
                            <i data-lucide="x" class="w-3 h-3"></i>
                        </button>
                    ` : ''}
                </div>
            `;
        }).join('');
    },

    renderSettingsPaymentMethodList() {
        const methods = Storage.getPaymentMethods();
        const defaults = Storage.DEFAULT_PAYMENT_METHODS.map(m => m.id);

        return methods.map(m => {
            const isDefault = defaults.includes(m.id);
            return `
                <div class="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 group">
                    <span class="text-gray-600">${m.name}</span>
                    ${!isDefault ? `
                        <button class="delete-pay-btn ml-1 text-gray-300 hover:text-red-400 transition-colors" data-id="${m.id}">
                            <i data-lucide="x" class="w-3 h-3"></i>
                        </button>
                    ` : ''}
                </div>
            `;
        }).join('');
    },

    renderCalendar(year, month, entries) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        let html = '';
        const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

        // Header
        dayNames.forEach(d => {
            html += `<div class="text-[10px] font-bold text-center py-2 text-gray-400">${d}</div>`;
        });

        // Padding
        for (let i = 0; i < startingDay; i++) {
            html += `<div class="p-2"></div>`;
        }

        // Days
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const dayEntries = entries.filter(e => e.date === dateStr);
            const dailyExpense = dayEntries.filter(e => e.type === 'expense').reduce((sum, e) => sum + Number(e.amount), 0);
            const dailyIncome = dayEntries.filter(e => e.type === 'income').reduce((sum, e) => sum + Number(e.amount), 0);

            let bgClass = '';
            if (dailyIncome > dailyExpense) bgClass = 'bg-blue-50';
            else if (dailyExpense > 10000) bgClass = 'bg-red-50';

            html += `
                <div class="p-1 border border-gray-50 min-h-[50px] ${bgClass} rounded-lg flex flex-col items-center justify-between">
                    <span class="text-[10px] font-medium text-gray-600">${i}</span>
                    <div class="flex flex-col items-center">
                        ${dailyIncome > 0 ? `<div class="text-[7px] text-blue-500 font-bold leading-none">+${dailyIncome}</div>` : ''}
                        ${dailyExpense > 0 ? `<div class="text-[7px] text-ribbon-pink font-bold leading-none">-${dailyExpense}</div>` : ''}
                    </div>
                </div>
            `;
        }
        return html;
    }
};
