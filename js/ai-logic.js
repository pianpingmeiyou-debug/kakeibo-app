const AILogic = {
    assessMonth(year, month) {
        const entries = Storage.getEntries();
        const goals = Storage.getGoals();

        // Filter entries for the specific month
        const monthEntries = entries.filter(e => {
            const date = new Date(e.date);
            return date.getFullYear() === year && date.getMonth() === month;
        });

        if (monthEntries.length === 0) {
            return "まだ今月のきろくがないみたい。少しずつ書いてみてね 🌸";
        }

        const totalIncome = monthEntries.filter(e => e.type === 'income').reduce((sum, e) => sum + Number(e.amount), 0);
        const totalExpense = monthEntries.filter(e => e.type === 'expense').reduce((sum, e) => sum + Number(e.amount), 0);
        const balance = totalIncome - totalExpense;

        // Analyze waste (necessity < 60% / 3 stars)
        const wasteEntries = monthEntries.filter(e => e.type === 'expense' && Number(e.necessity) < 60);
        const wasteTotal = wasteEntries.reduce((sum, e) => sum + Number(e.amount), 0);

        // Find most wasteful category
        const categoryWaste = {};
        wasteEntries.forEach(e => {
            categoryWaste[e.category] = (categoryWaste[e.category] || 0) + Number(e.amount);
        });
        const worstCategory = Object.entries(categoryWaste).sort((a, b) => b[1] - a[1])[0];

        // Generate advice
        let advice = `今月もお疲れさまでした 🌸\n`;
        advice += `収入は ${totalIncome.toLocaleString()}円、支出は ${totalExpense.toLocaleString()}円、差額は ${balance.toLocaleString()}円でした！\n\n`;

        if (wasteTotal > 0) {
            advice += `「あまり必要なかったかも...」という出費が合計 ${wasteTotal.toLocaleString()}円ありました。`;
            if (worstCategory) {
                advice += `特に「${worstCategory[0]}」の項目で少し意識すると、さらにお金が貯まりやすくなるよ♪\n`;
            }
        } else {
            advice += `今は無駄な出費が全然なくて、とってもえらいです！この調子で頑張ろう✨\n`;
        }

        if (totalExpense > goals.expenseTargetMax) {
            advice += `\n目標のししゅつ額を少し超えてしまったみたい。来月はもう少し「がまん」も必要かもしれないけど、無理はしないでね(>_<)`;
        } else if (totalExpense <= goals.expenseTargetMax && totalExpense >= goals.expenseTargetMin) {
            advice += `\n目標のししゅつ額にぴったり収まってるね！素晴らしいコントロールです🌸`;
        } else {
            advice += `\n目標よりもずっと節約できていて、とっても優秀だよ！自分へのご褒美も忘れないでね(^▽^)/`;
        }

        return advice;
    },

    getMiniComment(totalExpense, goals) {
        if (totalExpense === 0) return "こんにちは！今月のあなたの家計を一緒に見守るね 🌸";
        const percent = (totalExpense / goals.expenseTargetMax) * 100;

        if (percent > 90) return "目標まであと少し！使いすぎに気をつけてね ⚠️";
        if (percent > 50) return "ちょうど半分くらい使ったよ。順調だね ✨";
        return "いい感じに節約できてるね！その調子 🌸";
    }
};
