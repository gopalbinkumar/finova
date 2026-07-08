// ─── Finova Mock Data ─────────────────────────────────────────────────────────
// All dummy data used across the entire UI
export const mockUser = {
    id: 1,
    name: 'Alex Johnson',
    email: 'alex@finova.app',
    phone: '+1 (555) 123-4567',
    avatar_url: null,
    currency: 'USD',
    timezone: 'America/New_York',
    theme: 'system',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z',
};
// ─── Accounts ────────────────────────────────────────────────────────────────
export const mockAccounts = [
    { id: 1, name: 'Chase Checking', type: 'bank', balance: 12_450.75, color: '#2563EB', icon: '🏦', currency: 'USD' },
    { id: 2, name: 'Savings Account', type: 'bank', balance: 35_200.00, color: '#0F172A', icon: '💰', currency: 'USD' },
    { id: 3, name: 'Cash Wallet', type: 'cash', balance: 280.50, color: '#F59E0B', icon: '💵', currency: 'USD' },
    { id: 4, name: 'Visa Credit', type: 'credit_card', balance: -2_150.30, color: '#EF4444', icon: '💳', currency: 'USD' },
    { id: 5, name: 'GoPay', type: 'e_wallet', balance: 450.00, color: '#3B82F6', icon: '📱', currency: 'USD' },
    { id: 6, name: 'Investment Acc', type: 'bank', balance: 18_900.00, color: '#8B5CF6', icon: '📈', currency: 'USD' },
];
export const totalBalance = mockAccounts.reduce((sum, a) => sum + a.balance, 0);
// ─── Categories ──────────────────────────────────────────────────────────────
export const mockCategories = [
    { id: 1, name: 'Salary', type: 'income', icon: '💼', color: '#2563EB' },
    { id: 2, name: 'Freelance', type: 'income', icon: '💻', color: '#10B981' },
    { id: 3, name: 'Investment', type: 'income', icon: '📈', color: '#6366F1' },
    { id: 4, name: 'Food & Dining', type: 'expense', icon: '🍔', color: '#F59E0B' },
    { id: 5, name: 'Transport', type: 'expense', icon: '🚗', color: '#3B82F6' },
    { id: 6, name: 'Shopping', type: 'expense', icon: '🛍️', color: '#EC4899' },
    { id: 7, name: 'Utilities', type: 'expense', icon: '⚡', color: '#F97316' },
    { id: 8, name: 'Healthcare', type: 'expense', icon: '🏥', color: '#EF4444' },
    { id: 9, name: 'Entertainment', type: 'expense', icon: '🎬', color: '#8B5CF6' },
    { id: 10, name: 'Education', type: 'expense', icon: '📚', color: '#14B8A6' },
    { id: 11, name: 'Rent', type: 'expense', icon: '🏠', color: '#64748B' },
    { id: 12, name: 'Travel', type: 'expense', icon: '✈️', color: '#06B6D4' },
];
// ─── Transactions ─────────────────────────────────────────────────────────────
export const mockTransactions = [
    { id: 1, account: 'Chase Checking', category: 'Salary', type: 'income', amount: 5500.00, date: '2024-06-28', description: 'Monthly salary - June', attachment: null },
    { id: 2, account: 'GoPay', category: 'Food & Dining', type: 'expense', amount: 32.50, date: '2024-06-27', description: 'McDonald\'s lunch', attachment: null },
    { id: 3, account: 'Chase Checking', category: 'Rent', type: 'expense', amount: 1800.00, date: '2024-06-26', description: 'Monthly rent payment', attachment: null },
    { id: 4, account: 'Visa Credit', category: 'Shopping', type: 'expense', amount: 245.99, date: '2024-06-25', description: 'Amazon - Electronics', attachment: null },
    { id: 5, account: 'Chase Checking', category: 'Freelance', type: 'income', amount: 800.00, date: '2024-06-24', description: 'Web design project', attachment: null },
    { id: 6, account: 'Cash Wallet', category: 'Transport', type: 'expense', amount: 15.00, date: '2024-06-23', description: 'Uber ride', attachment: null },
    { id: 7, account: 'Visa Credit', category: 'Entertainment', type: 'expense', amount: 59.99, date: '2024-06-22', description: 'Netflix + Spotify', attachment: null },
    { id: 8, account: 'Chase Checking', category: 'Utilities', type: 'expense', amount: 123.45, date: '2024-06-21', description: 'Electric bill', attachment: null },
    { id: 9, account: 'Savings Account', category: 'Investment', type: 'income', amount: 320.00, date: '2024-06-20', description: 'Dividend payout', attachment: null },
    { id: 10, account: 'GoPay', category: 'Food & Dining', type: 'expense', amount: 48.75, date: '2024-06-19', description: 'GrabFood order', attachment: null },
    { id: 11, account: 'Chase Checking', category: 'Healthcare', type: 'expense', amount: 95.00, date: '2024-06-18', description: 'Doctor visit copay', attachment: null },
    { id: 12, account: 'Chase Checking', category: 'Education', type: 'expense', amount: 299.00, date: '2024-06-17', description: 'Online course - React', attachment: null },
    { id: 13, account: 'Savings Account', category: 'Chase Checking', type: 'transfer', amount: 500.00, date: '2024-06-16', description: 'Transfer to Savings', attachment: null },
    { id: 14, account: 'Visa Credit', category: 'Travel', type: 'expense', amount: 450.00, date: '2024-06-15', description: 'Flight tickets - NYC', attachment: null },
    { id: 15, account: 'Chase Checking', category: 'Salary', type: 'income', amount: 5500.00, date: '2024-05-31', description: 'Monthly salary - May', attachment: null },
];
// ─── Budgets ──────────────────────────────────────────────────────────────────
export const mockBudgets = [
    { id: 1, category: 'Food & Dining', icon: '🍔', color: '#F59E0B', limit: 600, spent: 412.50, period: 'June 2024' },
    { id: 2, category: 'Transport', icon: '🚗', color: '#3B82F6', limit: 200, spent: 87.00, period: 'June 2024' },
    { id: 3, category: 'Shopping', icon: '🛍️', color: '#EC4899', limit: 400, spent: 385.99, period: 'June 2024' },
    { id: 4, category: 'Entertainment', icon: '🎬', color: '#8B5CF6', limit: 100, spent: 59.99, period: 'June 2024' },
    { id: 5, category: 'Healthcare', icon: '🏥', color: '#EF4444', limit: 150, spent: 95.00, period: 'June 2024' },
    { id: 6, category: 'Education', icon: '📚', color: '#14B8A6', limit: 500, spent: 299.00, period: 'June 2024' },
    { id: 7, category: 'Utilities', icon: '⚡', color: '#F97316', limit: 200, spent: 123.45, period: 'June 2024' },
    { id: 8, category: 'Travel', icon: '✈️', color: '#06B6D4', limit: 300, spent: 450.00, period: 'June 2024' },
];
// ─── Financial Goals ─────────────────────────────────────────────────────────
export const mockGoals = [
    { id: 1, name: 'Emergency Fund', icon: '🛡️', target: 20000, current: 14500, deadline: '2024-12-31', notes: '6 months of expenses', color: '#2563EB', allocations: [
        { account_id: 2, amount: 12000, notes: 'Main emergency savings' },
        { account_id: 3, amount: 2500, notes: 'Cash reserve' },
    ] },
    { id: 2, name: 'MacBook Pro', icon: '💻', target: 3500, current: 2100, deadline: '2024-09-30', notes: 'For work and side projects', color: '#3B82F6', allocations: [
        { account_id: 2, amount: 2100, notes: 'Device savings' },
    ] },
    { id: 3, name: 'Vacation - Bali', icon: '🌴', target: 5000, current: 1800, deadline: '2025-03-01', notes: '10 days trip', color: '#F59E0B', allocations: [
        { account_id: 1, amount: 1300, notes: 'Flight and hotel' },
        { account_id: 5, amount: 500, notes: 'Daily expenses' },
    ] },
    { id: 4, name: 'Down Payment', icon: '🏠', target: 50000, current: 18900, deadline: '2026-06-30', notes: 'House down payment 20%', color: '#8B5CF6', allocations: [
        { account_id: 2, amount: 15000, notes: 'Primary house fund' },
        { account_id: 6, amount: 3900, notes: 'Investment allocation' },
    ] },
    { id: 5, name: 'New Car', icon: '🚗', target: 25000, current: 25000, deadline: '2024-05-01', notes: 'Honda Civic 2024', color: '#10B981', allocations: [
        { account_id: 1, amount: 10000, notes: 'Checking allocation' },
        { account_id: 2, amount: 15000, notes: 'Savings allocation' },
    ] },
];
// ─── Investments ──────────────────────────────────────────────────────────────
export const mockInvestments = [
    { id: 1, symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', qty: 15, buyPrice: 145.00, currentPrice: 189.30, avgCost: 145.00, color: '#3B82F6' },
    { id: 2, symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock', qty: 5, buyPrice: 120.00, currentPrice: 172.50, avgCost: 120.00, color: '#34D399' },
    { id: 3, symbol: 'BTC', name: 'Bitcoin', type: 'crypto', qty: 0.25, buyPrice: 42000, currentPrice: 67200, avgCost: 42000, color: '#F59E0B' },
    { id: 4, symbol: 'ETH', name: 'Ethereum', type: 'crypto', qty: 2.5, buyPrice: 2200, currentPrice: 3450, avgCost: 2200, color: '#8B5CF6' },
    { id: 5, symbol: 'GOLD', name: 'Gold (1g)', type: 'gold', qty: 10, buyPrice: 58.00, currentPrice: 72.40, avgCost: 58.00, color: '#EAB308' },
    { id: 6, symbol: 'VTSAX', name: 'Vanguard Total Stock', type: 'mutual_fund', qty: 50, buyPrice: 100.00, currentPrice: 118.60, avgCost: 100.00, color: '#EC4899' },
];
// ─── Debts ────────────────────────────────────────────────────────────────────
export const mockDebts = [
    { id: 1, borrower: 'Student Loan', amount: 15000, remaining: 9200, dueDate: '2028-12-31', notes: 'Federal student loan', isPaid: false, type: 'debt' },
    { id: 2, borrower: 'Marcus Chen', amount: 500, remaining: 500, dueDate: '2024-07-15', notes: 'Borrowed for trip expense', isPaid: false, type: 'receivable' },
    { id: 3, borrower: 'Car Loan', amount: 12000, remaining: 7800, dueDate: '2026-08-01', notes: 'Honda Civic loan', isPaid: false, type: 'debt' },
    { id: 4, borrower: 'Sarah Wilson', amount: 200, remaining: 0, dueDate: '2024-05-01', notes: 'Emergency loan', isPaid: true, type: 'receivable' },
    { id: 5, borrower: 'Credit Card', amount: 2150, remaining: 2150, dueDate: '2024-07-05', notes: 'Visa card balance', isPaid: false, type: 'debt' },
];
// ─── Notifications ────────────────────────────────────────────────────────────
export const mockNotifications = [
    { id: 1, type: 'budget_alert', title: 'Travel Budget Exceeded!', body: 'You\'ve spent $450 of your $300 Travel budget (150%).', read: false, createdAt: '2024-06-28T10:30:00Z', icon: '⚠️' },
    { id: 2, type: 'budget_alert', title: 'Shopping Budget at 96%', body: 'You\'ve used $385.99 of your $400 Shopping budget.', read: false, createdAt: '2024-06-27T14:20:00Z', icon: '🔔' },
    { id: 3, type: 'goal_achieved', title: '🎉 Goal Achieved: New Car!', body: 'Congratulations! You\'ve reached your New Car savings goal.', read: false, createdAt: '2024-06-26T09:00:00Z', icon: '✅' },
    { id: 4, type: 'debt_due', title: 'Payment Due in 7 Days', body: 'Credit Card payment of $2,150 is due on July 5th.', read: true, createdAt: '2024-06-25T08:00:00Z', icon: '📅' },
    { id: 5, type: 'large_expense', title: 'Large Expense Detected', body: 'A transaction of $1,800 (Rent) was recorded.', read: true, createdAt: '2024-06-26T12:00:00Z', icon: '💸' },
    { id: 6, type: 'debt_due', title: 'Debt Due: Marcus Chen', body: 'Marcus Chen owes you $500. Due date: July 15th.', read: true, createdAt: '2024-06-20T08:00:00Z', icon: '💰' },
];
// ─── Chart Data ───────────────────────────────────────────────────────────────
export const monthlyChartData = [
    { month: 'Jan', income: 5800, expense: 4200 },
    { month: 'Feb', income: 5500, expense: 3800 },
    { month: 'Mar', income: 6200, expense: 4600 },
    { month: 'Apr', income: 5500, expense: 4100 },
    { month: 'May', income: 6300, expense: 3950 },
    { month: 'Jun', income: 6620, expense: 4167 },
];
export const expenseCategoryData = [
    { name: 'Rent', value: 1800, color: '#64748B' },
    { name: 'Food', value: 412, color: '#F59E0B' },
    { name: 'Shopping', value: 386, color: '#EC4899' },
    { name: 'Travel', value: 450, color: '#06B6D4' },
    { name: 'Transport', value: 87, color: '#3B82F6' },
    { name: 'Utilities', value: 123, color: '#F97316' },
    { name: 'Healthcare', value: 95, color: '#EF4444' },
    { name: 'Other', value: 814, color: '#8B5CF6' },
];
export const cashFlowData = [
    { day: '1', balance: 8200 },
    { day: '5', balance: 6850 },
    { day: '10', balance: 11900 },
    { day: '15', balance: 10200 },
    { day: '20', balance: 9800 },
    { day: '25', balance: 12100 },
    { day: '28', balance: 11200 },
];
export const investmentAllocationData = [
    { name: 'Stocks', value: 4209, color: '#3B82F6' },
    { name: 'Crypto', value: 19050, color: '#F59E0B' },
    { name: 'Gold', value: 724, color: '#EAB308' },
    { name: 'Mutual Funds', value: 5930, color: '#EC4899' },
];
// ─── Summary Stats ────────────────────────────────────────────────────────────
export const summaryStats = {
    totalBalance: 65_131.25,
    monthlyIncome: 6_620.00,
    monthlyExpense: 4_167.68,
    totalInvestment: 29_913.00,
    activeGoals: 4,
    activeDebts: 3,
    netWorth: 65_131.25 + 29_913.00 - 9_200 - 7_800 - 2_150,
};
// ─── Upcoming Bills ───────────────────────────────────────────────────────────
export const upcomingBills = [
    { name: 'Rent', amount: 1800, dueDate: 'Jul 1', icon: '🏠', color: '#64748B' },
    { name: 'Credit Card', amount: 2150, dueDate: 'Jul 5', icon: '💳', color: '#EF4444' },
    { name: 'Netflix', amount: 15.99, dueDate: 'Jul 10', icon: '🎬', color: '#8B5CF6' },
    { name: 'Electricity', amount: 120, dueDate: 'Jul 15', icon: '⚡', color: '#F97316' },
    { name: 'Car Loan', amount: 385, dueDate: 'Jul 20', icon: '🚗', color: '#3B82F6' },
];
