import React, { useEffect, useState } from 'react';

function NotificationsPanel({ title = 'Notifications' }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load notifications');
      // Sort unread first then by date
      const sorted = [...(data.notifications || [])].sort((a, b) => {
        if (a.status === b.status) return new Date(b.notification_date) - new Date(a.notification_date);
        return a.status === 'PENDING' ? -1 : 1;
      });
      setNotifications(sorted);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // poll every 15s
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (notification_id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/notifications/${notification_id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to mark as read');
      await fetchNotifications();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="notifications-panel" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        <button className="button-secondary" onClick={fetchNotifications}>
          Refresh
        </button>
      </div>
      {loading ? (
        <div>Loading notifications...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : notifications.length === 0 ? (
        <div>No notifications yet.</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, marginTop: '12px' }}>
          {notifications.map((n) => (
            <li key={n.notification_id} style={{
              background: n.status === 'PENDING' ? '#fff8e1' : '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: 8,
              padding: '10px 12px',
              marginBottom: 8
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{n.type?.replace(/_/g, ' ')}</div>
                  <div style={{ fontSize: 14 }}>{n.message}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{new Date(n.notification_date).toLocaleString()}</div>
                </div>
                {n.status === 'PENDING' && (
                  <button className="action-button approve-button" onClick={() => markAsRead(n.notification_id)}>
                    Mark Read
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default NotificationsPanel;
