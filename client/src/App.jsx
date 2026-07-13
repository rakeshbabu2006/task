import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = '/api';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [transactionForm, setTransactionForm] = useState({ title: '', amount: '', type: 'Expense', category: '' });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  const token = localStorage.getItem('token');

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  const fetchTransactions = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API_URL}/transaction`, {
        headers: getAuthHeaders(),
      });
      setTransactions(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSummary = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API_URL}/summary`, {
        headers: getAuthHeaders(),
      });
      setSummary(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) {
      setIsLoggedIn(true);
      fetchTransactions();
      fetchSummary();
    }
  }, [token]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = authMode === 'login' ? '/login' : '/register';
      const response = await axios.post(`${API_URL}${endpoint}`, form);
      setMessage(response.data.message || 'Success');

      if (authMode === 'login' && response.data.token) {
        localStorage.setItem('token', response.data.token);
        setIsLoggedIn(true);
        setTimeout(() => {
          fetchTransactions();
          fetchSummary();
        }, 0);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Request failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setTransactions([]);
    setSummary({ totalIncome: 0, totalExpense: 0, balance: 0 });
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}/transaction/${editingId}`, transactionForm, {
          headers: getAuthHeaders(),
        });
        setMessage('Transaction updated');
      } else {
        await axios.post(`${API_URL}/transaction`, transactionForm, {
          headers: getAuthHeaders(),
        });
        setMessage('Transaction added');
      }

      setTransactionForm({ title: '', amount: '', type: 'Expense', category: '' });
      setEditingId(null);
      fetchTransactions();
      fetchSummary();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save transaction');
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setTransactionForm({
      title: item.title,
      amount: item.amount,
      type: item.type,
      category: item.category || '',
    });
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/transaction/${id}`, {
        headers: getAuthHeaders(),
      });
      setMessage('Transaction deleted');
      fetchTransactions();
      fetchSummary();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to delete transaction');
    }
  };

  return (
    <div className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">Smart money tracking</p>
          <h1>Expense Tracker</h1>
          <p className="hero-text">Stay on top of your income, expenses, and everyday balance in one calm workspace.</p>
        </div>
      </header>

      {message && <p className="message">{message}</p>}

      {!isLoggedIn ? (
        <div className="card auth-card">
          <div className="toggle">
            <button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>Login</button>
            <button className={authMode === 'register' ? 'active' : ''} onClick={() => setAuthMode('register')}>Register</button>
          </div>

          <form onSubmit={handleAuthSubmit}>
            {authMode === 'register' && (
              <input
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            )}
            <input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button type="submit">{authMode === 'login' ? 'Login' : 'Register'}</button>
          </form>
        </div>
      ) : (
        <>
          <div className="card summary-grid">
            <div className="summary-card income">
              <span>Income</span>
              <strong>Rs:{summary.totalIncome}</strong>
            </div>
            <div className="summary-card expense">
              <span>Expense</span>
              <strong>Rs:{summary.totalExpense}</strong>
            </div>
            <div className="summary-card balance">
              <span>Balance</span>
              <strong>Rs:{summary.balance}</strong>
            </div>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>

          <div className="card">
            <h2>{editingId ? 'Edit Transaction' : 'Add Transaction'}</h2>
            <form onSubmit={handleTransactionSubmit}>
              <input
                placeholder="Title"
                value={transactionForm.title}
                onChange={(e) => setTransactionForm({ ...transactionForm, title: e.target.value })}
              />
              <input
                placeholder="Amount"
                type="number"
                value={transactionForm.amount}
                onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
              />
              <select
                value={transactionForm.type}
                onChange={(e) => setTransactionForm({ ...transactionForm, type: e.target.value })}
              >
                <option value="Expense">Expense</option>
                <option value="Income">Income</option>
              </select>
              <input
                placeholder="Category"
                value={transactionForm.category}
                onChange={(e) => setTransactionForm({ ...transactionForm, category: e.target.value })}
              />
              <button type="submit">{editingId ? 'Update' : 'Add'}</button>
              {editingId && (
                <button type="button" onClick={() => {
                  setEditingId(null);
                  setTransactionForm({ title: '', amount: '', type: 'Expense', category: '' });
                }}>
                  Cancel
                </button>
              )}
            </form>
          </div>

          <div className="card">
            <h2>Transactions</h2>
            {transactions.length === 0 ? (
              <p>No transactions yet.</p>
            ) : (
              <ul>
                {transactions.map((item) => (
                  <li key={item._id}>
                    <div>
                      <strong>{item.title}</strong> — Rs:{item.amount} ({item.type})
                      <div className="meta">{item.category || 'Uncategorized'}</div>
                    </div>
                    <div className="actions">
                      <button type="button" onClick={() => handleEdit(item)}>Edit</button>
                      <button type="button" className="danger" onClick={() => handleDelete(item._id)}>Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
