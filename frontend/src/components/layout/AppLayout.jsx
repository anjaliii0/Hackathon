import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import styles from './AppLayout.module.css';

export default function AppLayout() {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return <div className={styles.loading}><div className={styles.spinner} /></div>;
  if (!isLoggedIn) return <Navigate to="/login" replace />;

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
