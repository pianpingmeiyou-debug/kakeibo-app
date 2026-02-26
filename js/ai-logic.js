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

        // Add payment method insight
        const paymentInsight = this.analyzePaymentMethods(monthEntries);
        if (paymentInsight) {
            advice += `\n${paymentInsight}\n`;
        }

        if (totalExpense > goals.expenseTargetMax) {
            advice += `\n目標のししゅつ額を少し超えてしまったみたい。来月はもう少し「がまん」も必要かもしれないけど、無理はしないでね(>_<)`;
        } else if (totalExpense > goals.expenseTargetMax * 0.8) {
            advice += `\n目標のししゅつ額に近いけど、しっかり範囲内に収まってるね！素晴らしいコントロールです🌸`;
        } else {
            advice += `\n目標よりもずっと節約できていて、とっても優秀だよ！自分へのご褒美も忘れないでね(^▽^)/`;
        }

        return advice;
    },

    analyzePaymentMethods(entries) {
        const expenseEntries = entries.filter(e => e.type === 'expense');
        if (expenseEntries.length === 0) return null;

        const payments = {};
        expenseEntries.forEach(e => {
            const method = e.paymentMethod || '未選択';
            payments[method] = (payments[method] || 0) + Number(e.amount);
        });

        const sorted = Object.entries(payments).sort((a, b) => b[1] - a[1]);
        const mainMethod = sorted[0][0];

        if (mainMethod === 'クレジット') {
            return `今月は「クレジット」の利用が多かったみたい。使いすぎに注意しながら、ポイントも賢く貯められたかな？ 😊`;
        } else if (mainMethod === 'QR決済') {
            return `今月は「QR決済」をよく使ったね！キャッシュレス派でとってもスマートだね ✨`;
        }
        return `今月は「${mainMethod}」での支払いが一番多かったよ。`;
    },

    analyzeSavings() {
        const entries = Storage.getEntries();
        const savingGoals = Storage.getSavingGoals();

        let baseMessage = "記録をきちんとつけるほど、分析度がアップするよ 🌸\n\n";

        if (!savingGoals || savingGoals.targetAmount <= 0) {
            return baseMessage + "貯金目標を設定すると、AIが達成までの道のりをアドバイスするよ 🌸";
        }

        const totalIncomeAcrossTime = entries.filter(e => e.type === 'income').reduce((sum, e) => sum + Number(e.amount), 0);
        const totalExpenseAcrossTime = entries.filter(e => e.type === 'expense').reduce((sum, e) => sum + Number(e.amount), 0);
        const currentSavings = totalIncomeAcrossTime - totalExpenseAcrossTime;

        let advice = "";
        const entryCount = entries.length;

        if (currentSavings >= savingGoals.targetAmount) {
            advice = "おめでとう！目標の貯金額を達成しているよ！本当にすごいね ✨";
        } else {
            // Entry count based accuracy improvement
            if (entryCount < 5) {
                advice = "まだ記録が少ないから、これからもっと詳しく分析できるようになるよ。まずは毎日の記録を楽しもう！ 😊";
            } else if (entryCount < 20) {
                advice = "記録が溜まってきたね！少しずつあなたの傾向が見えてきたよ。この調子で続けていこう ✨";
            } else {
                advice = "たくさんの記録ありがとう！分析の精度が最高レベルだよ 💎 ";
            }

            // Monthly average (last 3 months or all if less)
            const now = new Date();
            const monthlyBalances = {};
            entries.forEach(e => {
                const d = new Date(e.date);
                const m = `${d.getFullYear()}-${d.getMonth()}`;
                if (!monthlyBalances[m]) monthlyBalances[m] = { inc: 0, exp: 0 };
                if (e.type === 'income') monthlyBalances[m].inc += Number(e.amount);
                else monthlyBalances[m].exp += Number(e.amount);
            });

            const balances = Object.values(monthlyBalances).map(b => b.inc - b.exp);
            const avgSaving = balances.length > 0 ? balances.reduce((a, b) => a + b, 0) / balances.length : 0;

            if (savingGoals.targetDate) {
                const [tYear, tMonth] = savingGoals.targetDate.split('-').map(Number);
                const targetDateObj = new Date(tYear, tMonth - 1, 1);
                const diffMonths = (targetDateObj.getFullYear() - now.getFullYear()) * 12 + (targetDateObj.getMonth() - now.getMonth());

                if (diffMonths > 0) {
                    const remain = savingGoals.targetAmount - currentSavings;
                    const neededPerMonth = remain / diffMonths;
                    const maxExpense = savingGoals.monthlyIncome - neededPerMonth;

                    advice += `\n\n${savingGoals.targetDate}までに目標を達成するには、月々の支出を ${Math.max(0, Math.round(maxExpense)).toLocaleString()}円以内に抑えると良さそうだよ😊`;
                }
            }

            if (avgSaving > 0) {
                const monthsToGoal = (savingGoals.targetAmount - currentSavings) / avgSaving;
                advice += `\n\nこのペースだと、あと **${Math.ceil(monthsToGoal)}か月** で目標の金額に届きそうだね。未来が明るくなりそう！ ✨`;
            } else if (entryCount >= 5) {
                advice += "\n\n今は「回復フェーズ」だね。少しずつ収支を整えていけば、きっと目標に近づけるよ。応援してるね ♡";
            }
        }

        return baseMessage + advice;
    },

    getMiniComment(totalExpense, goals) {
        if (totalExpense === 0) return "こんにちは！今月のあなたの家計を一緒に見守るね 🌸";
        const percent = (totalExpense / goals.expenseTargetMax) * 100;

        if (percent > 90) return "目標まであと少し！使いすぎに気をつけてね ⚠️";
        if (percent > 50) return "ちょうど半分くらい使ったよ。順調だね ✨";
        return "いい感じに節約できてるね！その調子 🌸";
    }
};
